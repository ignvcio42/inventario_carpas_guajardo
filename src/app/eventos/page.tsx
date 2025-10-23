"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import MainLayout from "../_components/main-layout";
import {
  Card,
  Text,
  Button,
  Stack,
  Title,
  Table,
  Badge,
  Group,
  Modal,
  TextInput,
  NumberInput,
  Textarea,
  Switch,
  Select,
  Grid,
  ActionIcon,
  Loader,
  Center,
  rem,
  Divider,
  Paper,
  ThemeIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconCalendarEvent,
  IconMapPin,
  IconUser,
  IconEye,
  IconSearch,
  IconCheck,
  IconX,
  IconClock,
  IconCurrencyDollar,
  IconRuler,
  IconPhone,
  IconNotes,
  IconTool,
  IconPencil,
} from "@tabler/icons-react";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { api } from "~/trpc/react";
import { Estado } from "@prisma/client";

interface EventFormValues {
  nombreCliente: string;
  contacto: string;
  direccion: string;
  descripcion: string;
  metros2: number;
  montoTotal: number;
  anticipo: number;
  startDate: Date | null;
  endDate: Date | null;
  horaInicio: Date | null;
  horaTermino: Date | null;
  carpa: boolean;
  toldo: boolean;
  iluminacion: boolean;
  calefaccion: boolean;
  cubrePiso: boolean;
  estado: Estado;
  comentario?: string;
  technicalVisitId?: number;
}

