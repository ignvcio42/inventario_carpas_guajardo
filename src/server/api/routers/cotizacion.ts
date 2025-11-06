import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { Decimal } from "@prisma/client/runtime/library";
import { cotizacionPDFService } from "~/server/pdf-service";

// Helper para formatear folio
const formatearFolio = (folio: string): string => {
  const numeros = folio.replace(/\D/g, "");
  if (!numeros) return folio;
  return new Intl.NumberFormat("es-CL").format(Number(numeros));
};

// Schema para detalle de cotización
const detalleSchema = z.object({
  detalle: z.string().min(1, "El detalle es requerido"),
  largo: z.number().positive("El largo debe ser positivo"),
  alto: z.number().positive("El alto debe ser positivo"),
  totalMts: z.number().positive("El total de metros debe ser positivo"),
  valorM2: z.number().positive("El valor por m2 debe ser positivo"),
  total: z.number().positive("El total debe ser positivo"),
  orden: z.number().default(0),
});

// Schema para descripción de cotización
const descripcionSchema = z.object({
  descripcion: z.string().min(1, "La descripción es requerida"),
  orden: z.number().default(0),
});

// Schema para crear/actualizar cotización
const cotizacionSchema = z.object({
  folio: z.string().min(1, "El folio es requerido"),
  atencion: z.string().min(1, "El nombre de atención es requerido"),
  empresa: z.string().optional(),
  clienteId: z.number().optional(),
  fechaEvento: z.date().optional(),
  fechaMontaje: z.date().optional(),
  fechaDesarme: z.date().optional(),
  lugarEvento: z.string().optional(),
  formaPago: z.string().optional(),
  neto: z.number(),
  iva: z.number(),
  bruto: z.number(),
  estado: z.enum(["BORRADOR", "ENVIADA", "ACEPTADA", "RECHAZADA", "VENCIDA"]).default("BORRADOR"),
  notas: z.string().optional(),
  detalles: z.array(detalleSchema),
  descripciones: z.array(descripcionSchema),
});

