import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { sendPushNotification } from "~/server/push-service";

export const notificationRouter = createTRPCRouter({
  // Obtener todas las notificaciones del usuario
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.notification.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        message: true,
        createdAt: true,
        isRead: true,
        readAt: true,
        actionBy: true,
        actionByName: true,
      },
    });
  }),

  // Obtener notificaciones no leídas
  getUnread: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.notification.findMany({
      where: {
        userId: ctx.session.user.id,
        isRead: false,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        message: true,
        createdAt: true,
        isRead: true,
        readAt: true,
        actionBy: true,
        actionByName: true,
      },
    });
  }),

  // Contar notificaciones no leídas
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.notification.count({
      where: {
        userId: ctx.session.user.id,
        isRead: false,
      },
    });
  }),

  // Marcar una notificación como leída
  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.notification.update({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }),

  // Marcar todas como leídas
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    return ctx.db.notification.updateMany({
      where: {
        userId: ctx.session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }),

  // Eliminar una notificación
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.notification.delete({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });
    }),

  // Eliminar todas las notificaciones leídas
  deleteAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    return ctx.db.notification.deleteMany({
      where: {
        userId: ctx.session.user.id,
        isRead: true,
      },
    });
  }),

  // Crear notificación (uso interno)
  create: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        message: z.string(),
        userId: z.string(),
        actionBy: z.string().optional(),
        actionByName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.db.notification.create({
        data: {
          title: input.title,
          message: input.message,
          userId: input.userId,
          actionBy: input.actionBy,
          actionByName: input.actionByName,
        },
      });

      // Enviar notificación push (sin esperar a que termine)
      sendPushNotification(input.userId, {
        title: input.title,
        body: input.message,
        url: '/notifications',
        tag: 'notification',
        notificationId: notification.id,
      }).catch(error => {
        console.error('Error al enviar notificación push:', error);
      });

      return notification;
    }),
});

