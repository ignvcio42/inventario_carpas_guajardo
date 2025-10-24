import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { TipoServicio } from "@prisma/client";

export const proveedorRouter = createTRPCRouter({
  // Obtener todos los proveedores
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.proveedor.findMany({
      orderBy: { nombre: "asc" },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }),

  // Obtener proveedor por ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.proveedor.findUnique({
        where: { id: input.id },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }),

  // Crear nuevo proveedor
  create: protectedProcedure
    .input(
      z.object({
        nombre: z.string().min(1, "El nombre es requerido"),
        email: z.string().email().optional().or(z.literal("")),
        telefono: z.string().optional(),
        direccion: z.string().optional(),
        tipoServicio: z.nativeEnum(TipoServicio),
        contacto: z.string().optional(),
        rut: z.string().optional(),
        notas: z.string().optional(),
        activo: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.proveedor.create({
        data: {
          ...input,
          email: input.email || undefined,
          createdById: ctx.session.user.id,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }),

  // Actualizar proveedor
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        nombre: z.string().min(1, "El nombre es requerido"),
        email: z.string().email().optional().or(z.literal("")),
        telefono: z.string().optional(),
        direccion: z.string().optional(),
        tipoServicio: z.nativeEnum(TipoServicio),
        contacto: z.string().optional(),
        rut: z.string().optional(),
        notas: z.string().optional(),
        activo: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.proveedor.update({
        where: { id: input.id },
        data: {
          ...input,
          email: input.email || undefined,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }),

  // Eliminar proveedor
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.proveedor.delete({
        where: { id: input.id },
      });
    }),

  // Buscar proveedores
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        tipoServicio: z.nativeEnum(TipoServicio).optional(),
        activo: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.proveedor.findMany({
        where: {
          AND: [
            {
              OR: [
                { nombre: { contains: input.query, mode: "insensitive" } },
                { email: { contains: input.query, mode: "insensitive" } },
                { contacto: { contains: input.query, mode: "insensitive" } },
                { telefono: { contains: input.query, mode: "insensitive" } },
              ],
            },
            input.tipoServicio ? { tipoServicio: input.tipoServicio } : {},
            input.activo !== undefined ? { activo: input.activo } : {},
          ],
        },
        orderBy: { nombre: "asc" },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }),

  // Obtener estadísticas de proveedores
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [
      totalProveedores,
      proveedoresPorTipo,
      proveedoresActivos,
      proveedoresInactivos,
    ] = await Promise.all([
      ctx.db.proveedor.count(),
      ctx.db.proveedor.groupBy({
        by: ["tipoServicio"],
        _count: { tipoServicio: true },
      }),
      ctx.db.proveedor.count({
        where: { activo: true },
      }),
      ctx.db.proveedor.count({
        where: { activo: false },
      }),
    ]);

    return {
      total: totalProveedores,
      porTipo: proveedoresPorTipo.map((item) => ({
        tipo: item.tipoServicio,
        count: item._count.tipoServicio,
      })),
      activos: proveedoresActivos,
      inactivos: proveedoresInactivos,
    };
  }),

  // Obtener proveedores por tipo de servicio
  getByServiceType: protectedProcedure
    .input(z.object({ tipoServicio: z.nativeEnum(TipoServicio) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.proveedor.findMany({
        where: {
          tipoServicio: input.tipoServicio,
          activo: true,
        },
        orderBy: { nombre: "asc" },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }),

  // Cambiar estado activo/inactivo
  toggleStatus: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const proveedor = await ctx.db.proveedor.findUnique({
        where: { id: input.id },
        select: { activo: true },
      });

      if (!proveedor) {
        throw new Error("Proveedor no encontrado");
      }

      return ctx.db.proveedor.update({
        where: { id: input.id },
        data: { activo: !proveedor.activo },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }),
});
