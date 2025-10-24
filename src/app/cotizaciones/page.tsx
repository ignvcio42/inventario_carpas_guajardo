"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import MainLayout from "../_components/main-layout";
import { CotizacionForm } from "./_components/cotizacion-form";
import { CotizacionCard } from "./_components/cotizacion-card";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

type EstadoFilter = "BORRADOR" | "ENVIADA" | "ACEPTADA" | "RECHAZADA" | "VENCIDA" | undefined;

export default function CotizacionesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>(undefined);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Query para obtener cotizaciones
  const { data, isLoading, refetch } = api.cotizacion.getAll.useQuery({
    search: searchTerm || undefined,
    estado: estadoFilter,
    page,
    pageSize,
  });

  // Query para estadísticas
  const { data: stats } = api.cotizacion.getStats.useQuery();

  const handleEdit = (id: number) => {
    setEditingId(id);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(undefined);
  };

  const handleFormSuccess = () => {
    handleCloseForm();
    void refetch();
  };

  const formatearDinero = (valor: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(valor);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
                <div className="rounded-xl bg-blue-500 p-3">
                  <DocumentTextIcon className="h-8 w-8 text-white" />
                </div>
                Cotizaciones
              </h1>
              <p className="mt-2 text-gray-600">
                Gestiona las cotizaciones de tus clientes
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-3 font-semibold text-white shadow-lg hover:bg-blue-600 transition-all hover:shadow-xl"
            >
              <PlusIcon className="h-5 w-5" />
              Nueva Cotización
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        {stats && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <ChartBarIcon className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Borradores</p>
                  <p className="mt-1 text-2xl font-bold text-gray-500">{stats.borradores}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Enviadas</p>
                  <p className="mt-1 text-2xl font-bold text-blue-600">{stats.enviadas}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm border border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Aceptadas</p>
                  <p className="mt-1 text-2xl font-bold text-green-600">{stats.aceptadas}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm border border-red-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Rechazadas</p>
                  <p className="mt-1 text-2xl font-bold text-red-600">{stats.rechazadas}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-4 shadow-sm">
              <div>
                <p className="text-sm font-medium text-white/90">Total Aceptado</p>
                <p className="mt-1 text-xl font-bold text-white">
                  {formatearDinero(stats.totalBruto)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filtros y búsqueda */}
        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm border border-gray-100">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Búsqueda */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por folio, nombre o empresa..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* Filtro por estado */}
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={estadoFilter ?? ""}
                onChange={(e) => {
                  setEstadoFilter((e.target.value || undefined) as EstadoFilter);
                  setPage(1);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Todos los estados</option>
                <option value="BORRADOR">Borrador</option>
                <option value="ENVIADA">Enviada</option>
                <option value="ACEPTADA">Aceptada</option>
                <option value="RECHAZADA">Rechazada</option>
                <option value="VENCIDA">Vencida</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de cotizaciones */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"></div>
          </div>
        ) : data?.cotizaciones && data.cotizaciones.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.cotizaciones.map((cotizacion) => (
                <CotizacionCard
                  key={cotizacion.id}
                  cotizacion={cotizacion}
                  onEdit={handleEdit}
                  onRefresh={() => void refetch()}
                />
              ))}
            </div>

            {/* Paginación */}
            {data.pages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Página {page} de {data.pages}
                </span>
                <button
                  onClick={() => setPage(Math.min(data.pages, page + 1))}
                  disabled={page === data.pages}
                  className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl bg-white shadow-sm">
            <DocumentTextIcon className="h-16 w-16 text-gray-300" />
            <p className="mt-4 text-lg font-medium text-gray-500">
              No hay cotizaciones
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Crea tu primera cotización para comenzar
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
            >
              <PlusIcon className="h-5 w-5" />
              Nueva Cotización
            </button>
          </div>
        )}
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <CotizacionForm
          cotizacionId={editingId}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}
      </div>
    </MainLayout>
  );
}


