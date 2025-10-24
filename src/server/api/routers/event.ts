import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { Estado } from "@prisma/client";
import { sendPushNotificationToMany } from "~/server/push-service";

export const eventRouter = createTRPCRouter({
  // Obtener todos los eventos
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.event.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            item: true,
          },
        },
        users: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }),

  // Obtener evento por ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.event.findUnique({
        where: { id: input.id },
        include: {
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              item: true,
            },
          },
          users: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          features: true,
        },
      });
    }),

  // Obtener visitas técnicas realizadas para crear eventos
  getCompletedTechnicalVisits: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.technicalEvent.findMany({
      where: { estado: "REALIZADA" },
      orderBy: { fechaVisita: "desc" },
      select: {
        id: true,
        nombreCliente: true,
        contacto: true,
        direccion: true,
        descripcion: true,
        fechaVisita: true,
      },
    });
  }),

  // Crear nuevo evento
  create: protectedProcedure
    .input(
      z.object({
        nombreCliente: z.string().min(1, "El nombre del cliente es requerido"),
        contacto: z.string().min(1, "El contacto es requerido"),
        direccion: z.string().min(1, "La dirección es requerida"),
        descripcion: z.string().min(1, "La descripción es requerida"),
        metros2: z.number().min(1, "Los metros cuadrados son requeridos"),
        montoTotal: z.number().min(0, "El monto total debe ser mayor o igual a 0"),
        anticipo: z.number().min(0, "El anticipo debe ser mayor o igual a 0"),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        horaInicio: z.coerce.date(),
        horaTermino: z.coerce.date(),
        carpa: z.boolean().default(false),
        toldo: z.boolean().default(false),
        iluminacion: z.boolean().default(false),
        calefaccion: z.boolean().default(false),
        cubrePiso: z.boolean().default(false),
        estado: z.nativeEnum(Estado).default(Estado.PENDIENTE),
        comentario: z.string().optional(),
        technicalVisitId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.event.create({
        data: {
          nombreCliente: input.nombreCliente,
          contacto: input.contacto,
          direccion: input.direccion,
          descripcion: input.descripcion,
          metros2: input.metros2,
          montoTotal: input.montoTotal,
          anticipo: input.anticipo,
          startDate: input.startDate,
          endDate: input.endDate,
          horaInicio: input.horaInicio,
          horaTermino: input.horaTermino,
          carpa: input.carpa,
          toldo: input.toldo,
          iluminacion: input.iluminacion,
          calefaccion: input.calefaccion,
          cubrePiso: input.cubrePiso,
          estado: input.estado,
          comentario: input.comentario || null,
          technicalVisitId: input.technicalVisitId,
          createdById: ctx.session.user.id,
        },
      });

      // Obtener todos los usuarios del sistema
      const allUsers = await ctx.db.user.findMany({
        select: { id: true },
      });

      const notificationTitle = "Nuevo evento creado";
      const notificationMessage = `${ctx.session.user.name || "Un usuario"} ha creado el evento para ${input.nombreCliente} el ${new Date(input.startDate).toLocaleDateString("es-CL")}`;

      // Crear notificación para cada usuario
      await ctx.db.notification.createMany({
        data: allUsers.map((user) => ({
          title: notificationTitle,
          message: notificationMessage,
          userId: user.id,
          actionBy: ctx.session.user.id,
          actionByName: ctx.session.user.name || "Usuario",
        })),
      });

      // Enviar notificaciones push a todos los usuarios (sin bloquear)
      sendPushNotificationToMany(
        allUsers.map((user) => user.id),
        {
          title: notificationTitle,
          body: notificationMessage,
          url: '/eventos',
          tag: 'evento-nuevo',
        }
      ).catch(error => {
        console.error('Error al enviar notificaciones push:', error);
      });

      return event;
    }),

  // Actualizar evento
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        nombreCliente: z.string().min(1).optional(),
        contacto: z.string().min(1).optional(),
        direccion: z.string().min(1).optional(),
        descripcion: z.string().min(1).optional(),
        metros2: z.number().min(1).optional(),
        montoTotal: z.number().min(0).optional(),
        anticipo: z.number().min(0).optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        horaInicio: z.coerce.date().optional(),
        horaTermino: z.coerce.date().optional(),
        carpa: z.boolean().optional(),
        toldo: z.boolean().optional(),
        iluminacion: z.boolean().optional(),
        calefaccion: z.boolean().optional(),
        cubrePiso: z.boolean().optional(),
        estado: z.nativeEnum(Estado).optional(),
        comentario: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, comentario, estado, ...data } = input;
      
      // Obtener evento anterior para comparar estado
      const oldEvent = await ctx.db.event.findUnique({
        where: { id },
      });

      const updatedEvent = await ctx.db.event.update({
        where: { id },
        data: {
          ...data,
          ...(comentario !== undefined && { comentario: comentario || null }),
          ...(estado !== undefined && { estado }),
        },
      });

      // Obtener todos los usuarios para notificar
      const allUsers = await ctx.db.user.findMany({
        select: { id: true },
      });

      let notificationTitle = "";
      let notificationMessage = "";

      // Si cambió el estado, crear notificación específica
      if (estado && oldEvent && oldEvent.estado !== estado) {
        notificationTitle = "Estado de evento actualizado";
        notificationMessage = `${ctx.session.user.name || "Un usuario"} cambió el estado del evento de ${updatedEvent.nombreCliente} de ${oldEvent.estado} a ${estado}`;
        
        await ctx.db.notification.createMany({
          data: allUsers.map((user) => ({
            title: notificationTitle,
            message: notificationMessage,
            userId: user.id,
            actionBy: ctx.session.user.id,
            actionByName: ctx.session.user.name || "Usuario",
          })),
        });

        // Enviar notificaciones push
        sendPushNotificationToMany(
          allUsers.map((user) => user.id),
          {
            title: notificationTitle,
            body: notificationMessage,
            url: '/eventos',
            tag: 'evento-actualizado',
          }
        ).catch(error => {
          console.error('Error al enviar notificaciones push:', error);
        });
      } 
      // Si se editó cualquier otro campo (no solo el estado)
      else if (Object.keys(data).length > 0) {
        notificationTitle = "Evento actualizado";
        notificationMessage = `${ctx.session.user.name || "Un usuario"} ha editado el evento de ${updatedEvent.nombreCliente}`;
        
        await ctx.db.notification.createMany({
          data: allUsers.map((user) => ({
            title: notificationTitle,
            message: notificationMessage,
            userId: user.id,
            actionBy: ctx.session.user.id,
            actionByName: ctx.session.user.name || "Usuario",
          })),
        });

        // Enviar notificaciones push
        sendPushNotificationToMany(
          allUsers.map((user) => user.id),
          {
            title: notificationTitle,
            body: notificationMessage,
            url: '/eventos',
            tag: 'evento-actualizado',
          }
        ).catch(error => {
          console.error('Error al enviar notificaciones push:', error);
        });
      }

      return updatedEvent;
    }),

  // Eliminar evento
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.event.delete({
        where: { id: input.id },
      });
    }),

  // Obtener eventos por estado
  getByStatus: protectedProcedure
    .input(z.object({ estado: z.nativeEnum(Estado) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.event.findMany({
        where: { estado: input.estado },
        orderBy: { startDate: "asc" },
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
});

