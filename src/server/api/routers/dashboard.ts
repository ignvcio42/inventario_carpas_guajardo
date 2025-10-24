import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const dashboardRouter = createTRPCRouter({
  // Obtener estadísticas generales
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Contar eventos activos (no cancelados)
    const activeEvents = await ctx.db.event.count({
      where: {
        estado: {
          in: ["PENDIENTE", "EN_PROCESO"],
        },
      },
    });

    // Contar items en inventario
    const totalItems = await ctx.db.item.count();

    // Calcular inventario bajo (menos de 10 unidades)
    const lowStockItems = await ctx.db.item.count({
      where: {
        quantity: {
          lt: 10,
        },
      },
    });

    // Calcular ingresos del mes (eventos completados este mes)
    const monthlyRevenue = await ctx.db.event.aggregate({
      where: {
        estado: "COMPLETADO",
        endDate: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
      _sum: {
        montoTotal: true,
      },
    });

    // Visitas técnicas programadas
    const scheduledVisits = await ctx.db.technicalEvent.count({
      where: {
        estado: "PROGRAMADA",
        fechaVisita: {
          gte: now,
        },
      },
    });

    return {
      activeEvents,
      totalItems,
      lowStockItems,
      monthlyRevenue: monthlyRevenue._sum.montoTotal || 0,
      scheduledVisits,
    };
  }),

  // Obtener actividades recientes
  getRecentActivity: protectedProcedure.query(async ({ ctx }) => {
    const recentEvents = await ctx.db.event.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nombreCliente: true,
        estado: true,
        startDate: true,
        createdAt: true,
        montoTotal: true,
      },
    });

    const recentVisits = await ctx.db.technicalEvent.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nombreCliente: true,
        estado: true,
        fechaVisita: true,
        createdAt: true,
      },
    });

    const recentNotifications = await ctx.db.notification.findMany({
      take: 5,
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        message: true,
        createdAt: true,
        isRead: true,
        actionByName: true,
      },
    });

    return {
      events: recentEvents,
      visits: recentVisits,
      notifications: recentNotifications,
    };
  }),

  // Obtener próximos eventos (calendario)
  getUpcomingEvents: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Rango: últimos 3 meses hasta 6 meses en el futuro
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    
    const sixMonthsFromNow = new Date(now);
    sixMonthsFromNow.setMonth(now.getMonth() + 6);

    return ctx.db.event.findMany({
      where: {
        estado: {
          not: "CANCELADO",
        },
        OR: [
          // Eventos cuya fecha de inicio está en el rango
          {
            startDate: {
              gte: threeMonthsAgo,
              lte: sixMonthsFromNow,
            },
          },
          // Eventos cuya fecha de término está en el rango
          {
            endDate: {
              gte: threeMonthsAgo,
              lte: sixMonthsFromNow,
            },
          },
          // Eventos que abarcan todo el rango
          {
            AND: [
              { startDate: { lte: threeMonthsAgo } },
              { endDate: { gte: sixMonthsFromNow } },
            ],
          },
        ],
      },
      orderBy: { startDate: "asc" },
      select: {
        id: true,
        nombreCliente: true,
        startDate: true,
        endDate: true,
        estado: true,
        direccion: true,
        montoTotal: true,
        horaInicio: true,
        horaTermino: true,
      },
    });
  }),

  // Obtener próximas visitas técnicas
  getUpcomingVisits: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Rango: últimos 3 meses hasta 6 meses en el futuro
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    
    const sixMonthsFromNow = new Date(now);
    sixMonthsFromNow.setMonth(now.getMonth() + 6);

    return ctx.db.technicalEvent.findMany({
      where: {
        fechaVisita: {
          gte: threeMonthsAgo,
          lte: sixMonthsFromNow,
        },
        estado: {
          not: "CANCELADA",
        },
      },
      orderBy: { fechaVisita: "asc" },
      select: {
        id: true,
        nombreCliente: true,
        fechaVisita: true,
        horaVisita: true,
        estado: true,
        direccion: true,
        assignedTo: true,
        assignedUser: {
          select: {
            name: true,
          },
        },
      },
    });
  }),

  // Obtener eventos por estado (para gráficos)
  getEventsByStatus: protectedProcedure.query(async ({ ctx }) => {
    const eventsByStatus = await ctx.db.event.groupBy({
      by: ["estado"],
      _count: {
        estado: true,
      },
    });

    return eventsByStatus.map((item) => ({
      status: item.estado,
      count: item._count.estado,
    }));
  }),

  // Obtener ingresos de los últimos 6 meses
  getMonthlyRevenue: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    const events = await ctx.db.event.findMany({
      where: {
        estado: "COMPLETADO",
        endDate: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        endDate: true,
        montoTotal: true,
      },
    });

    // Agrupar por mes
    const monthlyData: Record<string, number> = {};
    events.forEach((event) => {
      const monthKey = new Date(event.endDate).toLocaleDateString("es-CL", {
        year: "numeric",
        month: "short",
      });
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Number(event.montoTotal);
    });

    return Object.entries(monthlyData).map(([month, revenue]) => ({
      month,
      revenue,
    }));
  }),
});

