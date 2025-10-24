import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { TechnicalVisitStatus } from "@prisma/client";
import { sendPushNotificationToMany } from "~/server/push-service";

export const technicalVisitRouter = createTRPCRouter({
  // Obtener todas las visitas técnicas
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.technicalEvent.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        assignedUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  }),

  // Obtener visita técnica por ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.technicalEvent.findUnique({
        where: { id: input.id },
        include: {
          assignedUser: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    }),

  // Crear nueva visita técnica
  create: protectedProcedure
    .input(
      z.object({
        nombreCliente: z.string().min(1, "El nombre del cliente es requerido"),
        contacto: z.string().min(1, "El contacto es requerido"),
        direccion: z.string().min(1, "La dirección es requerida"),
        descripcion: z.string().min(1, "La descripción es requerida"),
        fechaVisita: z.coerce.date(),
        horaVisita: z.coerce.date(),
        estado: z.nativeEnum(TechnicalVisitStatus).default(TechnicalVisitStatus.PROGRAMADA),
        assignedTo: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const visit = await ctx.db.technicalEvent.create({
        data: {
          nombreCliente: input.nombreCliente,
          contacto: input.contacto,
          direccion: input.direccion,
          descripcion: input.descripcion,
          fechaVisita: input.fechaVisita,
          horaVisita: input.horaVisita,
          estado: input.estado,
          assignedTo: input.assignedTo || null,
        },
      });

      // Obtener todos los usuarios del sistema
      const allUsers = await ctx.db.user.findMany({
        select: { id: true },
      });

      const notificationTitle = "Nueva visita técnica programada";
      const notificationMessage = `${ctx.session.user.name || "Un usuario"} ha programado una visita para ${input.nombreCliente} el ${new Date(input.fechaVisita).toLocaleDateString("es-CL")}`;

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
          url: '/technical-visits',
          tag: 'visita-nueva',
        }
      ).catch(error => {
        console.error('Error al enviar notificaciones push:', error);
      });

      return visit;
    }),

  // Actualizar visita técnica
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        nombreCliente: z.string().min(1).optional(),
        contacto: z.string().min(1).optional(),
        direccion: z.string().min(1).optional(),
        descripcion: z.string().min(1).optional(),
        fechaVisita: z.coerce.date().optional(),
        horaVisita: z.coerce.date().optional(),
        estado: z.nativeEnum(TechnicalVisitStatus).optional(),
        assignedTo: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, assignedTo, estado, ...data } = input;
      
      // Obtener visita anterior para comparar estado
      const oldVisit = await ctx.db.technicalEvent.findUnique({
        where: { id },
      });

      const updatedVisit = await ctx.db.technicalEvent.update({
        where: { id },
        data: {
          ...data,
          ...(assignedTo !== undefined && { assignedTo: assignedTo || null }),
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
      if (estado && oldVisit && oldVisit.estado !== estado) {
        notificationTitle = "Estado de visita técnica actualizado";
        notificationMessage = `${ctx.session.user.name || "Un usuario"} cambió el estado de la visita de ${updatedVisit.nombreCliente} de ${oldVisit.estado} a ${estado}`;
        
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
            url: '/technical-visits',
            tag: 'visita-actualizada',
          }
        ).catch(error => {
          console.error('Error al enviar notificaciones push:', error);
        });
      }
      // Si se editó cualquier otro campo (no solo el estado)
      else if (Object.keys(data).length > 0 || assignedTo !== undefined) {
        notificationTitle = "Visita técnica actualizada";
        notificationMessage = `${ctx.session.user.name || "Un usuario"} ha editado la visita técnica de ${updatedVisit.nombreCliente}`;
        
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
            url: '/technical-visits',
            tag: 'visita-actualizada',
          }
        ).catch(error => {
          console.error('Error al enviar notificaciones push:', error);
        });
      }

      return updatedVisit;
    }),

  // Eliminar visita técnica
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.technicalEvent.delete({
        where: { id: input.id },
      });
    }),

  // Obtener visitas técnicas por estado
  getByStatus: protectedProcedure
    .input(z.object({ estado: z.nativeEnum(TechnicalVisitStatus) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.technicalEvent.findMany({
        where: { estado: input.estado },
        orderBy: { fechaVisita: "asc" },
        include: {
          assignedUser: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    }),

  // Obtener usuarios para asignar
  getUsers: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: "asc" },
    });
  }),
});

