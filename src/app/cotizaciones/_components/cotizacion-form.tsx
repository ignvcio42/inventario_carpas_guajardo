"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { toast } from "react-hot-toast";
import { 
  PlusIcon, 
  TrashIcon, 
  XMarkIcon,
  CalculatorIcon,
  DocumentTextIcon,
  CalendarIcon,
  MapPinIcon,
  CreditCardIcon,
  UserIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface DetalleItem {
  detalle: string;
  largo: number;
  alto: number;
  totalMts: number;
  valorM2: number;
  total: number;
  orden: number;
}

interface DescripcionItem {
  descripcion: string;
  orden: number;
}

interface CotizacionFormProps {
  cotizacionId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

const DESCRIPCIONES_PREDEFINIDAS = [
  "Estructura Metálica (3 mts altura parejo)",
  "Estructura Metálica (4 mts altura parejo)",
  "Estructura Metálica (5 mts altura parejo)",
  "Techo Blanco",
  "Techo negro",
  "Techo blanco o negro",
  "Cubre pilares color blanco",
  "Iluminación LED decorativa",
  "Montaje y Desmontaje",
  "Iluminación básica",
  "Cubrepiso",
];

interface SortableDetalleRowProps {
  detalle: DetalleItem;
  index: number;
  onUpdate: (index: number, field: keyof DetalleItem, value: string | number) => void;
  onDelete: (index: number) => void;
  formatearDinero: (valor: number) => string;
}

function SortableDetalleRow({ detalle, index, onUpdate, onDelete, formatearDinero }: SortableDetalleRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `detalle-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleFieldChange = (field: keyof DetalleItem, value: string) => {
    if (field === "detalle") {
      onUpdate(index, field, value);
    } else {
      const numValue = parseFloat(value) || 0;
      onUpdate(index, field, numValue);
    }
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-gray-100 text-sm hover:bg-gray-50">
      <td className="p-2 sm:p-3">
        <div className="flex items-center gap-1 sm:gap-2 min-w-[180px] sm:min-w-[200px]">
          <button
            type="button"
            className="cursor-grab touch-none text-gray-400 hover:text-gray-600 active:cursor-grabbing flex-shrink-0"
            {...attributes}
            {...listeners}
          >
            <Bars3Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <input
            type="text"
            value={detalle.detalle}
            onChange={(e) => handleFieldChange("detalle", e.target.value)}
            className="w-full min-w-0 rounded border border-gray-200 px-2 py-1 text-xs sm:text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </td>
      <td className="p-2 sm:p-3">
        <input
          type="number"
          value={detalle.largo}
          onChange={(e) => handleFieldChange("largo", e.target.value)}
          step="0.01"
          className="w-full min-w-[60px] rounded border border-gray-200 px-2 py-1 text-xs sm:text-sm focus:border-blue-500 focus:outline-none"
        />
      </td>
      <td className="p-2 sm:p-3">
        <input
          type="number"
          value={detalle.alto}
          onChange={(e) => handleFieldChange("alto", e.target.value)}
          step="0.01"
          className="w-full min-w-[60px] rounded border border-gray-200 px-2 py-1 text-xs sm:text-sm focus:border-blue-500 focus:outline-none"
        />
      </td>
      <td className="p-2 sm:p-3">
        <div className="rounded bg-gray-50 px-2 py-1 text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap min-w-[60px]">
          {detalle.totalMts.toFixed(2)}
        </div>
      </td>
      <td className="p-2 sm:p-3">
        <input
          type="number"
          value={detalle.valorM2}
          onChange={(e) => handleFieldChange("valorM2", e.target.value)}
          step="1"
          className="w-full min-w-[80px] rounded border border-gray-200 px-2 py-1 text-xs sm:text-sm focus:border-blue-500 focus:outline-none"
        />
      </td>
      <td className="p-2 sm:p-3">
        <div className="rounded bg-blue-50 px-2 py-1 text-xs sm:text-sm font-semibold text-blue-700 whitespace-nowrap min-w-[80px]">
          {formatearDinero(detalle.total)}
        </div>
      </td>
      <td className="p-2 sm:p-3">
        <button
          type="button"
          onClick={() => onDelete(index)}
          className="rounded-lg p-1 text-red-500 hover:bg-red-50 flex-shrink-0"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

interface SortableDescripcionRowProps {
  descripcion: DescripcionItem;
  index: number;
  onUpdate: (index: number, value: string) => void;
  onDelete: (index: number) => void;
}

function SortableDescripcionRow({ descripcion, index, onUpdate, onDelete }: SortableDescripcionRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `descripcion-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded-lg bg-gray-50 p-2 sm:p-3 hover:bg-gray-100"
    >
      <div className="flex flex-1 items-center gap-1 sm:gap-2 min-w-0">
        <button
          type="button"
          className="cursor-grab touch-none text-gray-400 hover:text-gray-600 active:cursor-grabbing flex-shrink-0"
          {...attributes}
          {...listeners}
        >
          <Bars3Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <span className="text-sm text-gray-500 flex-shrink-0">•</span>
        <input
          type="text"
          value={descripcion.descripcion}
          onChange={(e) => onUpdate(index, e.target.value)}
          className="flex-1 min-w-0 rounded border border-gray-200 px-2 py-1.5 text-xs sm:text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:px-3"
        />
      </div>
      <button
        type="button"
        onClick={() => onDelete(index)}
        className="ml-1 sm:ml-2 rounded-lg p-1 text-red-500 hover:bg-red-100 flex-shrink-0"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export function CotizacionForm({ cotizacionId, onClose, onSuccess }: CotizacionFormProps) {
  const utils = api.useUtils();

  // Estados del formulario principal
  const [folio, setFolio] = useState("");
  const [atencion, setAtencion] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [fechaEvento, setFechaEvento] = useState("");
  const [fechaMontaje, setFechaMontaje] = useState("");
  const [fechaDesarme, setFechaDesarme] = useState("");
  const [lugarEvento, setLugarEvento] = useState("");
  const [formaPago, setFormaPago] = useState("");
  const [notas, setNotas] = useState("");
  const [estado, setEstado] = useState<"BORRADOR" | "ENVIADA" | "ACEPTADA" | "RECHAZADA" | "VENCIDA">("BORRADOR");

  // Estados para detalles
  const [detalles, setDetalles] = useState<DetalleItem[]>([]);
  const [currentDetalle, setCurrentDetalle] = useState({
    detalle: "",
    largo: 0,
    alto: 0,
    valorM2: 0,
  });

  // Estados para descripciones
  const [descripciones, setDescripciones] = useState<DescripcionItem[]>([]);
  const [currentDescripcion, setCurrentDescripcion] = useState("");
  const [selectedPredefinida, setSelectedPredefinida] = useState("");

  // Totales
  const [neto, setNeto] = useState(0);
  const [iva, setIva] = useState(0);
  const [bruto, setBruto] = useState(0);

  // Queries
  const { data: nextFolio } = api.cotizacion.getNextFolio.useQuery(undefined, {
    enabled: !cotizacionId,
  });

  const { data: cotizacion } = api.cotizacion.getById.useQuery(
    { id: cotizacionId! },
    { enabled: !!cotizacionId }
  );

  // Mutations
  const createMutation = api.cotizacion.create.useMutation({
    onSuccess: () => {
      toast.success("Cotización creada exitosamente");
      void utils.cotizacion.getAll.invalidate();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear cotización");
    },
  });

  const updateMutation = api.cotizacion.update.useMutation({
    onSuccess: () => {
      toast.success("Cotización actualizada exitosamente");
      void utils.cotizacion.getAll.invalidate();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar cotización");
    },
  });

  // Sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Manejar fin de drag de detalles
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setDetalles((items) => {
        const oldIndex = items.findIndex((_, i) => `detalle-${i}` === active.id);
        const newIndex = items.findIndex((_, i) => `detalle-${i}` === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, index) => ({ ...item, orden: index }));
      });
    }
  };

  // Manejar fin de drag de descripciones
  const handleDragEndDescripciones = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setDescripciones((items) => {
        const oldIndex = items.findIndex((_, i) => `descripcion-${i}` === active.id);
        const newIndex = items.findIndex((_, i) => `descripcion-${i}` === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, index) => ({ ...item, orden: index }));
      });
    }
  };

  // Actualizar detalle inline
  const handleUpdateDetalle = (index: number, field: keyof DetalleItem, value: string | number) => {
    setDetalles((prevDetalles) => {
      const newDetalles = [...prevDetalles];
      const detalle = newDetalles[index];
      if (!detalle) return prevDetalles;

      const updatedDetalle = { ...detalle, [field]: value };

      // Recalcular totales si cambian los valores numéricos
      if (field === "largo" || field === "alto" || field === "valorM2") {
        const totalMts = updatedDetalle.largo * updatedDetalle.alto;
        const total = totalMts * updatedDetalle.valorM2;
        updatedDetalle.totalMts = totalMts;
        updatedDetalle.total = total;
      }

      newDetalles[index] = updatedDetalle;
      return newDetalles;
    });
  };

  // Actualizar descripción inline
  const handleUpdateDescripcion = (index: number, value: string) => {
    setDescripciones((prevDescripciones) => {
      const newDescripciones = [...prevDescripciones];
      const descripcion = newDescripciones[index];
      if (!descripcion) return prevDescripciones;

      newDescripciones[index] = { ...descripcion, descripcion: value };
      return newDescripciones;
    });
  };

  // Cargar folio automático
  useEffect(() => {
    if (nextFolio && !cotizacionId) {
      setFolio(formatearFolio(nextFolio));
    }
  }, [nextFolio, cotizacionId]);

  // Cargar datos de cotización existente
  useEffect(() => {
    if (cotizacion) {
      setFolio(formatearFolio(cotizacion.folio));
      setAtencion(cotizacion.atencion);
      setEmpresa(cotizacion.empresa ?? "");
      setFechaEvento(cotizacion.fechaEvento ? (new Date(cotizacion.fechaEvento).toISOString().split("T")[0] ?? "") : "");
      setFechaMontaje(cotizacion.fechaMontaje ? (new Date(cotizacion.fechaMontaje).toISOString().split("T")[0] ?? "") : "");
      setFechaDesarme(cotizacion.fechaDesarme ? (new Date(cotizacion.fechaDesarme).toISOString().split("T")[0] ?? "") : "");
      setLugarEvento(cotizacion.lugarEvento ?? "");
      setFormaPago(cotizacion.formaPago ?? "");
      setNotas(cotizacion.notas ?? "");
      setEstado(cotizacion.estado);
      
      const detallesConvertidos = cotizacion.detalles.map((d, index) => ({
        detalle: d.detalle,
        largo: Number(d.largo),
        alto: Number(d.alto),
        totalMts: Number(d.totalMts),
        valorM2: Number(d.valorM2),
        total: Number(d.total),
        orden: index,
      }));
      setDetalles(detallesConvertidos);

      const descripcionesConvertidas = cotizacion.descripciones.map((d, index) => ({
        descripcion: d.descripcion,
        orden: index,
      }));
      setDescripciones(descripcionesConvertidas);
    }
  }, [cotizacion]);

  // Calcular totales cuando cambian los detalles
  useEffect(() => {
    const nuevoNeto = detalles.reduce((sum, d) => sum + d.total, 0);
    const nuevoIva = nuevoNeto * 0.19;
    const nuevoBruto = nuevoNeto + nuevoIva;

    setNeto(nuevoNeto);
    setIva(nuevoIva);
    setBruto(nuevoBruto);
  }, [detalles]);

  // Calcular total de metros y total automáticamente
  const calcularTotales = (largo: number, alto: number, valorM2: number) => {
    const totalMts = largo * alto;
    const total = totalMts * valorM2;
    return { totalMts, total };
  };

  const handleDetalleChange = (field: string, value: string | number) => {
    const newDetalle = { ...currentDetalle, [field]: field === "detalle" ? value : Number(value) };
    setCurrentDetalle(newDetalle);
  };

  const agregarDetalle = () => {
    if (!currentDetalle.detalle || currentDetalle.largo <= 0 || currentDetalle.alto <= 0 || currentDetalle.valorM2 <= 0) {
      toast.error("Por favor completa todos los campos del detalle");
      return;
    }

    const { totalMts, total } = calcularTotales(currentDetalle.largo, currentDetalle.alto, currentDetalle.valorM2);

    const nuevoDetalle: DetalleItem = {
      ...currentDetalle,
      totalMts,
      total,
      orden: detalles.length,
    };

    setDetalles([...detalles, nuevoDetalle]);
    setCurrentDetalle({ detalle: "", largo: 0, alto: 0, valorM2: 0 });
  };

  const eliminarDetalle = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const agregarDescripcion = () => {
    if (!currentDescripcion.trim()) {
      toast.error("Por favor ingresa una descripción");
      return;
    }

    const nuevaDescripcion: DescripcionItem = {
      descripcion: currentDescripcion,
      orden: descripciones.length,
    };

    setDescripciones([...descripciones, nuevaDescripcion]);
    setCurrentDescripcion("");
  };

  const agregarDescripcionPredefinida = () => {
    if (!selectedPredefinida) {
      toast.error("Por favor selecciona una descripción");
      return;
    }

    const nuevaDescripcion: DescripcionItem = {
      descripcion: selectedPredefinida,
      orden: descripciones.length,
    };

    setDescripciones([...descripciones, nuevaDescripcion]);
    setSelectedPredefinida("");
  };

  const eliminarDescripcion = (index: number) => {
    setDescripciones(descripciones.filter((_, i) => i !== index));
  };

  const formatearDinero = (valor: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(valor);
  };

  const formatearFolio = (valor: string) => {
    // Eliminar todo lo que no sea número
    const numeros = valor.replace(/\D/g, "");
    
    // Si está vacío, retornar vacío
    if (!numeros) return "";
    
    // Formatear con separador de miles
    return new Intl.NumberFormat("es-CL").format(Number(numeros));
  };

  const handleFolioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numeros = inputValue.replace(/\D/g, "");
    
    // Guardar el valor formateado
    setFolio(numeros ? formatearFolio(numeros) : "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!folio || !atencion) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    if (detalles.length === 0) {
      toast.error("Debes agregar al menos un detalle");
      return;
    }

    // Extraer solo los números del folio para enviar al backend
    const folioSinFormato = folio.replace(/\D/g, "");

    const data = {
      folio: folioSinFormato,
      atencion,
      empresa: empresa || undefined,
      fechaEvento: fechaEvento ? new Date(fechaEvento) : undefined,
      fechaMontaje: fechaMontaje ? new Date(fechaMontaje) : undefined,
      fechaDesarme: fechaDesarme ? new Date(fechaDesarme) : undefined,
      lugarEvento: lugarEvento || undefined,
      formaPago: formaPago || undefined,
      neto,
      iva,
      bruto,
      estado,
      notas: notas || undefined,
      detalles,
      descripciones,
    };

    if (cotizacionId) {
      updateMutation.mutate({ id: cotizacionId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/50 backdrop-blur-sm">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-6xl rounded-2xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500 p-2">
                <DocumentTextIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {cotizacionId ? "Editar Cotización" : "Nueva Cotización"}
                </h2>
                <p className="text-sm text-gray-500">
                  Completa los datos de la cotización
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-8">
              {/* Información Básica */}
              <div className="rounded-lg border border-gray-200 p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <UserIcon className="h-5 w-5 text-blue-500" />
                  Información Básica
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Folio *
                    </label>
                    <input
                      type="text"
                      value={folio}
                      onChange={handleFolioChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Ej: 1.234"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Atención *
                    </label>
                    <input
                      type="text"
                      value={atencion}
                      onChange={(e) => setAtencion(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Nombre de contacto"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Empresa
                    </label>
                    <input
                      type="text"
                      value={empresa}
                      onChange={(e) => setEmpresa(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Nombre de la empresa"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Estado
                    </label>
                    <select
                      value={estado}
                      onChange={(e) => setEstado(e.target.value as typeof estado)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="BORRADOR">Borrador</option>
                      <option value="ENVIADA">Enviada</option>
                      <option value="ACEPTADA">Aceptada</option>
                      <option value="RECHAZADA">Rechazada</option>
                      <option value="VENCIDA">Vencida</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Detalles de la Cotización */}
              <div className="rounded-lg border border-gray-200 p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <CalculatorIcon className="h-5 w-5 text-blue-500" />
                  Detalles de la Cotización
                </h3>
                
                {/* Formulario para agregar detalle */}
                <div className="mb-4 rounded-lg bg-gray-50 p-3 sm:p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-6">
                    <div className="sm:col-span-2 md:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-gray-700 sm:hidden">
                        Detalle
                      </label>
                      <input
                        type="text"
                        value={currentDetalle.detalle}
                        onChange={(e) => handleDetalleChange("detalle", e.target.value)}
                        placeholder="Detalle"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 sm:hidden">
                        Largo
                      </label>
                      <input
                        type="number"
                        value={currentDetalle.largo || ""}
                        onChange={(e) => handleDetalleChange("largo", e.target.value)}
                        placeholder="Largo"
                        step="0.01"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 sm:hidden">
                        Ancho
                      </label>
                      <input
                        type="number"
                        value={currentDetalle.alto || ""}
                        onChange={(e) => handleDetalleChange("alto", e.target.value)}
                        placeholder="Ancho"
                        step="0.01"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 sm:hidden">
                        Valor M²
                      </label>
                      <input
                        type="number"
                        value={currentDetalle.valorM2 || ""}
                        onChange={(e) => handleDetalleChange("valorM2", e.target.value)}
                        placeholder="Valor M²"
                        step="1"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2 md:col-span-1">
                      <label className="mb-1 block text-xs font-medium text-gray-700 sm:hidden opacity-0">
                        Agregar
                      </label>
                      <button
                        type="button"
                        onClick={agregarDetalle}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                      >
                        <PlusIcon className="h-4 w-4" />
                        <span className="sm:hidden">Agregar Detalle</span>
                        <span className="hidden sm:inline">Agregar</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lista de detalles */}
                {detalles.length > 0 && (
                  <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr className="text-left text-xs font-semibold text-gray-700">
                              <th className="p-2 sm:p-3 whitespace-nowrap">Detalle</th>
                              <th className="p-2 sm:p-3 whitespace-nowrap">Largo</th>
                              <th className="p-2 sm:p-3 whitespace-nowrap">Ancho</th>
                              <th className="p-2 sm:p-3 whitespace-nowrap">Total M²</th>
                              <th className="p-2 sm:p-3 whitespace-nowrap">Valor M²</th>
                              <th className="p-2 sm:p-3 whitespace-nowrap">Total</th>
                              <th className="p-2 sm:p-3"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            <SortableContext
                              items={detalles.map((_, index) => `detalle-${index}`)}
                              strategy={verticalListSortingStrategy}
                            >
                              {detalles.map((detalle, index) => (
                                <SortableDetalleRow
                                  key={`detalle-${index}`}
                                  detalle={detalle}
                                  index={index}
                                  onUpdate={handleUpdateDetalle}
                                  onDelete={eliminarDetalle}
                                  formatearDinero={formatearDinero}
                                />
                              ))}
                            </SortableContext>
                          </tbody>
                        </table>
                      </DndContext>
                    </div>
                  </div>
                )}

                {/* Totales */}
                <div className="mt-6 flex justify-end">
                  <div className="w-full max-w-sm space-y-2 rounded-lg bg-gray-50 p-4">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">Neto:</span>
                      <span className="font-semibold">{formatearDinero(neto)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">IVA (19%):</span>
                      <span className="font-semibold">{formatearDinero(iva)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-300 pt-2 text-base">
                      <span className="font-bold text-gray-900">Total Bruto:</span>
                      <span className="font-bold text-blue-600">{formatearDinero(bruto)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Descripciones */}
              <div className="rounded-lg border border-gray-200 p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                  Descripción de la Carpa
                </h3>
                
                <div className="space-y-4">
                  {/* Descripción personalizada */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Descripción Personalizada
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        value={currentDescripcion}
                        onChange={(e) => setCurrentDescripcion(e.target.value)}
                        placeholder="Ingresa una descripción"
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none sm:px-4"
                      />
                      <button
                        type="button"
                        onClick={agregarDescripcion}
                        className="flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 sm:w-auto"
                      >
                        <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="sm:hidden">Agregar Personalizada</span>
                      </button>
                    </div>
                  </div>

                  {/* Descripción predefinida */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Descripción Predefinida
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select
                        value={selectedPredefinida}
                        onChange={(e) => setSelectedPredefinida(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none sm:px-4"
                      >
                        <option value="">Selecciona una opción</option>
                        {DESCRIPCIONES_PREDEFINIDAS.map((desc, index) => (
                          <option key={index} value={desc}>
                            {desc}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={agregarDescripcionPredefinida}
                        className="flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 sm:w-auto"
                      >
                        <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="sm:hidden">Agregar Predefinida</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lista de descripciones */}
                {descripciones.length > 0 && (
                  <div className="mt-4">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEndDescripciones}
                    >
                      <SortableContext
                        items={descripciones.map((_, index) => `descripcion-${index}`)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {descripciones.map((desc, index) => (
                            <SortableDescripcionRow
                              key={`descripcion-${index}`}
                              descripcion={desc}
                              index={index}
                              onUpdate={handleUpdateDescripcion}
                              onDelete={eliminarDescripcion}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                )}
              </div>

              {/* Información del Evento */}
              <div className="rounded-lg border border-gray-200 p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <CalendarIcon className="h-5 w-5 text-blue-500" />
                  Información del Evento
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Fecha del Evento
                    </label>
                    <input
                      type="date"
                      value={fechaEvento}
                      onChange={(e) => setFechaEvento(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Fecha de Montaje
                    </label>
                    <input
                      type="date"
                      value={fechaMontaje}
                      onChange={(e) => setFechaMontaje(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Fecha de Desarme
                    </label>
                    <input
                      type="date"
                      value={fechaDesarme}
                      onChange={(e) => setFechaDesarme(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      <MapPinIcon className="mr-1 inline h-4 w-4" />
                      Lugar del Evento
                    </label>
                    <input
                      type="text"
                      value={lugarEvento}
                      onChange={(e) => setLugarEvento(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      placeholder="Dirección o lugar del evento"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      <CreditCardIcon className="mr-1 inline h-4 w-4" />
                      Forma de Pago
                    </label>
                    <input
                      type="text"
                      value={formaPago}
                      onChange={(e) => setFormaPago(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                      placeholder="Ej: 50% anticipo, 50% final"
                    />
                  </div>
                </div>
              </div>

              {/* Notas */}
              <div className="rounded-lg border border-gray-200 p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                  Notas Adicionales
                </h3>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="Notas internas sobre la cotización..."
                />
              </div>
            </div>

            {/* Footer con botones */}
            <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-6 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="rounded-lg bg-blue-500 px-6 py-2.5 font-medium text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Guardando..."
                  : cotizacionId
                  ? "Actualizar Cotización"
                  : "Crear Cotización"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

