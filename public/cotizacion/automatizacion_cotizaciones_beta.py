import os
import tkinter as tk
from tkinter import Tk, Label, messagebox, Entry, Button, Text, END, filedialog, Frame, Scrollbar, Listbox, MULTIPLE, ttk, PhotoImage,Scrollbar,Canvas
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from datetime import datetime
from reportlab.platypus import Table, TableStyle
import base64
from PIL import Image
from io import BytesIO
from tkcalendar import Calendar, DateEntry


class CotizacionApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Generador de Cotizaciones Carpas Guajardo")

        self.descripciones_predefinidas = [
        "Estructura Metálica (3 mts altura parejo)",
        "Estructura Metálica (4 mts altura parejo)",
        "Techo Blanco",
        "Techo negro",
        "Cubre pilares color blanco",
        "Iluminación LED decorativa",
        "Montaje y Desmontaje",
        "Iluminacion basica",
        "Cubrepiso"
    ]


        # Configure root window to be responsive
        self.root.grid_columnconfigure(0, weight=1)
        self.root.grid_columnconfigure(1, weight=3)

        # Center the window on screen
        self.center_window(1000, 900)  # Adjust width and height as needed

        # Use ttk for a more modern look
        style = ttk.Style()
        style.configure('TLabel', padding=5)
        style.configure('TEntry', padding=5)

        # Variables
        self.folio = ttk.Entry(root)
        self.atencion = ttk.Entry(root)
        self.empresa = ttk.Entry(root)
        self.tabla_datos = []
        self.descripcion_datos = []

        # Nuevas variables para fechas y lugar
        self.fecha_evento = ttk.Entry(root)
        self.fecha_montaje = ttk.Entry(root)
        self.fecha_desarme = ttk.Entry(root)
        self.lugar_evento = ttk.Entry(root)
        self.forma_pago = ttk.Entry(root)

        # Layout with improved spacing and alignment
        row = 0
        ttk.Label(root, text="Folio:").grid(row=row, column=0, sticky="e", padx=10, pady=5)
        self.folio.grid(row=row, column=1, sticky="ew", padx=10, pady=5)
        row += 1

        ttk.Label(root, text="Atención:").grid(row=row, column=0, sticky="e", padx=10, pady=5)
        self.atencion.grid(row=row, column=1, sticky="ew", padx=10, pady=5)
        row += 1

        ttk.Label(root, text="Empresa:").grid(row=row, column=0, sticky="e", padx=10, pady=5)
        self.empresa.grid(row=row, column=1, sticky="ew", padx=10, pady=5)
        row += 1

        # Tabla de Detalles
        ttk.Label(root, text="Detalles:").grid(row=row, column=0, sticky="ne", padx=10, pady=5)
        self.tabla_frame = ttk.Frame(root)
        self.tabla_frame.grid(row=row, column=1, sticky="ew", padx=10, pady=5)
        

        # Encabezados para los campos
        headers = ["Detalle", "Largo", "Alto", "Total Mts", "Valor M2", "Total"]
        for i, header in enumerate(headers):
            ttk.Label(self.tabla_frame, text=header, anchor="center").grid(row=0, column=i, sticky="ew")

        # Campos de entrada para los detalles
        self.detalle_entry = Entry(self.tabla_frame, width=15)
        self.detalle_entry.grid(row=1, column=0)
        self.largo_entry = Entry(self.tabla_frame, width=5)
        self.largo_entry.grid(row=1, column=1)
        self.alto_entry = Entry(self.tabla_frame, width=5)
        self.alto_entry.grid(row=1, column=2)
        self.total_mts_entry = Entry(self.tabla_frame, width=10)
        self.total_mts_entry.grid(row=1, column=3)
        self.valor_m2_entry = Entry(self.tabla_frame, width=10)  # New entry
        self.valor_m2_entry.grid(row=1, column=4)
        self.total_entry = Entry(self.tabla_frame, width=10)
        self.total_entry.grid(row=1, column=5)

        # Añadir evento para calcular automáticamente el total de metros cuadrados
        self.largo_entry.bind("<KeyRelease>", self.calcular_total_mts)  # Changed back to original method name
        self.alto_entry.bind("<KeyRelease>", self.calcular_total_mts)
        self.valor_m2_entry.bind("<KeyRelease>", self.calcular_total_mts)

        # Botón Añadir con estilo
        ttk.Button(self.tabla_frame, text="Añadir", command=self.agregar_detalle).grid(row=2, column=0, columnspan=3, sticky="ew", padx=10, pady=5)

        # Botón Eliminar con estilo
        style = ttk.Style()
        style.configure("Eliminar.TButton", foreground="red", background="red")
        ttk.Button(self.tabla_frame, text="Eliminar", command=self.eliminar_detalle, style="Eliminar.TButton").grid(row=2, column=3, columnspan=3, sticky="ew", padx=10, pady=5)
        
        # Listbox para mostrar detalles
        self.tabla_listbox = Listbox(self.tabla_frame, width=80, height=5)
        self.tabla_listbox.grid(row=3, column=0, columnspan=6, sticky="ew", padx=10, pady=5)

         # Resto de los campos (Neto, IVA, Bruto)
        row += 1
        neto_labels = ["Neto:", "IVA:", "Bruto:"]
        self.neto = ttk.Entry(root)
        self.iva = ttk.Entry(root)
        self.bruto = ttk.Entry(root)
        
        for i, (label_text, entry) in enumerate(zip(neto_labels, [self.neto, self.iva, self.bruto])):
            ttk.Label(root, text=label_text).grid(row=row+i, column=0, sticky="e", padx=10, pady=5)
            entry.grid(row=row+i, column=1, sticky="ew", padx=10, pady=5)

       # Descripción de la carpa
        Label(root, text="").grid(row=9, column=0, sticky="ne")
        self.descripcion_frame = Frame(root)
        self.descripcion_frame.grid(row=7, column=1, sticky="w")

        # Encabezados
        headers = ["Descripción"]
        for i, header in enumerate(headers):
            ttk.Label(self.descripcion_frame, text=header, anchor="center").grid(row=0, column=i, sticky="ew")

        # Campo de entrada para la descripción
        self.descripcion_entry = Entry(self.descripcion_frame, width=50)
        self.descripcion_entry.grid(row=1, column=0)

        # Botón Añadir con estilo
        ttk.Button(self.descripcion_frame, text="Añadir", command=self.agregar_descripcion).grid(row=2, column=0, sticky="ew", padx=10, pady=5)
        
        # Botón Eliminar con estilo
        style = ttk.Style()
        style.configure("Eliminar.TButton", foreground="red", background="red")
        ttk.Button(self.descripcion_frame, text="Eliminar", command=self.eliminar_descripcion, style="Eliminar.TButton").grid(row=3, column=1, sticky="ew", padx=10, pady=5)

        # Listbox para mostrar descripciones
        self.descripcion_listbox = Listbox(self.descripcion_frame, width=60, height=5)
        self.descripcion_listbox.grid(row=3, column=0, sticky="ew", padx=10, pady=5)

        # Etiqueta para el Combobox de descripciones predefinidas
        ttk.Label(self.descripcion_frame, text="Selecciona descripción predefinida:").grid(row=0, column=1, padx=5, pady=5)

        # Combobox para descripciones predefinidas
        self.descripcion_combobox = ttk.Combobox(self.descripcion_frame, values=self.descripciones_predefinidas, width=50)
        self.descripcion_combobox.grid(row=1, column=1, padx=5)

        # Botón para añadir la descripción seleccionada del Combobox
        ttk.Button(self.descripcion_frame, text="Añadir Predefinida", command=self.agregar_descripcion_predefinida).grid(row=2, column=1, sticky="ew", padx=10, pady=5)


        # Fechas y lugar del evento
        row = 8  # Comenzamos desde la fila 8 para mantener la continuidad

        ttk.Label(root, text="Fecha Evento:").grid(row=row, column=0, sticky="e", padx=10, pady=5)
        self.fecha_evento.grid(row=row, column=1, sticky="ew", padx=10, pady=5)
        row += 1

        ttk.Label(root, text="Fecha Montaje:").grid(row=row, column=0, sticky="e", padx=10, pady=5)
        self.fecha_montaje.grid(row=row, column=1, sticky="ew", padx=10, pady=5)
        row += 1

        ttk.Label(root, text="Fecha Desarme:").grid(row=row, column=0, sticky="e", padx=10, pady=5)
        self.fecha_desarme.grid(row=row, column=1, sticky="ew", padx=10, pady=5)
        row += 1

        ttk.Label(root, text="Lugar Evento:").grid(row=row, column=0, sticky="e", padx=10, pady=5)
        self.lugar_evento.grid(row=row, column=1, sticky="ew", padx=10, pady=5)
        row += 1

        ttk.Label(root, text="Forma de pago:").grid(row=row, column=0, sticky="e", padx=10, pady=5)
        self.forma_pago.grid(row=row, column=1, sticky="ew", padx=10, pady=5)
        row += 1

       # Frame para los botones de acción
        self.botones_frame = Frame(root)
        self.botones_frame.grid(row=13, column=0, columnspan=2, pady=10)

        # Botón para generar PDF
        Button(self.botones_frame, text="Generar PDF", command=self.generar_pdf).grid(row=0, column=0, padx=10)

        # Botón para limpiar datos
        Button(self.botones_frame, text="Limpiar Datos", command=self.limpiar_datos).grid(row=0, column=1, padx=10)

    def agregar_descripcion_predefinida(self):
        descripcion = self.descripcion_combobox.get()
        if descripcion:
            self.descripcion_datos.append(descripcion)
            self.descripcion_listbox.insert(END, descripcion)
            self.descripcion_combobox.set("")  # Limpiar selección después de añadir

    def eliminar_detalle(self):
        # Obtener el índice del detalle seleccionado
        seleccionado = self.tabla_listbox.curselection()
        
        if not seleccionado:
            messagebox.showerror("Error", "Selecciona un detalle para eliminar")
            return
        
        # Eliminar el detalle de la lista de datos
        indice = seleccionado[0]
        self.tabla_datos.pop(indice)

        # Eliminar el detalle de la lista mostrada en el Listbox
        self.tabla_listbox.delete(indice)

        # Recalcular los totales después de eliminar el detalle
        self.calcular_totales()

    def eliminar_descripcion(self):
        # Obtener el índice de la descripción seleccionada
        seleccionado = self.descripcion_listbox.curselection()
        
        if not seleccionado:
            messagebox.showerror("Error", "Selecciona una descripción para eliminar")
            return
        
        # Eliminar la descripción de la lista de descripciones
        indice = seleccionado[0]
        self.descripcion_datos.pop(indice)

        # Eliminar la descripción de la lista mostrada en el Listbox
        self.descripcion_listbox.delete(indice)
    
    def center_window(self, width, height):
        # Get screen width and height
        screen_width = self.root.winfo_screenwidth()
        screen_height = self.root.winfo_screenheight()

        # Calculate position x and y coordinates
        x = (screen_width/2) - (width/2)
        y = (screen_height/2) - (height/2)

        self.root.geometry('%dx%d+%d+%d' % (width, height, x, y))

    def calcular_total_mts(self, event=None):
        try:
            largo = float(self.largo_entry.get() or 0)
            alto = float(self.alto_entry.get() or 0)
            valor_m2 = float(self.valor_m2_entry.get() or 0)
            
            total_mts = largo * alto
            self.total_mts_entry.delete(0, END)
            self.total_mts_entry.insert(0, str(total_mts))
            
            total = total_mts * valor_m2
            self.total_entry.delete(0, END)
            self.total_entry.insert(0, str(int(total)))
        except ValueError:
            self.total_mts_entry.delete(0, END)
            self.total_entry.delete(0, END)

    def agregar_detalle(self):
        detalle = self.detalle_entry.get()
        largo = self.largo_entry.get()
        alto = self.alto_entry.get()
        total_mts = self.total_mts_entry.get()
        valor_m2 = self.valor_m2_entry.get()
        total = self.total_entry.get()

        if detalle and largo and alto and total_mts and valor_m2 and total:
            self.tabla_datos.append((detalle, largo, alto, total_mts, valor_m2, total))
            self.tabla_listbox.insert(END, f"{detalle} - {largo}x{alto}, {total_mts} mts, Valor M2: ${self.formatear_dinero(valor_m2)}, Total: ${self.formatear_dinero(total)}")

            self.detalle_entry.delete(0, END)
            self.largo_entry.delete(0, END)
            self.alto_entry.delete(0, END)
            self.total_mts_entry.delete(0, END)
            self.valor_m2_entry.delete(0, END)
            self.total_entry.delete(0, END)

            self.calcular_totales()

    def calcular_totales(self):
        # Calcular el total neto sumando todos los totales de los detalles
        neto = sum(int(total.replace('.', '')) for _, _, _, _, _, total in self.tabla_datos)
        
        # Calcular el IVA como 19% del total neto
        iva = int(neto * 0.19)
        
        # Calcular el total bruto sumando neto e IVA
        bruto = neto + iva

        # Limpiar y mostrar los campos de neto, IVA y bruto
        self.neto.delete(0, END)
        self.neto.insert(0, f"${self.formatear_dinero(neto)}")

        self.iva.delete(0, END)
        self.iva.insert(0, f"${self.formatear_dinero(iva)}")

        self.bruto.delete(0, END)
        self.bruto.insert(0, f"${self.formatear_dinero(bruto)}")

    def agregar_descripcion(self):
        descripcion = self.descripcion_entry.get()
        if descripcion:
            self.descripcion_datos.append(descripcion)
            self.descripcion_listbox.insert(END, descripcion)
            self.descripcion_entry.delete(0, END)

    def formatear_dinero(self, valor):
        return "{:,}".format(int(valor)).replace(",", ".")
    
    # Limpia todos los campos y listas de la aplicación.
    def limpiar_datos(self):
       
        # Limpiar campos de entrada
        self.folio.delete(0, END)
        self.atencion.delete(0, END)
        self.empresa.delete(0, END)
        self.detalle_entry.delete(0, END)
        self.largo_entry.delete(0, END)
        self.alto_entry.delete(0, END)
        self.total_mts_entry.delete(0, END)
        self.total_entry.delete(0, END)
        self.neto.delete(0, END)
        self.iva.delete(0, END)
        self.bruto.delete(0, END)
        self.fecha_evento.delete(0, END)
        self.fecha_montaje.delete(0, END)
        self.fecha_desarme.delete(0, END)
        self.lugar_evento.delete(0, END)
        self.forma_pago.delete(0, END)

        # Limpiar listas
        self.tabla_datos.clear()
        self.descripcion_datos.clear()
        self.tabla_listbox.delete(0, END)
        self.descripcion_listbox.delete(0, END)

    def generar_pdf(self):
        
        # Validar que el folio esté completo
        folio = self.folio.get()
        if not folio.strip():  # Verifica si está vacío o contiene solo espacios
            messagebox.showerror("Error", "No se puede generar el PDF sin rellenar el folio.")
            return

        # Obtener datos del formulario
        folio = self.folio.get()
        atencion = self.atencion.get()
        empresa = self.empresa.get()
        neto = self.neto.get()
        iva = self.iva.get()
        bruto = self.bruto.get()
        fecha_evento = self.fecha_evento.get()
        fecha_montaje = self.fecha_montaje.get()
        fecha_desarme = self.fecha_desarme.get()
        lugar_evento = self.lugar_evento.get()
        forma_pago = self.forma_pago.get()
        fecha_actual = datetime.now().strftime("%d / %m / %Y")

        # Seleccionar ubicación para guardar el PDF
        file_path = filedialog.asksaveasfilename(defaultextension=".pdf", filetypes=[("PDF files", "*.pdf")])
        if not file_path:
            return

        # Crear el PDF
        c = canvas.Canvas(file_path, pagesize=letter)
        c.setFont("Times-Roman", 20)

        # Encabezado
        c.drawString(70, 750, "CARPAS GUAJARDO PROD. SPA")
        c.setFont("Times-Roman", 11)
        c.drawString(70, 735, "Rut: 77.011.105-6")
        c.drawString(70, 720, "Isla Deceit N°8774")
        c.drawString(70, 705, "Pudahuel")
        c.drawString(70, 690, "cel: +569 45121257")

        # Fecha y Folio
        c.drawString(460, 690, f"FECHA: {fecha_actual}")
        c.drawString(460, 675, f"FOLIO : N° {self.formatear_dinero(folio)}")

        # Título
        c.setFont("Times-Roman", 18)
        c.drawString(250, 650, "COTIZACIÓN")
        c.setLineWidth(0.3)
        c.line(250, 645, 360, 645)  # Subrayar el título

        # Información del cliente
        c.setFont("Times-Roman", 12)
        c.drawString(70, 630, "CLIENTE:")
        c.line(70, 628, 125, 628)  # Subrayar la palabra CLIENTE
        c.drawString(70, 615, "ATENCION:")
        c.setFont("Times-Roman", 12)
        c.drawString(170, 615, atencion)
        c.line(170, 613, 360, 613)  # Subrayar la palabra ATENCION
        c.drawString(70, 600, "EMPRESA:")
        c.drawString(170, 600, empresa)
        c.line(170, 598, 360, 598)  # Subrayar la palabra EMPRESA
        
        # Título de la tabla
        c.setFont("Times-Bold", 12)
        c.drawString(70, 570, "CUADRO DETALLE ARRIENDO CARPA ESCENARIO:")
        c.line(70, 568, 370, 568)  # Subrayar el título
        
        # Formatear los totales con el símbolo de dinero
        formatted_tabla_datos = [(detalle, largo, alto, total_mts, f"${self.formatear_dinero(valor_m2)}", f"${self.formatear_dinero(total)}") 
                                  for detalle, largo, alto, total_mts, valor_m2, total in self.tabla_datos]

        # Tabla de detalles
        table_data = [["Detalle", "Largo", "Alto", "Total Mts", "Valor M2", "Total"]] + formatted_tabla_datos + [
            ["Total Neto", "", "", "", "", neto],
            ["IVA", "", "", "", "", iva],
            ["Total Bruto", "", "", "", "", bruto]
        ]

        # Crear la tabla con los datos
        table = Table(table_data, colWidths=[70, 40, 40, 50, 50, 70])

        # Configuración del estilo de la tabla
        table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),              # Alinear los números a la derecha
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),            # Centrar verticalmente dentro de las celdas
            ('FONTNAME', (0, 0), (-1, 0), 'Times-Bold'),       # Fuente en negrita para el encabezado
            ('FONTNAME', (0, 1), (-1, -1), 'Times-Roman'),     # Fuente normal para los datos
            ('FONTNAME', (0, -3), (-1, -1), 'Times-Bold'),     # Fuente en negrita para Neto, IVA y Bruto
            ('SPAN', (0, -3), (-2, -3)),                       # Combinar celdas de Neto
            ('SPAN', (0, -2), (-2, -2)),                       # Combinar celdas de IVA
            ('SPAN', (0, -1), (-2, -1)),                       # Combinar celdas de Bruto
            ('ALIGN', (0, -3), (0, -1), 'LEFT'),               # Alinear títulos Neto, IVA, Bruto a la izquierda
            ('ALIGN', (-1, -3), (-1, -1), 'RIGHT')             # Mantener los valores del Total a la derecha
        ]))

        # Altura estimada de la tabla
        table_height = 15 * len(table_data)  # Estimar altura (15 unidades por fila)

        # Ajustar posición y dibujar la tabla en el lienzo
        table.wrapOn(c, 70, 550 - table_height - 20)  # Ajustar posición
        table.drawOn(c, 70, 550 - table_height - 20)  # Dibujar la tabla

        # Descripción de la carpa
        y = 550 - table_height - 40  # Adjust y position based on table height with additional margin
        c.setFont("Times-Bold", 12)
        c.drawString(70, y, "Descripción Carpa:")
        c.setFont("Times-Roman", 12)
        y -= 15
        for descripcion in self.descripcion_datos:
            c.drawString(80, y, f"• {descripcion}")
            y -= 15

        # Adjust the y position for the following sections based on the number of descriptions
        y -= 5

        # Fechas y lugar
        c.setFont("Times-Roman", 12)
        c.drawString(70, y - 10, "Fecha Evento:")
        c.drawString(170, y - 10, fecha_evento)
        c.drawString(70, y - 25, "Fecha Montaje:")
        c.drawString(170, y - 25, fecha_montaje)
        c.drawString(70, y - 40, "Fecha Desarme:")
        c.drawString(170, y - 40, fecha_desarme)
        c.drawString(70, y - 55, "Lugar Evento:")
        c.drawString(170, y - 55, lugar_evento)
        c.drawString(70, y - 70, "Forma de Pago:")
        c.drawString(170, y - 70, forma_pago)

        # Título de la tabla
        c.setFont("Times-Roman", 12)

        # Título de la tabla de fechas y lugar
        c.drawString(70, y - 90, "Esperando que este servicio sea de su interés, le saluda atentamente,")
        
        # Firma y pie de página
        firma_y = 150
        pie_y = 50

        if y - 80 < firma_y + 20:  # Check if there's enough space for the signature and footer
            c.showPage()  # Create a new page
            y = 750  # Reset y position for the new page

        # Firma
        c.setFont("Times-Roman", 12)
        c.drawCentredString(300, firma_y, "Ariel Guajardo V.")
        c.line(255, firma_y - 2, 343, firma_y - 2)  # Subrayar el nombre
        c.setFont("Times-Italic", 12)
        c.drawCentredString(300, firma_y - 15, "Carpas Guajardo Prod. Spa")
        c.drawCentredString(300, firma_y - 30, "Fono: +56963436322 - +56945121257")

        # Pie de página
        c.setFont("Times-Roman", 10)
        c.drawCentredString(300, pie_y, "Carpas Guajardo")
        c.drawCentredString(300, pie_y - 15, "Fono: +56945121257 - Cel. +56963436322")

        c.save()
        print(f"PDF generado correctamente en {file_path}")
        messagebox.showinfo("Cotización Generada", "La cotización se generó exitosamente.")

# Ejecutar la aplicación
if __name__ == "__main__":
    root = Tk()
    app = CotizacionApp(root)
    root.mainloop()
