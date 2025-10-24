import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const pushRouter = createTRPCRouter({
  // Registrar una suscripción push
  subscribe: protectedProcedure
    .input(
      z.object({
        endpoint: z.string(),
        keys: z.object({
          p256dh: z.string(),
          auth: z.string(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar si ya existe una suscripción para este endpoint
      const existingSubscription = await ctx.db.pushSubscription.findUnique({
        where: { endpoint: input.endpoint },
      });

      if (existingSubscription) {
        // Si existe, actualizar con el nuevo userId si es diferente
        if (existingSubscription.userId !== ctx.session.user.id) {
          return ctx.db.pushSubscription.update({
            where: { endpoint: input.endpoint },
            data: {
              userId: ctx.session.user.id,
              p256dh: input.keys.p256dh,
              auth: input.keys.auth,
            },
          });
        }
        return existingSubscription;
      }

      // Si no existe, crear una nueva
      return ctx.db.pushSubscription.create({
        data: {
          userId: ctx.session.user.id,
          endpoint: input.endpoint,
          p256dh: input.keys.p256dh,
          auth: input.keys.auth,
        },
      });
    }),

  // Desuscribirse de las notificaciones push
  unsubscribe: protectedProcedure
    .input(
      z.object({
        endpoint: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.pushSubscription.delete({
        where: {
          endpoint: input.endpoint,
        },
      });
    }),

  // Obtener la suscripción actual del usuario
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.pushSubscription.findFirst({
      where: {
        userId: ctx.session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }),

  // Verificar si el usuario tiene notificaciones push habilitadas
  hasSubscription: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.db.pushSubscription.count({
      where: {
        userId: ctx.session.user.id,
      },
    });
    return count > 0;
  }),
});