export default function EventosPage() {
  const { data: session, status } = useSession();
  const [opened, setOpened] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detailsOpened, setDetailsOpened] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [assignSketchModalOpen, setAssignSketchModalOpen] = useState(false);
  
  // Estados para búsqueda y filtrado
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("startDate-desc");

  const { data: events, isLoading, refetch } = api.event.getAll.useQuery();
  const { data: completedVisits } = api.event.getCompletedTechnicalVisits.useQuery();
  const { data: eventSketches } = api.sketch.getByEvent.useQuery(
    { eventId: selectedEvent?.id || 0 },
    { enabled: !!selectedEvent?.id }
  );

  // Función helper para formatear fechas en español
  const formatDateForTooltip = (date: Date | string) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
  };
  const { data: unassignedSketches } = api.sketch.getUnassigned.useQuery();
  const createEvent = api.event.create.useMutation();
  const updateEvent = api.event.update.useMutation();
  const deleteEvent = api.event.delete.useMutation();
  
  const utils = api.useUtils();
  const assignSketchMutation = api.sketch.assignToEvent.useMutation({
    onSuccess: () => {
      notifications.show({
        title: "Éxito",
        message: "Boceto asignado correctamente",
        color: "green",
      });
      void utils.sketch.getByEvent.invalidate();
      void utils.sketch.getUnassigned.invalidate();
      setAssignSketchModalOpen(false);
    },
  });

  const unassignSketchMutation = api.sketch.assignToEvent.useMutation({
    onSuccess: () => {
      notifications.show({
        title: "Éxito",
        message: "Boceto desasignado correctamente",
        color: "green",
      });
      void utils.sketch.getByEvent.invalidate();
      void utils.sketch.getUnassigned.invalidate();
    },
  });

  const [selectedTechnicalVisit, setSelectedTechnicalVisit] = useState<string | null>(null);

  const form = useForm<EventFormValues>({
    initialValues: {
      nombreCliente: "",
      contacto: "",
      direccion: "",
      descripcion: "",
      metros2: 0,
      montoTotal: 0,
      anticipo: 0,
      startDate: null,
      endDate: null,
      horaInicio: null,
      horaTermino: null,
      carpa: false,
      toldo: false,
      iluminacion: false,
      calefaccion: false,
      cubrePiso: false,
      estado: Estado.PENDIENTE,
      comentario: "",
      technicalVisitId: undefined,
    },
    validate: {
      nombreCliente: (value) =>
        value.trim().length > 0 ? null : "El nombre del cliente es requerido",
      contacto: (value) =>
        value.trim().length > 0 ? null : "El contacto es requerido",
      direccion: (value) =>
        value.trim().length > 0 ? null : "La dirección es requerida",
      descripcion: (value) =>
        value.trim().length > 0 ? null : "La descripción es requerida",
      metros2: (value) =>
        value > 0 ? null : "Los metros cuadrados deben ser mayores a 0",
      montoTotal: (value) =>
        value >= 0 ? null : "El monto total debe ser mayor o igual a 0",
      anticipo: (value) =>
        value >= 0 ? null : "El anticipo debe ser mayor o igual a 0",
      startDate: (value) => (value ? null : "La fecha de inicio es requerida"),
      endDate: (value) => (value ? null : "La fecha de término es requerida"),
      horaInicio: (value) =>
        value ? null : "La hora de inicio es requerida",
      horaTermino: (value) =>
        value ? null : "La hora de término es requerida",
    },
  });

  const handleOpenModal = (eventId?: number) => {
    if (eventId) {
      const event = events?.find((e) => e.id === eventId);
      if (event) {
        setEditingId(eventId);
        form.setValues({
          nombreCliente: event.nombreCliente,
          contacto: event.contacto,
          direccion: event.direccion,
          descripcion: event.descripcion,
          metros2: event.metros2,
          montoTotal: Number(event.montoTotal),
          anticipo: Number(event.anticipo),
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
          horaInicio: new Date(event.horaInicio),
          horaTermino: new Date(event.horaTermino),
          carpa: event.carpa,
          toldo: event.toldo,
          iluminacion: event.iluminacion,
          calefaccion: event.calefaccion,
          cubrePiso: event.cubrePiso,
          estado: event.estado,
          comentario: event.comentario || "",
          technicalVisitId: undefined,
        });
      }
    } else {
      setEditingId(null);
      setSelectedTechnicalVisit(null);
      form.reset();
    }
    setOpened(true);
  };

  const handleTechnicalVisitSelect = (visitId: string | null) => {
    setSelectedTechnicalVisit(visitId);
    
    if (visitId) {
      const visit = completedVisits?.find((v) => v.id.toString() === visitId);
      if (visit) {
        form.setFieldValue("nombreCliente", visit.nombreCliente);
        form.setFieldValue("contacto", visit.contacto);
        form.setFieldValue("direccion", visit.direccion);
        form.setFieldValue("technicalVisitId", visit.id);
      }
    } else {
      // Si se deselecciona, limpiar solo los campos auto-rellenados
      form.setFieldValue("nombreCliente", "");
      form.setFieldValue("contacto", "");
      form.setFieldValue("direccion", "");
      form.setFieldValue("technicalVisitId", undefined);
    }
  };

  const handleCloseModal = () => {
    setOpened(false);
    setEditingId(null);
    setSelectedTechnicalVisit(null);
    form.reset();
  };

  const handleSubmit = async (values: EventFormValues) => {
    try {
      const eventData = {
        nombreCliente: values.nombreCliente,
        contacto: values.contacto,
        direccion: values.direccion,
        descripcion: values.descripcion,
        metros2: values.metros2,
        montoTotal: values.montoTotal,
        anticipo: values.anticipo,
        startDate: values.startDate!,
        endDate: values.endDate!,
        horaInicio: values.horaInicio!,
        horaTermino: values.horaTermino!,
        carpa: values.carpa,
        toldo: values.toldo,
        iluminacion: values.iluminacion,
        calefaccion: values.calefaccion,
        cubrePiso: values.cubrePiso,
        estado: values.estado,
        comentario: values.comentario?.trim() || undefined,
        technicalVisitId: values.technicalVisitId,
      };

      if (editingId) {
        await updateEvent.mutateAsync({
          id: editingId,
          ...eventData,
        });
        notifications.show({
          title: "Evento actualizado",
          message: "El evento ha sido actualizado exitosamente",
          color: "green",
        });
      } else {
        await createEvent.mutateAsync(eventData);
        notifications.show({
          title: "Evento creado",
          message: "El evento ha sido creado exitosamente",
          color: "green",
        });
      }
      handleCloseModal();
      await refetch();
    } catch (error) {
      console.error("Error al guardar evento:", error);
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Ocurrió un error al guardar el evento",
        color: "red",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este evento?")) {
      try {
        await deleteEvent.mutateAsync({ id });
        notifications.show({
          title: "Evento eliminado",
          message: "El evento ha sido eliminado exitosamente",
          color: "green",
        });
        await refetch();
      } catch (error) {
        notifications.show({
          title: "Error",
          message: "Ocurrió un error al eliminar el evento",
          color: "red",
        });
      }
    }
  };

  const handleStatusChange = async (eventId: number, newStatus: Estado) => {
    try {
      await updateEvent.mutateAsync({
        id: eventId,
        estado: newStatus,
      });
      notifications.show({
        title: "Estado actualizado",
        message: "El estado del evento ha sido actualizado",
        color: "green",
      });
      await refetch();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Ocurrió un error al actualizar el estado",
        color: "red",
      });
    }
  };

  const handleViewDetails = (event: any) => {
    setSelectedEvent(event);
    setDetailsOpened(true);
  };

  const getEstadoBadgeColor = (estado: Estado) => {
    switch (estado) {
      case Estado.PENDIENTE:
        return "yellow";
      case Estado.EN_PROCESO:
        return "blue";
      case Estado.COMPLETADO:
        return "green";
      case Estado.CANCELADO:
        return "red";
      default:
        return "gray";
    }
  };

  // Filtrado y ordenamiento
  const filteredAndSortedEvents = useMemo(() => {
    if (!events) return [];

    let filtered = [...events];

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.nombreCliente.toLowerCase().includes(query) ||
          event.direccion.toLowerCase().includes(query) ||
          event.contacto.toLowerCase().includes(query) ||
          event.descripcion.toLowerCase().includes(query)
      );
    }

    // Filtrar por estado
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((event) => event.estado === statusFilter);
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "startDate-desc":
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        case "startDate-asc":
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        case "cliente-asc":
          return a.nombreCliente.localeCompare(b.nombreCliente);
        case "cliente-desc":
          return b.nombreCliente.localeCompare(a.nombreCliente);
        case "monto-desc":
          return Number(b.montoTotal) - Number(a.montoTotal);
        case "monto-asc":
          return Number(a.montoTotal) - Number(b.montoTotal);
        default:
          return 0;
      }
    });

    return filtered;
  }, [events, searchQuery, statusFilter, sortBy]);

  if (status === "loading" || isLoading) {
    return (
      <MainLayout>
        <Center className="h-64">
          <Loader size="lg" />
        </Center>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Stack gap="md">
            {/* Header */}
            <Card shadow="sm" padding="lg" radius="md" className="bg-white">
              <Group justify="space-between" align="center">
                <div>
                  <Title order={1} className="text-gray-900">
                    Eventos
                  </Title>
                  <Text c="dimmed" size="sm">
                    Gestiona todos los eventos y sus detalles
                  </Text>
                </div>
                <Button
                  leftSection={<IconPlus size={20} />}
                  onClick={() => handleOpenModal()}
                  size="md"
                >
                  Agregar Evento
                </Button>
              </Group>
            </Card>

            {/* Filtros y Búsqueda */}
            <Card shadow="sm" padding="lg" radius="md" className="bg-white">
              <Grid>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    placeholder="Buscar por cliente, dirección, contacto..."
                    leftSection={<IconSearch size={16} />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.currentTarget.value)}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <Select
                    placeholder="Filtrar por estado"
                    clearable
                    value={statusFilter}
                    onChange={setStatusFilter}
                    data={[
                      { value: "all", label: "Todos los estados" },
                      { value: Estado.PENDIENTE, label: "Pendiente" },
                      { value: Estado.EN_PROCESO, label: "En Proceso" },
                      { value: Estado.COMPLETADO, label: "Completado" },
                      { value: Estado.CANCELADO, label: "Cancelado" },
                    ]}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <Select
                    placeholder="Ordenar por"
                    value={sortBy}
                    onChange={(value) => setSortBy(value || "startDate-desc")}
                    data={[
                      { value: "startDate-desc", label: "Fecha más reciente" },
                      { value: "startDate-asc", label: "Fecha más antigua" },
                      { value: "cliente-asc", label: "Cliente (A-Z)" },
                      { value: "cliente-desc", label: "Cliente (Z-A)" },
                      { value: "monto-desc", label: "Monto mayor" },
                      { value: "monto-asc", label: "Monto menor" },
                    ]}
                  />
                </Grid.Col>
              </Grid>
            </Card>

            {/* Events Table */}
            <Card shadow="sm" padding="lg" radius="md" className="bg-white">
              {filteredAndSortedEvents && filteredAndSortedEvents.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Cliente</Table.Th>
                        <Table.Th>Dirección</Table.Th>
                        <Table.Th>Fecha Inicio Evento</Table.Th>
                        <Table.Th>Fecha Inicio Montaje</Table.Th>
                        <Table.Th>Fecha Fin Montaje</Table.Th>
                        <Table.Th>Monto Total</Table.Th>
                        <Table.Th>Estado</Table.Th>
                        <Table.Th>Acciones</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filteredAndSortedEvents.map((event) => (
                        <Table.Tr key={event.id}>
                          <Table.Td>
                            <div>
                              <Text size="sm" fw={500}>
                                {event.nombreCliente}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {event.contacto}
                              </Text>
                            </div>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" lineClamp={1}>
                              {event.direccion}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Tooltip label={formatDateForTooltip(event.startDate)} position="top">
                              <Text size="sm" style={{ cursor: "help" }}>
                                {new Date(event.startDate).toLocaleDateString(
                                  "es-CL"
                                )}
                              </Text>
                            </Tooltip>
                          </Table.Td>
                          <Table.Td>
                            <Tooltip label={formatDateForTooltip(event.horaInicio)} position="top">
                              <Text size="sm" style={{ cursor: "help" }}>
                                {new Date(event.horaInicio).toLocaleDateString(
                                  "es-CL"
                                )}
                              </Text>
                            </Tooltip>
                          </Table.Td>
                          <Table.Td>
                            <Tooltip label={formatDateForTooltip(event.horaTermino)} position="top">
                              <Text size="sm" style={{ cursor: "help" }}>
                                {new Date(event.horaTermino).toLocaleDateString(
                                  "es-CL"
                                )}
                              </Text>
                            </Tooltip>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" fw={500}>
                              ${Number(event.montoTotal).toLocaleString("es-CL")}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Select
                              value={event.estado}
                              onChange={(value) =>
                                value && handleStatusChange(event.id, value as Estado)
                              }
                              data={[
                                { value: Estado.PENDIENTE, label: "Pendiente" },
                                { value: Estado.EN_PROCESO, label: "En Proceso" },
                                { value: Estado.COMPLETADO, label: "Completado" },
                                { value: Estado.CANCELADO, label: "Cancelado" },
                              ]}
                              size="xs"
                              styles={{
                                input: {
                                  fontWeight: 500,
                                  backgroundColor:
                                    event.estado === Estado.PENDIENTE
                                      ? "#fff9db"
                                      : event.estado === Estado.EN_PROCESO
                                      ? "#dbeafe"
                                      : event.estado === Estado.COMPLETADO
                                      ? "#d1fae5"
                                      : "#fee2e2",
                                  color:
                                    event.estado === Estado.PENDIENTE
                                      ? "#854d0e"
                                      : event.estado === Estado.EN_PROCESO
                                      ? "#1e40af"
                                      : event.estado === Estado.COMPLETADO
                                      ? "#065f46"
                                      : "#991b1b",
                                },
                              }}
                            />
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <ActionIcon
                                variant="light"
                                color="indigo"
                                onClick={() => handleViewDetails(event)}
                                size="lg"
                              >
                                <IconEye size={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="light"
                                color="blue"
                                onClick={() => handleOpenModal(event.id)}
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="light"
                                color="red"
                                onClick={() => handleDelete(event.id)}
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              ) : (
                <Center className="py-12">
                  <Stack align="center" gap="md">
                    <IconCalendarEvent
                      size={48}
                      className="text-gray-400"
                      stroke={1.5}
                    />
                    <div className="text-center">
                      <Text size="lg" fw={500} c="dimmed">
                        No hay eventos registrados
                      </Text>
                      <Text size="sm" c="dimmed">
                        Comienza agregando tu primer evento
                      </Text>
                    </div>
                    <Button
                      leftSection={<IconPlus size={20} />}
                      onClick={() => handleOpenModal()}
                    >
                      Agregar Primer Evento
                    </Button>
                  </Stack>
                </Center>
              )}
            </Card>
          </Stack>
        </div>
      </div>

      {/* Modal de Agregar/Editar Evento */}
      <Modal
        opened={opened}
        onClose={handleCloseModal}
        title={
          <Title order={3}>
            {editingId ? "Editar Evento" : "Agregar Nuevo Evento"}
          </Title>
        }
        size="xl"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            {/* Selector de Visita Técnica - Solo al crear nuevo evento */}
            {!editingId && completedVisits && completedVisits.length > 0 && (
              <Paper p="md" withBorder radius="md" className="bg-blue-50">
                <Stack gap="sm">
                  <Group>
                    <ThemeIcon size="md" radius="md" color="blue" variant="light">
                      <IconTool size={18} />
                    </ThemeIcon>
                    <div>
                      <Text fw={600} size="sm">
                        ¿Este evento viene de una visita técnica?
                      </Text>
                      <Text size="xs" c="dimmed">
                        Selecciona una visita realizada para rellenar automáticamente los datos del cliente
                      </Text>
                    </div>
                  </Group>
                  <Select
                    placeholder="Selecciona una visita técnica realizada"
                    clearable
                    searchable
                    value={selectedTechnicalVisit}
                    onChange={handleTechnicalVisitSelect}
                    data={
                      completedVisits.map((visit) => ({
                        value: visit.id.toString(),
                        label: `${visit.nombreCliente} - ${new Date(visit.fechaVisita).toLocaleDateString("es-CL")}`,
                      }))
                    }
                    leftSection={<IconCalendarEvent size={16} />}
                  />
                  {selectedTechnicalVisit && (
                    <Text size="xs" c="blue" fw={500}>
                      ✓ Datos del cliente rellenados automáticamente
                    </Text>
                  )}
                </Stack>
              </Paper>
            )}

            {/* Información del Cliente */}
            <div>
              <Text size="sm" fw={600} mb="xs" className="text-gray-700">
                Información del Cliente
              </Text>
              <Grid>
                <Grid.Col span={12}>
                  <TextInput
                    label="Nombre del Cliente"
                    placeholder="Juan Pérez"
                    required
                    leftSection={<IconUser size={16} />}
                    {...form.getInputProps("nombreCliente")}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label="Contacto"
                    placeholder="+56 9 1234 5678"
                    required
                    {...form.getInputProps("contacto")}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label="Dirección"
                    placeholder="Av. Principal 123"
                    required
                    leftSection={<IconMapPin size={16} />}
                    {...form.getInputProps("direccion")}
                  />
                </Grid.Col>
              </Grid>
            </div>

            {/* Detalles del Evento */}
            <div>
              <Text size="sm" fw={600} mb="xs" className="text-gray-700">
                Detalles del Evento
              </Text>
              <Grid>
                <Grid.Col span={12}>
                  <Textarea
                    label="Descripción"
                    placeholder="Describe el evento..."
                    required
                    minRows={3}
                    {...form.getInputProps("descripcion")}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <DateTimePicker
                    label="Inicio del Evento"
                    description="Fecha y hora en que comienza el evento/celebración"
                    placeholder="¿Cuándo empieza el evento?"
                    required
                    valueFormat="DD/MM/YYYY HH:mm"
                    {...form.getInputProps("startDate")}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <DateTimePicker
                    label="Fin del Evento"
                    description="Fecha y hora en que termina el evento/celebración"
                    placeholder="¿Cuándo termina el evento?"
                    required
                    valueFormat="DD/MM/YYYY HH:mm"
                    {...form.getInputProps("endDate")}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <DateTimePicker
                    label="Fecha y Hora de Montaje"
                    description="Cuándo se armará/instalará la carpa"
                    placeholder="¿Cuándo montar la carpa?"
                    required
                    valueFormat="DD/MM/YYYY HH:mm"
                    {...form.getInputProps("horaInicio")}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <DateTimePicker
                    label="Fecha y Hora de Desmontaje"
                    description="Cuándo se desarmará/retirará la carpa"
                    placeholder="¿Cuándo desmontar la carpa?"
                    required
                    valueFormat="DD/MM/YYYY HH:mm"
                    {...form.getInputProps("horaTermino")}
                  />
                </Grid.Col>
              </Grid>
            </div>

            {/* Características */}
            <div>
              <Text size="sm" fw={600} mb="xs" className="text-gray-700">
                Características del Evento
              </Text>
              <Grid>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <NumberInput
                    label="Metros Cuadrados"
                    placeholder="100"
                    required
                    min={1}
                    {...form.getInputProps("metros2")}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <NumberInput
                    label="Monto Total"
                    placeholder="0"
                    required
                    min={0}
                    prefix="$"
                    thousandSeparator="."
                    decimalSeparator=","
                    {...form.getInputProps("montoTotal")}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <NumberInput
                    label="Anticipo"
                    placeholder="0"
                    required
                    min={0}
                    prefix="$"
                    thousandSeparator="."
                    decimalSeparator=","
                    {...form.getInputProps("anticipo")}
                  />
                </Grid.Col>
              </Grid>
            </div>

            {/* Servicios Incluidos */}
            <div>
              <Text size="sm" fw={600} mb="xs" className="text-gray-700">
                Servicios Incluidos
              </Text>
              <Grid>
                <Grid.Col span={{ base: 6, sm: 4 }}>
                  <Switch
                    label="Carpa"
                    {...form.getInputProps("carpa", { type: "checkbox" })}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 4 }}>
                  <Switch
                    label="Toldo"
                    {...form.getInputProps("toldo", { type: "checkbox" })}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 4 }}>
                  <Switch
                    label="Iluminación"
                    {...form.getInputProps("iluminacion", { type: "checkbox" })}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 4 }}>
                  <Switch
                    label="Calefacción"
                    {...form.getInputProps("calefaccion", { type: "checkbox" })}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 4 }}>
                  <Switch
                    label="Cubre Piso"
                    {...form.getInputProps("cubrePiso", { type: "checkbox" })}
                  />
                </Grid.Col>
              </Grid>
            </div>

            {/* Estado y Comentarios */}
            <div>
              <Text size="sm" fw={600} mb="xs" className="text-gray-700">
                Estado y Observaciones
              </Text>
              <Grid>
                <Grid.Col span={12}>
                  <Select
                    label="Estado"
                    placeholder="Selecciona un estado"
                    required
                    data={[
                      { value: Estado.PENDIENTE, label: "Pendiente" },
                      { value: Estado.EN_PROCESO, label: "En Proceso" },
                      { value: Estado.COMPLETADO, label: "Completado" },
                      { value: Estado.CANCELADO, label: "Cancelado" },
                    ]}
                    {...form.getInputProps("estado")}
                  />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Textarea
                    label="Comentarios"
                    placeholder="Comentarios adicionales..."
                    minRows={2}
                    {...form.getInputProps("comentario")}
                  />
                </Grid.Col>
              </Grid>
            </div>

            {/* Botones */}
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={createEvent.isPending || updateEvent.isPending}
              >
                {editingId ? "Actualizar Evento" : "Crear Evento"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal de Detalles del Evento */}
      <Modal
        opened={detailsOpened}
        onClose={() => setDetailsOpened(false)}
        title={
          <Group>
            <ThemeIcon size="lg" radius="md" color="indigo" variant="light">
              <IconCalendarEvent size={20} />
            </ThemeIcon>
            <Title order={3}>Detalles del Evento</Title>
          </Group>
        }
        size="xl"
      >
        {selectedEvent && (
          <Stack gap="lg">
              {/* Información del Cliente */}
              <Paper p="md" withBorder radius="md" className="bg-gray-50">
                <Group mb="md">
                  <ThemeIcon size="md" radius="md" color="blue" variant="light">
                    <IconUser size={18} />
                  </ThemeIcon>
                  <Text fw={600} size="lg">
                    Información del Cliente
                  </Text>
                </Group>
                <Grid>
                  <Grid.Col span={12}>
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Cliente
                      </Text>
                      <Text size="md" fw={500}>
                        {selectedEvent.nombreCliente}
                      </Text>
                    </div>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Contacto
                      </Text>
                      <Group gap="xs">
                        <IconPhone size={16} className="text-gray-500" />
                        <Text size="md">{selectedEvent.contacto}</Text>
                      </Group>
                    </div>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Dirección
                      </Text>
                      <Group gap="xs">
                        <IconMapPin size={16} className="text-gray-500" />
                        <Text size="md">{selectedEvent.direccion}</Text>
                      </Group>
                    </div>
                  </Grid.Col>
                </Grid>
              </Paper>

              {/* Fechas y Horarios */}
              <Paper p="md" withBorder radius="md" className="bg-gray-50">
                <Group mb="md">
                  <ThemeIcon size="md" radius="md" color="grape" variant="light">
                    <IconClock size={18} />
                  </ThemeIcon>
                  <Text fw={600} size="lg">
                    Fechas y Horarios
                  </Text>
                </Group>
                
                <Divider my="xs" label="🎉 Fechas del Evento" labelPosition="left" />
                <Grid mb="md">
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Inicio del Evento
                      </Text>
                      <Text size="xs" c="dimmed" mb={4}>
                        Cuando comienza la celebración
                      </Text>
                      <Text size="md" fw={500}>
                        {new Date(selectedEvent.startDate).toLocaleDateString(
                          "es-CL",
                          { weekday: "long", year: "numeric", month: "long", day: "numeric" }
                        )}
                      </Text>
                      <Text size="md">
                        {new Date(selectedEvent.startDate).toLocaleTimeString(
                          "es-CL",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </Text>
                    </div>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Fin del Evento
                      </Text>
                      <Text size="xs" c="dimmed" mb={4}>
                        Cuando termina la celebración
                      </Text>
                      <Text size="md" fw={500}>
                        {new Date(selectedEvent.endDate).toLocaleDateString(
                          "es-CL",
                          { weekday: "long", year: "numeric", month: "long", day: "numeric" }
                        )}
                      </Text>
                      <Text size="md">
                        {new Date(selectedEvent.endDate).toLocaleTimeString(
                          "es-CL",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </Text>
                    </div>
                  </Grid.Col>
                </Grid>
                
                <Divider my="xs" label="🏗️ Montaje y Desmontaje" labelPosition="left" />
                <Grid>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Fecha y Hora de Montaje
                      </Text>
                      <Text size="xs" c="dimmed" mb={4}>
                        Cuando armar/instalar la carpa
                      </Text>
                      <Text size="md" fw={500}>
                        {new Date(selectedEvent.horaInicio).toLocaleDateString(
                          "es-CL",
                          { weekday: "long", year: "numeric", month: "long", day: "numeric" }
                        )}
                      </Text>
                      <Text size="md">
                        {new Date(selectedEvent.horaInicio).toLocaleTimeString(
                          "es-CL",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </Text>
                    </div>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Fecha y Hora de Desmontaje
                      </Text>
                      <Text size="xs" c="dimmed" mb={4}>
                        Cuando desarmar/retirar la carpa
                      </Text>
                      <Text size="md" fw={500}>
                        {new Date(selectedEvent.horaTermino).toLocaleDateString(
                          "es-CL",
                          { weekday: "long", year: "numeric", month: "long", day: "numeric" }
                        )}
                      </Text>
                      <Text size="md">
                        {new Date(selectedEvent.horaTermino).toLocaleTimeString(
                          "es-CL",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </Text>
                    </div>
                  </Grid.Col>
                </Grid>
              </Paper>

              {/* Información Financiera */}
              <Paper p="md" withBorder radius="md" className="bg-gray-50">
                <Group mb="md">
                  <ThemeIcon size="md" radius="md" color="green" variant="light">
                    <IconCurrencyDollar size={18} />
                  </ThemeIcon>
                  <Text fw={600} size="lg">
                    Información Financiera
                  </Text>
                </Group>
                <Grid>
                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Metros Cuadrados
                      </Text>
                      <Group gap="xs">
                        <IconRuler size={16} className="text-gray-500" />
                        <Text size="xl" fw={700} c="indigo">
                          {selectedEvent.metros2} m²
                        </Text>
                      </Group>
                    </div>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Monto Total
                      </Text>
                      <Text size="xl" fw={700} c="green">
                        ${Number(selectedEvent.montoTotal).toLocaleString("es-CL")}
                      </Text>
                    </div>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Anticipo
                      </Text>
                      <Text size="xl" fw={700} c="orange">
                        ${Number(selectedEvent.anticipo).toLocaleString("es-CL")}
                      </Text>
                    </div>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="xs">
                        Saldo Pendiente
                      </Text>
                      <Text size="xl" fw={700} c="red">
                        $
                        {(
                          Number(selectedEvent.montoTotal) -
                          Number(selectedEvent.anticipo)
                        ).toLocaleString("es-CL")}
                      </Text>
                    </div>
                  </Grid.Col>
                </Grid>
              </Paper>

              {/* Servicios Incluidos */}
              <Paper p="md" withBorder radius="md" className="bg-gray-50">
                <Text fw={600} size="lg" mb="md">
                  Servicios Incluidos
                </Text>
                <Grid>
                  <Grid.Col span={{ base: 6, sm: 4 }}>
                    <Group gap="xs">
                      {selectedEvent.carpa ? (
                        <ThemeIcon size="sm" color="green" variant="light">
                          <IconCheck size={14} />
                        </ThemeIcon>
                      ) : (
                        <ThemeIcon size="sm" color="gray" variant="light">
                          <IconX size={14} />
                        </ThemeIcon>
                      )}
                      <Text size="sm" c={selectedEvent.carpa ? "green" : "dimmed"}>
                        Carpa
                      </Text>
                    </Group>
                  </Grid.Col>
                  <Grid.Col span={{ base: 6, sm: 4 }}>
                    <Group gap="xs">
                      {selectedEvent.toldo ? (
                        <ThemeIcon size="sm" color="green" variant="light">
                          <IconCheck size={14} />
                        </ThemeIcon>
                      ) : (
                        <ThemeIcon size="sm" color="gray" variant="light">
                          <IconX size={14} />
                        </ThemeIcon>
                      )}
                      <Text size="sm" c={selectedEvent.toldo ? "green" : "dimmed"}>
                        Toldo
                      </Text>
                    </Group>
                  </Grid.Col>
                  <Grid.Col span={{ base: 6, sm: 4 }}>
                    <Group gap="xs">
                      {selectedEvent.iluminacion ? (
                        <ThemeIcon size="sm" color="green" variant="light">
                          <IconCheck size={14} />
                        </ThemeIcon>
                      ) : (
                        <ThemeIcon size="sm" color="gray" variant="light">
                          <IconX size={14} />
                        </ThemeIcon>
                      )}
                      <Text
                        size="sm"
                        c={selectedEvent.iluminacion ? "green" : "dimmed"}
                      >
                        Iluminación
                      </Text>
                    </Group>
                  </Grid.Col>
                  <Grid.Col span={{ base: 6, sm: 4 }}>
                    <Group gap="xs">
                      {selectedEvent.calefaccion ? (
                        <ThemeIcon size="sm" color="green" variant="light">
                          <IconCheck size={14} />
                        </ThemeIcon>
                      ) : (
                        <ThemeIcon size="sm" color="gray" variant="light">
                          <IconX size={14} />
                        </ThemeIcon>
                      )}
                      <Text
                        size="sm"
                        c={selectedEvent.calefaccion ? "green" : "dimmed"}
                      >
                        Calefacción
                      </Text>
                    </Group>
                  </Grid.Col>
                  <Grid.Col span={{ base: 6, sm: 4 }}>
                    <Group gap="xs">
                      {selectedEvent.cubrePiso ? (
                        <ThemeIcon size="sm" color="green" variant="light">
                          <IconCheck size={14} />
                        </ThemeIcon>
                      ) : (
                        <ThemeIcon size="sm" color="gray" variant="light">
                          <IconX size={14} />
                        </ThemeIcon>
                      )}
                      <Text size="sm" c={selectedEvent.cubrePiso ? "green" : "dimmed"}>
                        Cubre Piso
                      </Text>
                    </Group>
                  </Grid.Col>
                </Grid>
              </Paper>

              {/* Descripción */}
              <Paper p="md" withBorder radius="md" className="bg-gray-50">
                <Group mb="md">
                  <ThemeIcon size="md" radius="md" color="cyan" variant="light">
                    <IconNotes size={18} />
                  </ThemeIcon>
                  <Text fw={600} size="lg">
                    Descripción del Evento
                  </Text>
                </Group>
                <Text size="sm">{selectedEvent.descripcion}</Text>
              </Paper>

              {/* Comentarios */}
              {selectedEvent.comentario && (
                <Paper p="md" withBorder radius="md" className="bg-gray-50">
                  <Text fw={600} size="lg" mb="xs">
                    Comentarios Adicionales
                  </Text>
                  <Text size="sm" c="dimmed">
                    {selectedEvent.comentario}
                  </Text>
                </Paper>
              )}

              {/* Estado */}
              <Paper p="md" withBorder radius="md" className="bg-gray-50">
                <Text fw={600} size="lg" mb="xs">
                  Estado Actual
                </Text>
                <Badge
                  size="xl"
                  color={getEstadoBadgeColor(selectedEvent.estado)}
                  variant="filled"
                >
                  {selectedEvent.estado.replace("_", " ")}
                </Badge>
              </Paper>

              {/* Bocetos */}
              <Paper p="md" withBorder radius="md" className="bg-gray-50">
                <Group mb="md" justify="space-between">
                  <Group>
                    <ThemeIcon size="md" radius="md" color="violet" variant="light">
                      <IconPencil size={18} />
                    </ThemeIcon>
                    <Text fw={600} size="lg">
                      Bocetos de Carpa
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconEdit size={14} />}
                      onClick={() => setAssignSketchModalOpen(true)}
                    >
                      Asignar Boceto
                    </Button>
                    <Button
                      size="xs"
                      leftSection={<IconPlus size={14} />}
                      component="a"
                      href={`/sketches?eventId=${selectedEvent.id}`}
                    >
                      Crear Boceto
                    </Button>
                  </Group>
                </Group>
                {eventSketches && eventSketches.length > 0 ? (
                  <Stack gap="xs">
                    {eventSketches.map((sketch: any) => (
                      <Card key={sketch.id} padding="sm" withBorder>
                        <Group justify="space-between" align="flex-start">
                          <div style={{ flex: 1 }}>
                            <Text fw={500} size="sm">
                              {sketch.name}
                            </Text>
                            {sketch.description && (
                              <Text size="xs" c="dimmed">
                                {sketch.description}
                              </Text>
                            )}
                            <Text size="xs" c="dimmed">
                              Creado: {new Date(sketch.createdAt).toLocaleDateString("es-CL")}
                            </Text>
                          </div>
                          <Group gap="xs">
                            <Button
                              size="xs"
                              variant="light"
                              component="a"
                              href={`/sketches?sketchId=${sketch.id}`}
                            >
                              Ver/Editar
                            </Button>
                            <Button
                              size="xs"
                              variant="light"
                              color="red"
                              onClick={() => {
                                if (confirm(`¿Estás seguro de desasignar el boceto "${sketch.name}" de este evento?`)) {
                                  unassignSketchMutation.mutate({
                                    sketchId: sketch.id,
                                    eventId: null,
                                  });
                                }
                              }}
                              loading={unassignSketchMutation.isPending}
                            >
                              Desasignar
                            </Button>
                          </Group>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed" ta="center" py="md">
                    No hay bocetos para este evento. Crea uno haciendo clic en el botón de arriba.
                  </Text>
                )}
              </Paper>

              {/* Botones de Acción */}
              <Group justify="flex-end" mt="md">
                <Button
                  variant="light"
                  onClick={() => {
                    setDetailsOpened(false);
                    handleOpenModal(selectedEvent.id);
                  }}
                  leftSection={<IconEdit size={16} />}
                >
                  Editar Evento
                </Button>
                <Button variant="subtle" onClick={() => setDetailsOpened(false)}>
                  Cerrar
                </Button>
              </Group>
            </Stack>
        )}
      </Modal>

      {/* Modal para asignar bocetos */}
      <Modal
        opened={assignSketchModalOpen}
        onClose={() => setAssignSketchModalOpen(false)}
        title="Asignar Boceto al Evento"
        size="md"
      >
        {unassignedSketches && unassignedSketches.length > 0 ? (
          <Stack>
            <Text size="sm" c="dimmed" mb="xs">
              Solo se muestran bocetos que no están asignados a ningún evento:
            </Text>
            {unassignedSketches.map((sketch: any) => (
              <Card key={sketch.id} shadow="sm" padding="sm" withBorder>
                <Group justify="space-between" align="flex-start">
                  <div style={{ flex: 1 }}>
                    <Text fw={500}>{sketch.name}</Text>
                    {sketch.description && (
                      <Text size="sm" c="dimmed">
                        {sketch.description}
                      </Text>
                    )}
                    <Text size="xs" c="dimmed">
                      Creado: {new Date(sketch.createdAt).toLocaleDateString("es-CL")}
                    </Text>
                  </div>
                  <Button
                    size="xs"
                    onClick={() => {
                      if (selectedEvent) {
                        assignSketchMutation.mutate({
                          sketchId: sketch.id,
                          eventId: selectedEvent.id,
                        });
                      }
                    }}
                    loading={assignSketchMutation.isPending}
                  >
                    Asignar a este Evento
                  </Button>
                </Group>
              </Card>
            ))}
          </Stack>
        ) : (
          <Center p="xl">
            <Stack align="center" gap="md">
              <Text c="dimmed" ta="center">
                No hay bocetos disponibles. Todos los bocetos ya están asignados a eventos.
              </Text>
              <Button
                size="sm"
                component="a"
                href="/sketches"
              >
                Crear Nuevo Boceto
              </Button>
            </Stack>
          </Center>
        )}
      </Modal>
    </MainLayout>
  );
}

