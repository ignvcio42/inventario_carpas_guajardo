"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "react-hot-toast";
import {
  PencilIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  BuildingOfficeIcon,
  UserIcon,
  CalendarIcon,
  BanknotesIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import type { RouterOutputs } from "~/trpc/react";

type Cotizacion = RouterOutputs["cotizacion"]["getAll"]["cotizaciones"][number];

interface CotizacionCardProps {
  cotizacion: Cotizacion;
  onEdit: (id: number) => void;
  onRefresh: () => void;
}

const estadoColors = {
  BORRADOR: "bg-gray-100 text-gray-800 border-gray-300",
  ENVIADA: "bg-blue-100 text-blue-800 border-blue-300",
  ACEPTADA: "bg-green-100 text-green-800 border-green-300",
  RECHAZADA: "bg-red-100 text-red-800 border-red-300",
  VENCIDA: "bg-orange-100 text-orange-800 border-orange-300",
};

const estadoLabels = {
  BORRADOR: "Borrador",
  ENVIADA: "Enviada",
  ACEPTADA: "Aceptada",
  RECHAZADA: "Rechazada",
  VENCIDA: "Vencida",
};

export function CotizacionCard({ cotizacion, onEdit, onRefresh }: CotizacionCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [customFilename, setCustomFilename] = useState<string>("");
  const utils = api.useUtils();

  const deleteMutation = api.cotizacion.delete.useMutation({
    onSuccess: () => {
      toast.success("Cotización eliminada exitosamente");
      void utils.cotizacion.getAll.invalidate();
      onRefresh();
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar cotización");
    },
  });

  const generarPDFMutation = api.cotizacion.generarPDF.useMutation({
    onSuccess: (data) => {
      // Convertir base64 a blob y descargar
      const byteCharacters = atob(data.pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // Usar el nombre personalizado si se proporcionó, sino usar el nombre por defecto
      const finalFilename = customFilename 
        ? `${customFilename} N°${cotizacion.folio}.pdf`
        : `Cotización N°${cotizacion.folio}.pdf`;
      
      link.download = finalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("PDF generado exitosamente");
      setCustomFilename(""); // Limpiar el nombre personalizado
      setShowPdfModal(false); // Cerrar modal
    },
    onError: (error) => {
      toast.error(error.message || "Error al generar PDF");
      setShowPdfModal(false); // Cerrar modal en caso de error
    },
  });

  const handleOpenPdfModal = () => {
    const defaultName = cotizacion.empresa || cotizacion.atencion || "Cotización";
    setCustomFilename(defaultName);
    setShowPdfModal(true);
  };

  const handleConfirmGeneratePDF = () => {
    // Si el usuario deja vacío, usar el nombre por defecto
    const finalName = customFilename.trim() || cotizacion.empresa || cotizacion.atencion || "Cotización";
    setCustomFilename(finalName);
    
    // Generar el PDF
    generarPDFMutation.mutate({ id: cotizacion.id });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: cotizacion.id });
    setShowDeleteConfirm(false);
  };

  const formatearDinero = (valor: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(valor);
  };

  const formatearFecha = (fecha: Date | null) => {
    if (!fecha) return "No especificada";
    return new Date(fecha).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <>
      <div className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
        {/* Header */}
        <div className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm">
                  <span className="text-lg font-bold text-blue-600">
                    #{cotizacion.folio}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {cotizacion.atencion}
                  </h3>
                  {cotizacion.empresa && (
                    <p className="flex items-center gap-1 text-sm text-gray-600">
                      <BuildingOfficeIcon className="h-4 w-4" />
                      {cotizacion.empresa}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                estadoColors[cotizacion.estado]
              }`}
            >
              {estadoLabels[cotizacion.estado]}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Cliente */}
            {cotizacion.cliente && (
              <div className="flex items-start gap-2">
                <UserIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500">Cliente</p>
                  <p className="truncate text-sm font-medium text-gray-900">
                    {cotizacion.cliente.nombre}
                  </p>
                </div>
              </div>
            )}

            {/* Fecha Evento */}
            {cotizacion.fechaEvento && (
              <div className="flex items-start gap-2">
                <CalendarIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500">Fecha Evento</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatearFecha(cotizacion.fechaEvento)}
                  </p>
                </div>
              </div>
            )}

            {/* Total */}
            <div className="flex items-start gap-2">
              <BanknotesIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">Total Bruto</p>
                <p className="text-sm font-bold text-blue-600">
                  {formatearDinero(Number(cotizacion.bruto))}
                </p>
              </div>
            </div>

            {/* Fecha Creación */}
            <div className="flex items-start gap-2">
              <ClockIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">Creada</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatearFecha(cotizacion.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Detalles */}
          {cotizacion.detalles.length > 0 && (
            <div className="mt-4 rounded-lg bg-gray-50 p-3">
              <p className="mb-2 text-xs font-semibold text-gray-700">
                Detalles ({cotizacion.detalles.length})
              </p>
              <div className="space-y-1">
                {cotizacion.detalles.slice(0, 2).map((detalle, index) => (
                  <p key={index} className="text-xs text-gray-600">
                    • {detalle.detalle} - {Number(detalle.totalMts)}m²
                  </p>
                ))}
                {cotizacion.detalles.length > 2 && (
                  <p className="text-xs font-medium text-blue-600">
                    +{cotizacion.detalles.length - 2} más...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Por: {cotizacion.createdBy.name ?? cotizacion.createdBy.email}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleOpenPdfModal}
                disabled={generarPDFMutation.isPending}
                className="rounded-lg p-2 text-green-600 hover:bg-green-50 disabled:opacity-50"
                title="Generar PDF"
              >
                <DocumentArrowDownIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => onEdit(cotizacion.id)}
                className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                title="Editar"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                title="Eliminar"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              ¿Eliminar Cotización?
            </h3>
            <p className="mb-6 text-gray-600">
              ¿Estás seguro de que deseas eliminar la cotización #{cotizacion.folio}? Esta
              acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="rounded-lg bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para nombre del PDF */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <DocumentArrowDownIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Generar PDF
                </h3>
                <p className="text-sm text-gray-500">
                  Cotización #{cotizacion.folio}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="pdfFilename" className="mb-2 block text-sm font-medium text-gray-700">
                Nombre del archivo
              </label>
              <input
                id="pdfFilename"
                type="text"
                value={customFilename}
                onChange={(e) => setCustomFilename(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Ingrese el nombre del archivo"
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500">
                El archivo se guardará como: <span className="font-semibold text-gray-700">
                  {customFilename.trim() || "Cotización"} N°{cotizacion.folio}.pdf
                </span>
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPdfModal(false);
                  setCustomFilename("");
                }}
                disabled={generarPDFMutation.isPending}
                className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmGeneratePDF}
                disabled={generarPDFMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 font-medium text-white hover:bg-green-600 disabled:opacity-50"
              >
                {generarPDFMutation.isPending ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generando...
                  </>
                ) : (
                  <>
                    <DocumentArrowDownIcon className="h-4 w-4" />
                    Generar PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

