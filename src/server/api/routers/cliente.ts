import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { TipoCliente } from "@prisma/client";

export const clienteRouter = createTRPCRouter({
  // Obtener todos los clientes
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.cliente.findMany({
      orderBy: { nombre: "asc" },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            eventos: true,
          },
        },
      },
    });
  }),

  // Obtener cliente por ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.cliente.findUnique({
        where: { id: input.id },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          eventos: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              nombreCliente: true,
              descripcion: true,
              estado: true,
              montoTotal: true,
              startDate: true,
              endDate: true,
              createdAt: true,
            },
          },
        },
      });
    }),

  // Crear nuevo cliente
  create: protectedProcedure
    .input(
      z.object({
        nombre: z.string().min(1, "El nombre es requerido"),
        email: z.string().email().optional().or(z.literal("")),
        telefono: z.string().optional(),
        direccion: z.string().optional(),
        tipoCliente: z.nativeEnum(TipoCliente).default(TipoCliente.PARTICULAR),
        empresa: z.string().optional(),
        rut: z.string().optional(),
        notas: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.cliente.create({
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

  // Actualizar cliente
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        nombre: z.string().min(1, "El nombre es requerido"),
        email: z.string().email().optional().or(z.literal("")),
        telefono: z.string().optional(),
        direccion: z.string().optional(),
        tipoCliente: z.nativeEnum(TipoCliente),
        empresa: z.string().optional(),
        rut: z.string().optional(),
        notas: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.cliente.update({
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

  // Eliminar cliente
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Verificar si el cliente tiene eventos asociados
      const eventosCount = await ctx.db.event.count({
        where: { clienteId: input.id },
      });

      if (eventosCount > 0) {
        throw new Error(
          `No se puede eliminar el cliente porque tiene ${eventosCount} evento(s) asociado(s). Primero elimine o desasocie los eventos.`
        );
      }

      return ctx.db.cliente.delete({
        where: { id: input.id },
      });
    }),

  // Buscar clientes
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        tipoCliente: z.nativeEnum(TipoCliente).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.cliente.findMany({
        where: {
          AND: [
            {
              OR: [
                { nombre: { contains: input.query, mode: "insensitive" } },
                { email: { contains: input.query, mode: "insensitive" } },
                { empresa: { contains: input.query, mode: "insensitive" } },
                { telefono: { contains: input.query, mode: "insensitive" } },
              ],
            },
            input.tipoCliente ? { tipoCliente: input.tipoCliente } : {},
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
          _count: {
            select: {
              eventos: true,
            },
          },
        },
      });
    }),

  // Obtener estadísticas de clientes
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [
      totalClientes,
      clientesPorTipo,
      clientesConEventos,
      eventosTotales,
    ] = await Promise.all([
      ctx.db.cliente.count(),
      ctx.db.cliente.groupBy({
        by: ["tipoCliente"],
        _count: { tipoCliente: true },
      }),
      ctx.db.cliente.count({
        where: {
          eventos: {
            some: {},
          },
        },
      }),
      ctx.db.event.count({
        where: {
          clienteId: {
            not: null,
          },
        },
      }),
    ]);

    return {
      total: totalClientes,
      porTipo: clientesPorTipo.map((item) => ({
        tipo: item.tipoCliente,
        count: item._count.tipoCliente,
      })),
      conEventos: clientesConEventos,
      eventosTotales,
    };
  }),

  // Obtener clientes más activos
  getMostActive: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(10) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.cliente.findMany({
        take: input.limit,
        orderBy: {
          eventos: {
            _count: "desc",
          },
        },
        include: {
          _count: {
            select: {
              eventos: true,
            },
          },
          eventos: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              nombreCliente: true,
              estado: true,
              montoTotal: true,
              createdAt: true,
            },
          },
        },
      });
    }),
});
