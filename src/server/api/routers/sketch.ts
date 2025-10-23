import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const sketchRouter = createTRPCRouter({
  // Obtener todos los bocetos
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.sketch.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            nombreCliente: true,
            startDate: true,
          },
        },
      },
    });
  }),

  // Obtener boceto por ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.sketch.findUnique({
        where: { id: input.id },
        include: {
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
          event: {
            select: {
              id: true,
              nombreCliente: true,
              startDate: true,
              direccion: true,
            },
          },
        },
      });
    }),

  // Obtener bocetos por evento
  getByEvent: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.sketch.findMany({
        where: { eventId: input.eventId },
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    }),

  // Obtener bocetos sin evento asignado
  getUnassigned: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.sketch.findMany({
      where: { eventId: null },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  }),

  // Crear nuevo boceto
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "El nombre es requerido"),
        description: z.string().optional(),
        data: z.string(), // JSON stringificado con los elementos del boceto
        eventId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const sketch = await ctx.db.sketch.create({
        data: {
          name: input.name,
          description: input.description,
          data: input.data,
          eventId: input.eventId,
          createdById: ctx.session.user.id,
        },
      });

      // Si está asociado a un evento, crear notificación
      if (input.eventId) {
        const event = await ctx.db.event.findUnique({
          where: { id: input.eventId },
          select: { nombreCliente: true },
        });

        if (event) {
          const allUsers = await ctx.db.user.findMany({
            select: { id: true },
          });

          await ctx.db.notification.createMany({
            data: allUsers.map((user) => ({
              title: "Nuevo boceto creado",
              message: `${ctx.session.user.name || "Un usuario"} ha creado el boceto "${input.name}" para el evento de ${event.nombreCliente}`,
              userId: user.id,
              actionBy: ctx.session.user.id,
              actionByName: ctx.session.user.name || "Usuario",
            })),
          });
        }
      }

      return sketch;
    }),

  // Actualizar boceto
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        data: z.string().optional(),
        eventId: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const sketch = await ctx.db.sketch.update({
        where: { id },
        data,
      });

      return sketch;
    }),

  // Eliminar boceto
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.sketch.delete({
        where: { id: input.id },
      });
    }),

  // Asignar boceto a evento
  assignToEvent: protectedProcedure
    .input(
      z.object({
        sketchId: z.number(),
        eventId: z.number().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const sketch = await ctx.db.sketch.update({
        where: { id: input.sketchId },
        data: { eventId: input.eventId },
      });

      if (input.eventId) {
        const event = await ctx.db.event.findUnique({
          where: { id: input.eventId },
          select: { nombreCliente: true },
        });

        if (event) {
          const allUsers = await ctx.db.user.findMany({
            select: { id: true },
          });

          await ctx.db.notification.createMany({
            data: allUsers.map((user) => ({
              title: "Boceto asignado a evento",
              message: `${ctx.session.user.name || "Un usuario"} ha asignado el boceto "${sketch.name}" al evento de ${event.nombreCliente}`,
              userId: user.id,
              actionBy: ctx.session.user.id,
              actionByName: ctx.session.user.name || "Usuario",
            })),
          });
        }
      }

      return sketch;
    }),
});

