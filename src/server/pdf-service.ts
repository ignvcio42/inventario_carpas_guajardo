import PDFDocument from "pdfkit";
import type { Readable } from "stream";

interface DetalleItem {
  detalle: string;
  largo: number;
  alto: number;
  totalMts: number;
  valorM2: number;
  total: number;
}

interface DescripcionItem {
  descripcion: string;
}

interface CotizacionData {
  folio: string;
  atencion: string;
  empresa?: string | null;
  fechaEvento?: Date | null;
  fechaMontaje?: Date | null;
  fechaDesarme?: Date | null;
  lugarEvento?: string | null;
  formaPago?: string | null;
  neto: number;
  iva: number;
  bruto: number;
  detalles: DetalleItem[];
  descripciones: DescripcionItem[];
}

export class CotizacionPDFService {
  private formatearDinero(valor: number): string {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(valor);
  }

  private formatearFolio(folio: string): string {
    // Eliminar todo lo que no sea número
    const numeros = folio.replace(/\D/g, "");
    
    // Si está vacío, retornar el original
    if (!numeros) return folio;
    
    // Formatear con separador de miles
    return new Intl.NumberFormat("es-CL").format(Number(numeros));
  }

  private formatearFecha(fecha: Date | null | undefined): string {
    if (!fecha) return "";
    return new Date(fecha).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  async generarPDF(data: CotizacionData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        console.log("Creando documento PDF...");
        const doc = new PDFDocument({ 
          size: "letter",
          margin: 0,
          autoFirstPage: true
        });
        const chunks: Buffer[] = [];

        doc.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
        });
        doc.on("end", () => {
          console.log("Documento PDF finalizado, chunks:", chunks.length);
          resolve(Buffer.concat(chunks));
        });
        doc.on("error", (error) => {
          console.error("Error en PDFDocument:", error);
          reject(error instanceof Error ? error : new Error(String(error)));
        });

