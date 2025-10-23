import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const inventoryRouter = createTRPCRouter({
  // Obtener todos los items del inventario
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.item.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            EventItem: true,
            movements: true,
            reservations: true,
          },
        },
      },
    });
  }),

  // Obtener item por ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.item.findUnique({
        where: { id: input.id },
        include: {
          movements: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          reservations: {
            where: { status: "ACTIVE" },
            include: {
              event: {
                select: {
                  nombreCliente: true,
                  startDate: true,
                  endDate: true,
                },
              },
            },
          },
        },
      });
    }),

  // Crear nuevo item
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "El nombre es requerido"),
        type: z.string().min(1, "El tipo es requerido"),
        quantity: z.number().min(0, "La cantidad debe ser mayor o igual a 0"),
        unit: z.string().optional().default(""),
        imageUrl: z.string().optional().default(""),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validar que si hay imageUrl, sea una URL válida
      let imageUrl = input.imageUrl?.trim() || "";
      
      if (imageUrl && !imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
        throw new Error("La URL de la imagen debe comenzar con http:// o https://");
      }
      
      if (!imageUrl) {
        imageUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsnstZz_dVqG5A3vcpAdtB-cGp8u01zQnG7A&s";
      }

      return ctx.db.item.create({
        data: {
          name: input.name,
          type: input.type,
          quantity: input.quantity,
          unit: input.unit,
          imageUrl: imageUrl,
        },
      });
    }),

  // Actualizar item
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        type: z.string().min(1).optional(),
        quantity: z.number().min(0).optional(),
        unit: z.string().optional(),
        imageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.item.update({
        where: { id },
        data,
      });
    }),

  // Eliminar item
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.item.delete({
        where: { id: input.id },
      });
    }),

  // Ajustar stock (incrementar o decrementar)
  adjustStock: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        quantity: z.number(),
        type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.item.findUnique({
        where: { id: input.id },
      });

      if (!item) {
        throw new Error("Item no encontrado");
      }

      let newQuantity = item.quantity;
      
      if (input.type === "IN") {
        newQuantity += input.quantity;
      } else if (input.type === "OUT") {
        newQuantity -= input.quantity;
        if (newQuantity < 0) {
          throw new Error("Stock insuficiente");
        }
      } else {
        newQuantity = input.quantity;
      }

      // Actualizar item y crear movimiento
      const [updatedItem] = await ctx.db.$transaction([
        ctx.db.item.update({
          where: { id: input.id },
          data: { quantity: newQuantity },
        }),
        ctx.db.stockMovement.create({
          data: {
            itemId: input.id,
            type: input.type,
            quantity: input.quantity,
            reason: input.reason,
          },
        }),
      ]);

      return updatedItem;
    }),

  // Obtener tipos de items únicos
  getTypes: protectedProcedure.query(async ({ ctx }) => {
    const items = await ctx.db.item.findMany({
      select: { type: true },
      distinct: ["type"],
    });
    return items.map((item) => item.type);
  }),
});

