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
  BuildingOfficeIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

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
  "Techo Blanco",
  "Techo negro",
  "Cubre pilares color blanco",
  "Iluminación LED decorativa",
  "Montaje y Desmontaje",
  "Iluminación básica",
  "Cubrepiso",
];

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

  // Cargar folio automático
  useEffect(() => {
    if (nextFolio && !cotizacionId) {
      setFolio(nextFolio);
    }
  }, [nextFolio, cotizacionId]);

  // Cargar datos de cotización existente
  useEffect(() => {
    if (cotizacion) {
      setFolio(cotizacion.folio);
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

    const data = {
      folio,
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
                      onChange={(e) => setFolio(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
                <div className="mb-4 rounded-lg bg-gray-50 p-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        value={currentDetalle.detalle}
                        onChange={(e) => handleDetalleChange("detalle", e.target.value)}
                        placeholder="Detalle"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
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
                      <input
                        type="number"
                        value={currentDetalle.alto || ""}
                        onChange={(e) => handleDetalleChange("alto", e.target.value)}
                        placeholder="Alto"
                        step="0.01"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={currentDetalle.valorM2 || ""}
                        onChange={(e) => handleDetalleChange("valorM2", e.target.value)}
                        placeholder="Valor M2"
                        step="1"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={agregarDetalle}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lista de detalles */}
                {detalles.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-700">
                          <th className="p-3">Detalle</th>
                          <th className="p-3">Largo</th>
                          <th className="p-3">Alto</th>
                          <th className="p-3">Total M²</th>
                          <th className="p-3">Valor M²</th>
                          <th className="p-3">Total</th>
                          <th className="p-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalles.map((detalle, index) => (
                          <tr key={index} className="border-b border-gray-100 text-sm">
                            <td className="p-3">{detalle.detalle}</td>
                            <td className="p-3">{detalle.largo}</td>
                            <td className="p-3">{detalle.alto}</td>
                            <td className="p-3">{detalle.totalMts}</td>
                            <td className="p-3">{formatearDinero(detalle.valorM2)}</td>
                            <td className="p-3 font-semibold">{formatearDinero(detalle.total)}</td>
                            <td className="p-3">
                              <button
                                type="button"
                                onClick={() => eliminarDetalle(index)}
                                className="rounded-lg p-1 text-red-500 hover:bg-red-50"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Descripción personalizada */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Descripción Personalizada
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentDescripcion}
                        onChange={(e) => setCurrentDescripcion(e.target.value)}
                        placeholder="Ingresa una descripción"
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={agregarDescripcion}
                        className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Descripción predefinida */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Descripción Predefinida
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedPredefinida}
                        onChange={(e) => setSelectedPredefinida(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
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
                        className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lista de descripciones */}
                {descripciones.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {descripciones.map((desc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                      >
                        <span className="text-sm text-gray-700">• {desc.descripcion}</span>
                        <button
                          type="button"
                          onClick={() => eliminarDescripcion(index)}
                          className="rounded-lg p-1 text-red-500 hover:bg-red-100"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
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