        const fechaActual = new Date().toLocaleDateString("es-CL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        // Altura de página Letter = 792 puntos
        // Convertir coordenadas Y de Python (donde 0 está abajo) a PDFKit (donde 0 está arriba)
        const convertY = (yPython: number) => 792 - yPython;

        // ============ ENCABEZADO ============
        doc.fontSize(20).font("Times-Bold").text("CARPAS GUAJARDO PROD. SPA", 70, convertY(750), { lineBreak: false });
        doc.fontSize(11).font("Times-Roman");
        doc.text("Rut: 77.011.105-6", 70, convertY(728), { lineBreak: false });
        // doc.text("Isla Deceit N°8774", 70, convertY(713), { lineBreak: false });
        // doc.text("Pudahuel", 70, convertY(698), { lineBreak: false });
        // doc.text("cel: +569 45121257", 70, convertY(683), { lineBreak: false });

        // Fecha y Folio (lado derecho)
        doc.text(`FECHA: ${fechaActual}`, 460, convertY(690), { lineBreak: false });
        doc.text(`FOLIO: N° ${this.formatearFolio(data.folio)}`, 460, convertY(675), { lineBreak: false });

        // ============ TÍTULO ============
        doc.fontSize(18).font("Times-Bold").text("COTIZACIÓN", 250, convertY(650), { lineBreak: false });
        doc.lineWidth(0.3);
        // Subrayar el título (línea debajo del texto)
        doc.moveTo(250, convertY(650) + 18).lineTo(360, convertY(650) + 18).stroke();

        // ============ INFORMACIÓN DEL CLIENTE ============
        doc.fontSize(12).font("Times-Bold");
        doc.text("CLIENTE:", 70, convertY(630), { lineBreak: false });
        // Subrayar CLIENTE: (línea debajo del texto)
        doc.moveTo(70, convertY(630) + 12).lineTo(125, convertY(630) + 12).stroke();

        doc.font("Times-Roman");
        doc.text("ATENCION:", 70, convertY(615), { lineBreak: false });
        doc.fontSize(12).font("Times-Roman");
        doc.text(data.atencion, 170, convertY(615), { lineBreak: false });
        // Línea debajo de la atención
        doc.moveTo(170, convertY(615) + 12).lineTo(360, convertY(615) + 12).stroke();

        doc.text("EMPRESA:", 70, convertY(600), { lineBreak: false });
        doc.text(data.empresa || "", 170, convertY(600), { lineBreak: false });
        // Línea debajo de la empresa
        doc.moveTo(170, convertY(600) + 12).lineTo(360, convertY(600) + 12).stroke();

        // ============ TÍTULO DE LA TABLA ============
        doc.fontSize(12).font("Times-Bold");
        doc.text("CUADRO DETALLE ARRIENDO CARPA ESCENARIO:", 70, convertY(570), { lineBreak: false });
        // Línea debajo del título
        doc.moveTo(70, convertY(570) + 12).lineTo(370, convertY(570) + 12).stroke();

        // ============ CALCULAR ALTURA DE LA TABLA ============
        // Encabezado + detalles + totales (3 filas)
        const numFilas = 1 + data.detalles.length + 3;
        const alturaFila = 15;
        const alturaTabla = numFilas * alturaFila;

        // Posición inicial de la tabla (misma que Python)
        const yTablaPython = 550 - alturaTabla - 20;

        // ============ DIBUJAR TABLA COMPLETA ============
        // En Python, yTablaPython es la parte inferior de la tabla
        // La parte superior de la tabla es yTablaPython + alturaTabla
        // Convertimos y empezamos a dibujar desde arriba
        let yActual = convertY(yTablaPython + alturaTabla);
        
        // Anchos exactos del Python: [70, 40, 40, 50, 50, 70]
        const colWidths = [70, 40, 40, 50, 50, 70];
        const colPositions = [70, 140, 180, 220, 270, 320]; // Calculados acumulativamente

        // Encabezados
        doc.fontSize(10).font("Times-Bold");
        // Dibujar celdas de encabezado
        for (let i = 0; i < colPositions.length; i++) {
          doc.rect(colPositions[i]!, yActual, colWidths[i]!, alturaFila).stroke();
        }
        
        const headers = ["Detalle", "Largo", "Ancho", "Total Mts", "Valor M2", "Total Neto"];
        headers.forEach((header, i) => {
          const xPos = colPositions[i]!;
          const width = colWidths[i]!;
          doc.text(header, xPos + 2, yActual + 3, {
            width: width - 4,
            align: i === 0 ? "left" : "right",
            lineBreak: false
          });
        });
        yActual += alturaFila;

        // Filas de detalles
        doc.fontSize(9).font("Times-Roman");
        data.detalles.forEach((detalle) => {
          // Dibujar celdas
          for (let i = 0; i < colPositions.length; i++) {
            doc.rect(colPositions[i]!, yActual, colWidths[i]!, alturaFila).stroke();
          }

          // Contenido
          doc.text(detalle.detalle, colPositions[0]! + 2, yActual + 3, {
            width: colWidths[0]! - 4,
            align: "left",
            lineBreak: false
          });
          doc.text(detalle.largo.toString(), colPositions[1]! + 2, yActual + 3, {
            width: colWidths[1]! - 4,
            align: "right",
            lineBreak: false
          });
          doc.text(detalle.alto.toString(), colPositions[2]! + 2, yActual + 3, {
            width: colWidths[2]! - 4,
            align: "right",
            lineBreak: false
          });
          doc.text(detalle.totalMts.toString(), colPositions[3]! + 2, yActual + 3, {
            width: colWidths[3]! - 4,
            align: "right",
            lineBreak: false
          });
          doc.text(this.formatearDinero(detalle.valorM2), colPositions[4]! + 2, yActual + 3, {
            width: colWidths[4]! - 4,
            align: "right",
            lineBreak: false
          });
          doc.text(this.formatearDinero(detalle.total), colPositions[5]! + 2, yActual + 3, {
            width: colWidths[5]! - 4,
            align: "right",
            lineBreak: false
          });
          yActual += alturaFila;
        });

        // Totales (con SPAN como Python) - combinar las primeras 5 columnas
        doc.fontSize(10).font("Times-Bold");
        
        // Calcular ancho de las primeras 5 columnas combinadas
        const anchoSpan = colWidths.slice(0, 5).reduce((sum, w) => sum + w, 0);
        
        // Total Neto
        doc.rect(colPositions[0]!, yActual, anchoSpan, alturaFila).stroke();
        doc.rect(colPositions[5]!, yActual, colWidths[5]!, alturaFila).stroke();
        doc.text("Total Neto", colPositions[0]! + 2, yActual + 3, { lineBreak: false });
        doc.text(this.formatearDinero(data.neto), colPositions[5]! + 2, yActual + 3, {
          width: colWidths[5]! - 4,
          align: "right",
          lineBreak: false
        });
        yActual += alturaFila;

        // IVA
        doc.rect(colPositions[0]!, yActual, anchoSpan, alturaFila).stroke();
        doc.rect(colPositions[5]!, yActual, colWidths[5]!, alturaFila).stroke();
        doc.text("IVA", colPositions[0]! + 2, yActual + 3, { lineBreak: false });
        doc.text(this.formatearDinero(data.iva), colPositions[5]! + 2, yActual + 3, {
          width: colWidths[5]! - 4,
          align: "right",
          lineBreak: false
        });
        yActual += alturaFila;

        // Total Bruto
        doc.rect(colPositions[0]!, yActual, anchoSpan, alturaFila).stroke();
        doc.rect(colPositions[5]!, yActual, colWidths[5]!, alturaFila).stroke();
        doc.text("Total Bruto", colPositions[0]! + 2, yActual + 3, { lineBreak: false });
        doc.text(this.formatearDinero(data.bruto), colPositions[5]! + 2, yActual + 3, {
          width: colWidths[5]! - 4,
          align: "right",
          lineBreak: false
        });

        // ============ DESCRIPCIÓN DE LA CARPA ============
        let yPython = 550 - alturaTabla - 40; // Igual que Python
        doc.fontSize(12).font("Times-Bold");
        doc.text("Descripción Carpa:", 70, convertY(yPython), { lineBreak: false });
        doc.fontSize(12).font("Times-Roman");
        yPython -= 15;
        
        data.descripciones.forEach((desc) => {
          doc.text(`• ${desc.descripcion}`, 80, convertY(yPython), { lineBreak: false });
          yPython -= 15;
        });
        yPython -= 5;

        // ============ FECHAS Y LUGAR ============
        doc.fontSize(12).font("Times-Roman");
        if (data.fechaEvento) {
          doc.text("Fecha Evento:", 70, convertY(yPython - 10), { lineBreak: false });
          doc.text(this.formatearFecha(data.fechaEvento), 170, convertY(yPython - 10), { lineBreak: false });
        }
        if (data.fechaMontaje) {
          doc.text("Fecha Montaje:", 70, convertY(yPython - 25), { lineBreak: false });
          doc.text(this.formatearFecha(data.fechaMontaje), 170, convertY(yPython - 25), { lineBreak: false });
        }
        if (data.fechaDesarme) {
          doc.text("Fecha Desarme:", 70, convertY(yPython - 40), { lineBreak: false });
          doc.text(this.formatearFecha(data.fechaDesarme), 170, convertY(yPython - 40), { lineBreak: false });
        }
        if (data.lugarEvento) {
          doc.text("Lugar Evento:", 70, convertY(yPython - 55), { lineBreak: false });
          doc.text(data.lugarEvento, 170, convertY(yPython - 55), { lineBreak: false });
        }
        if (data.formaPago) {
          doc.text("Forma de Pago:", 70, convertY(yPython - 70), { lineBreak: false });
          doc.text(data.formaPago, 170, convertY(yPython - 70), { lineBreak: false });
        }

        doc.fontSize(12).font("Times-Roman");
        doc.text("Esperando que este servicio sea de su interés, le saluda atentamente,", 70, convertY(yPython - 90), { lineBreak: false });

        // ============ FIRMA Y PIE DE PÁGINA (POSICIONES FIJAS) ============
        const firmaYPython = 150;
        const pieYPython = 50;

        // Comprobar si necesitamos nueva página (igual que Python)
        if (yPython - 80 < firmaYPython + 20) {
          doc.addPage();
        }

        // Firma - centrada en la página (ancho = 612 puntos para letter)
        const pageWidth = 612;
        const centerX = pageWidth / 2;
        
        doc.fontSize(12).font("Times-Roman");
        doc.text("Ariel Guajardo V.", 0, convertY(firmaYPython), { 
          width: pageWidth, 
          align: "center", 
          lineBreak: false 
        });
        // Línea debajo del nombre (centrada, ~88 puntos de ancho)
        const lineWidth = 88;
        doc.moveTo(centerX - lineWidth/2, convertY(firmaYPython) + 14).lineTo(centerX + lineWidth/2, convertY(firmaYPython) + 14).stroke();
        
        doc.fontSize(12).font("Times-Italic");
        doc.text("Carpas Guajardo Prod. Spa", 0, convertY(firmaYPython - 15), { 
          width: pageWidth, 
          align: "center", 
          lineBreak: false 
        });
        doc.text("Fono: +56963436322 - +56945121257", 0, convertY(firmaYPython - 30), { 
          width: pageWidth, 
          align: "center", 
          lineBreak: false 
        });

        // Pie de página - centrado
        doc.fontSize(10).font("Times-Roman");
        doc.text("Carpas Guajardo", 0, convertY(pieYPython), { 
          width: pageWidth, 
          align: "center", 
          lineBreak: false 
        });
        doc.text("Fono: +56945121257 - Cel. +56963436322", 0, convertY(pieYPython - 15), { 
          width: pageWidth, 
          align: "center", 
          lineBreak: false 
        });

        console.log("Finalizando documento PDF...");
        doc.end();
      } catch (error) {
        console.error("Error durante la generación del PDF:", error);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }
}

export const cotizacionPDFService = new CotizacionPDFService();

