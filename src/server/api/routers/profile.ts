import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const profileRouter = createTRPCRouter({
  // Obtener perfil del usuario actual
  getCurrentProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        avatarUrl: true,
        phone: true,
        address: true,
        bio: true,
        preferences: true,
        timezone: true,
        language: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            events: true,
            notifications: true,
            sketches: true,
          },
        },
      },
    });
  }),

  // Actualizar perfil del usuario actual
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        bio: z.string().optional(),
        timezone: z.string().optional(),
        language: z.string().optional(),
        preferences: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          ...input,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          avatarUrl: true,
          phone: true,
          address: true,
          bio: true,
          preferences: true,
          timezone: true,
          language: true,
          updatedAt: true,
        },
      });
    }),

  // Cambiar avatar del usuario
  updateAvatar: protectedProcedure
    .input(
      z.object({
        avatarUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          avatarUrl: input.avatarUrl || "",
          updatedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      });
    }),

  // Obtener estadísticas del usuario
  getUserStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    
    const [
      totalEvents,
      completedEvents,
      pendingEvents,
      totalSketches,
      unreadNotifications,
    ] = await Promise.all([
      ctx.db.event.count({
        where: { createdById: userId },
      }),
      ctx.db.event.count({
        where: { 
          createdById: userId,
          estado: "COMPLETADO",
        },
      }),
      ctx.db.event.count({
        where: { 
          createdById: userId,
          estado: "PENDIENTE",
        },
      }),
      ctx.db.sketch.count({
        where: { createdById: userId },
      }),
      ctx.db.notification.count({
        where: { 
          userId: userId,
          isRead: false,
        },
      }),
    ]);

    return {
      totalEvents,
      completedEvents,
      pendingEvents,
      totalSketches,
      unreadNotifications,
    };
  }),

  // Obtener actividad reciente del usuario
  getRecentActivity: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      
      // Obtener eventos recientes
      const recentEvents = await ctx.db.event.findMany({
        where: { createdById: userId },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        select: {
          id: true,
          nombreCliente: true,
          estado: true,
          createdAt: true,
          startDate: true,
        },
      });

      // Obtener bocetos recientes
      const recentSketches = await ctx.db.sketch.findMany({
        where: { createdById: userId },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
      });

      return {
        events: recentEvents,
        sketches: recentSketches,
      };
    }),

  // Obtener configuraciones de preferencias disponibles
  getAvailablePreferences: protectedProcedure.query(async ({ ctx }) => {
    return {
      timezones: [
        { value: "America/Santiago", label: "Santiago (Chile)" },
        { value: "America/New_York", label: "Nueva York (EE.UU.)" },
        { value: "America/Los_Angeles", label: "Los Ángeles (EE.UU.)" },
        { value: "Europe/Madrid", label: "Madrid (España)" },
        { value: "Europe/London", label: "Londres (Reino Unido)" },
        { value: "Asia/Tokyo", label: "Tokio (Japón)" },
      ],
      languages: [
        { value: "es", label: "Español" },
        { value: "en", label: "English" },
        { value: "pt", label: "Português" },
      ],
      notificationPreferences: [
        { key: "email_notifications", label: "Notificaciones por email", type: "boolean" },
        { key: "push_notifications", label: "Notificaciones push", type: "boolean" },
        { key: "event_reminders", label: "Recordatorios de eventos", type: "boolean" },
        { key: "daily_summary", label: "Resumen diario", type: "boolean" },
        { key: "weekly_report", label: "Reporte semanal", type: "boolean" },
      ],
    };
  }),

  // Actualizar preferencias específicas
  updatePreferences: protectedProcedure
    .input(
      z.object({
        preferences: z.record(z.any()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          preferences: input.preferences,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          preferences: true,
        },
      });
    }),
});