export const cotizacionRouter = createTRPCRouter({
  // Obtener todas las cotizaciones
  getAll: protectedProcedure
    .input(
      z.object({
        estado: z.enum(["BORRADOR", "ENVIADA", "ACEPTADA", "RECHAZADA", "VENCIDA"]).optional(),
        clienteId: z.number().optional(),
        search: z.string().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.pageSize;
      
      const where = {
        ...(input.estado && { estado: input.estado }),
        ...(input.clienteId && { clienteId: input.clienteId }),
        ...(input.search && {
          OR: [
            { folio: { contains: input.search, mode: "insensitive" as const } },
            { atencion: { contains: input.search, mode: "insensitive" as const } },
            { empresa: { contains: input.search, mode: "insensitive" as const } },
          ],
        }),
      };

      const [cotizaciones, total] = await Promise.all([
        ctx.db.cotizacion.findMany({
          where,
          include: {
            cliente: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            detalles: {
              orderBy: { orden: "asc" },
            },
            descripciones: {
              orderBy: { orden: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: input.pageSize,
        }),
        ctx.db.cotizacion.count({ where }),
      ]);

      return {
        cotizaciones,
        total,
        pages: Math.ceil(total / input.pageSize),
      };
    }),

  // Obtener una cotización por ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const cotizacion = await ctx.db.cotizacion.findUnique({
        where: { id: input.id },
        include: {
          cliente: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          detalles: {
            orderBy: { orden: "asc" },
          },
          descripciones: {
            orderBy: { orden: "asc" },
          },
        },
      });

      if (!cotizacion) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cotización no encontrada",
        });
      }

      return cotizacion;
    }),

  // Obtener el siguiente número de folio
  getNextFolio: protectedProcedure.query(async ({ ctx }) => {
    const lastCotizacion = await ctx.db.cotizacion.findFirst({
      orderBy: { folio: "desc" },
      select: { folio: true },
    });

    if (!lastCotizacion) {
      return "1";
    }

    // Intentar extraer el número del folio
    const regex = /\d+/;
    const match = regex.exec(lastCotizacion.folio);
    if (match) {
      const lastNumber = parseInt(match[0], 10);
      return (lastNumber + 1).toString();
    }

    return "1";
  }),

  // Crear nueva cotización
  create: protectedProcedure
    .input(cotizacionSchema)
    .mutation(async ({ ctx, input }) => {
      // Verificar si el folio ya existe
      const existingFolio = await ctx.db.cotizacion.findUnique({
        where: { folio: input.folio },
      });

      if (existingFolio) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ya existe una cotización con este folio",
        });
      }

      const cotizacion = await ctx.db.cotizacion.create({
        data: {
          folio: input.folio,
          atencion: input.atencion,
          empresa: input.empresa,
          clienteId: input.clienteId,
          fechaEvento: input.fechaEvento,
          fechaMontaje: input.fechaMontaje,
          fechaDesarme: input.fechaDesarme,
          lugarEvento: input.lugarEvento,
          formaPago: input.formaPago,
          neto: new Decimal(input.neto),
          iva: new Decimal(input.iva),
          bruto: new Decimal(input.bruto),
          estado: input.estado,
          notas: input.notas,
          createdById: ctx.session.user.id,
          detalles: {
            create: input.detalles.map((detalle) => ({
              detalle: detalle.detalle,
              largo: new Decimal(detalle.largo),
              alto: new Decimal(detalle.alto),
              totalMts: new Decimal(detalle.totalMts),
              valorM2: new Decimal(detalle.valorM2),
              total: new Decimal(detalle.total),
              orden: detalle.orden,
            })),
          },
          descripciones: {
            create: input.descripciones.map((desc) => ({
              descripcion: desc.descripcion,
              orden: desc.orden,
            })),
          },
        },
        include: {
          cliente: true,
          detalles: true,
          descripciones: true,
        },
      });

      return cotizacion;
    }),

  // Actualizar cotización
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: cotizacionSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingCotizacion = await ctx.db.cotizacion.findUnique({
        where: { id: input.id },
      });

      if (!existingCotizacion) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cotización no encontrada",
        });
      }

      // Si se está cambiando el folio, verificar que no exista
      if (input.data.folio && input.data.folio !== existingCotizacion.folio) {
        const existingFolio = await ctx.db.cotizacion.findUnique({
          where: { folio: input.data.folio },
        });

        if (existingFolio) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Ya existe una cotización con este folio",
          });
        }
      }

      // Eliminar detalles y descripciones existentes si se proporcionan nuevos
      if (input.data.detalles || input.data.descripciones) {
        await Promise.all([
          input.data.detalles
            ? ctx.db.cotizacionDetalle.deleteMany({
                where: { cotizacionId: input.id },
              })
            : Promise.resolve(),
          input.data.descripciones
            ? ctx.db.cotizacionDescripcion.deleteMany({
                where: { cotizacionId: input.id },
              })
            : Promise.resolve(),
        ]);
      }

      const cotizacion = await ctx.db.cotizacion.update({
        where: { id: input.id },
        data: {
          ...(input.data.folio && { folio: input.data.folio }),
          ...(input.data.atencion && { atencion: input.data.atencion }),
          ...(input.data.empresa !== undefined && { empresa: input.data.empresa }),
          ...(input.data.clienteId !== undefined && { clienteId: input.data.clienteId }),
          ...(input.data.fechaEvento !== undefined && { fechaEvento: input.data.fechaEvento }),
          ...(input.data.fechaMontaje !== undefined && { fechaMontaje: input.data.fechaMontaje }),
          ...(input.data.fechaDesarme !== undefined && { fechaDesarme: input.data.fechaDesarme }),
          ...(input.data.lugarEvento !== undefined && { lugarEvento: input.data.lugarEvento }),
          ...(input.data.formaPago !== undefined && { formaPago: input.data.formaPago }),
          ...(input.data.neto !== undefined && { neto: new Decimal(input.data.neto) }),
          ...(input.data.iva !== undefined && { iva: new Decimal(input.data.iva) }),
          ...(input.data.bruto !== undefined && { bruto: new Decimal(input.data.bruto) }),
          ...(input.data.estado && { estado: input.data.estado }),
          ...(input.data.notas !== undefined && { notas: input.data.notas }),
          ...(input.data.detalles && {
            detalles: {
              create: input.data.detalles.map((detalle) => ({
                detalle: detalle.detalle,
                largo: new Decimal(detalle.largo),
                alto: new Decimal(detalle.alto),
                totalMts: new Decimal(detalle.totalMts),
                valorM2: new Decimal(detalle.valorM2),
                total: new Decimal(detalle.total),
                orden: detalle.orden,
              })),
            },
          }),
          ...(input.data.descripciones && {
            descripciones: {
              create: input.data.descripciones.map((desc) => ({
                descripcion: desc.descripcion,
                orden: desc.orden,
              })),
            },
          }),
        },
        include: {
          cliente: true,
          detalles: {
            orderBy: { orden: "asc" },
          },
          descripciones: {
            orderBy: { orden: "asc" },
          },
        },
      });

      return cotizacion;
    }),

  // Cambiar estado de la cotización
  updateEstado: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        estado: z.enum(["BORRADOR", "ENVIADA", "ACEPTADA", "RECHAZADA", "VENCIDA"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const cotizacion = await ctx.db.cotizacion.update({
        where: { id: input.id },
        data: { estado: input.estado },
      });

      return cotizacion;
    }),

  // Eliminar cotización
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const cotizacion = await ctx.db.cotizacion.findUnique({
        where: { id: input.id },
      });

      if (!cotizacion) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cotización no encontrada",
        });
      }

      await ctx.db.cotizacion.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Obtener estadísticas de cotizaciones
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, borradores, enviadas, aceptadas, rechazadas] = await Promise.all([
      ctx.db.cotizacion.count(),
      ctx.db.cotizacion.count({ where: { estado: "BORRADOR" } }),
      ctx.db.cotizacion.count({ where: { estado: "ENVIADA" } }),
      ctx.db.cotizacion.count({ where: { estado: "ACEPTADA" } }),
      ctx.db.cotizacion.count({ where: { estado: "RECHAZADA" } }),
    ]);

    const totalBrutoResult = await ctx.db.cotizacion.aggregate({
      where: { estado: "ACEPTADA" },
      _sum: { bruto: true },
    });

    return {
      total,
      borradores,
      enviadas,
      aceptadas,
      rechazadas,
      totalBruto: totalBrutoResult._sum.bruto?.toNumber() ?? 0,
    };
  }),

  // Generar PDF de cotización
  generarPDF: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const cotizacion = await ctx.db.cotizacion.findUnique({
        where: { id: input.id },
        include: {
          detalles: {
            orderBy: { orden: "asc" },
          },
          descripciones: {
            orderBy: { orden: "asc" },
          },
        },
      });

      if (!cotizacion) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cotización no encontrada",
        });
      }

      try {
        console.log("Iniciando generación de PDF para cotización:", cotizacion.folio);
        
        const pdfBuffer = await cotizacionPDFService.generarPDF({
          folio: cotizacion.folio,
          atencion: cotizacion.atencion,
          empresa: cotizacion.empresa,
          fechaEvento: cotizacion.fechaEvento,
          fechaMontaje: cotizacion.fechaMontaje,
          fechaDesarme: cotizacion.fechaDesarme,
          lugarEvento: cotizacion.lugarEvento,
          formaPago: cotizacion.formaPago,
          neto: Number(cotizacion.neto),
          iva: Number(cotizacion.iva),
          bruto: Number(cotizacion.bruto),
          detalles: cotizacion.detalles.map((d) => ({
            detalle: d.detalle,
            largo: Number(d.largo),
            alto: Number(d.alto),
            totalMts: Number(d.totalMts),
            valorM2: Number(d.valorM2),
            total: Number(d.total),
          })),
          descripciones: cotizacion.descripciones.map((d) => ({
            descripcion: d.descripcion,
          })),
        });

        console.log("PDF generado exitosamente, tamaño:", pdfBuffer.length);

        // Convertir buffer a base64 para enviarlo al cliente
        const base64 = pdfBuffer.toString("base64");
        
        return {
          success: true,
          pdf: base64,
          filename: `Cotizacion_${formatearFolio(cotizacion.folio)}.pdf`,
        };
      } catch (error) {
        console.error("Error detallado al generar PDF:", error);
        console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error al generar el PDF: ${error instanceof Error ? error.message : "Error desconocido"}`,
        });
      }
    }),
});

