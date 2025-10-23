import { z } from "zod";
import {
  createTRPCRouter,
  adminProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { Role } from "@prisma/client";

export const adminRouter = createTRPCRouter({
  // Verificar si el usuario actual es admin
  isAdmin: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { role: true },
    });
    return user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
  }),

  // ========== GESTIÓN DE USUARIOS ==========

  // Obtener todos los usuarios
  getAllUsers: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        emailVerified: true,
        _count: {
          select: {
            events: true,
            posts: true,
            notifications: true,
          },
        },
      },
    });
  }),

  // Actualizar rol de usuario
  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.nativeEnum(Role),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Prevenir que se cambie el rol del propio usuario a algo que no sea admin
      if (ctx.session.user.id === input.userId) {
        if (input.role !== "SUPER_ADMIN" && input.role !== "ADMIN") {
          throw new Error("No puedes cambiar tu propio rol a uno sin permisos de administrador");
        }
      }

      return ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });
    }),

  // Eliminar usuario (solo SUPER_ADMIN)
  deleteUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Obtener rol del usuario actual
      const currentUser = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { role: true },
      });

      if (currentUser?.role !== "SUPER_ADMIN") {
        throw new Error("Solo SUPER_ADMIN puede eliminar usuarios");
      }

      if (ctx.session.user.id === input.userId) {
        throw new Error("No puedes eliminarte a ti mismo");
      }

      return ctx.db.user.delete({
        where: { id: input.userId },
      });
    }),

  // Obtener estadísticas de usuarios
  getUserStats: adminProcedure.query(async ({ ctx }) => {
    const totalUsers = await ctx.db.user.count();
    const usersByRole = await ctx.db.user.groupBy({
      by: ["role"],
      _count: {
        role: true,
      },
    });

    return {
      total: totalUsers,
      byRole: usersByRole.map((item) => ({
        role: item.role,
        count: item._count.role,
      })),
    };
  }),

  // ========== GESTIÓN DE NOTIFICACIONES ==========

  // Obtener todas las notificaciones del sistema
  getAllNotifications: adminProcedure
    .input(
      z.object({
        limit: z.number().optional().default(100),
        isRead: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.notification.findMany({
        take: input.limit,
        where: input.isRead !== undefined ? { isRead: input.isRead } : undefined,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          message: true,
          createdAt: true,
          isRead: true,
          actionByName: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }),

  // Obtener estadísticas de notificaciones
  getNotificationStats: adminProcedure.query(async ({ ctx }) => {
    const total = await ctx.db.notification.count();
    const unread = await ctx.db.notification.count({
      where: { isRead: false },
    });
    const read = await ctx.db.notification.count({
      where: { isRead: true },
    });

    // Notificaciones por tipo (basado en el título)
    const allNotifications = await ctx.db.notification.findMany({
      select: { title: true },
    });

    const byType: Record<string, number> = {};
    allNotifications.forEach((notif) => {
      byType[notif.title] = (byType[notif.title] || 0) + 1;
    });

    return {
      total,
      unread,
      read,
      byType: Object.entries(byType).map(([title, count]) => ({
        title,
        count,
      })),
    };
  }),

  // Eliminar notificaciones antiguas (leídas y más de X días)
  cleanOldNotifications: adminProcedure
    .input(
      z.object({
        daysOld: z.number().min(1).default(30),
        onlyRead: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - input.daysOld);

      const result = await ctx.db.notification.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          ...(input.onlyRead && { isRead: true }),
        },
      });

      return {
        deleted: result.count,
        message: `Se eliminaron ${result.count} notificaciones`,
      };
    }),

  // Eliminar todas las notificaciones leídas
  deleteAllReadNotifications: adminProcedure.mutation(async ({ ctx }) => {
    const result = await ctx.db.notification.deleteMany({
      where: { isRead: true },
    });

    return {
      deleted: result.count,
      message: `Se eliminaron ${result.count} notificaciones leídas`,
    };
  }),

  // Eliminar notificación específica
  deleteNotification: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.notification.delete({
        where: { id: input.id },
      });
    }),

  // Marcar todas las notificaciones como leídas (global)
  markAllNotificationsAsRead: adminProcedure.mutation(async ({ ctx }) => {
    const result = await ctx.db.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return {
      updated: result.count,
      message: `Se marcaron ${result.count} notificaciones como leídas`,
    };
  }),
});

