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
  Textarea,
  Select,
  Grid,
  ActionIcon,
  Loader,
  Center,
  Paper,
  ThemeIcon,
  ScrollArea,
  Divider,
  Box,
} from "@mantine/core";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconTool,
  IconMapPin,
  IconUser,
  IconEye,
  IconSearch,
  IconCalendar,
  IconClock,
  IconPhone,
  IconNotes,
  IconUserCheck,
} from "@tabler/icons-react";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { api } from "~/trpc/react";
import { TechnicalVisitStatus } from "@prisma/client";

interface TechnicalVisitFormValues {
  nombreCliente: string;
  contacto: string;
  direccion: string;
  descripcion: string;
  fechaVisita: Date | null;
  horaVisita: Date | null;
  estado: TechnicalVisitStatus;
  assignedTo?: string;
}

export default function TechnicalVisitsPage() {
  const { data: session, status } = useSession();
  const [opened, setOpened] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detailsOpened, setDetailsOpened] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  
  // Estados para búsqueda y filtrado
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("fechaVisita-asc");

  const { data: visits, isLoading, refetch } = api.technicalVisit.getAll.useQuery();
  const { data: users } = api.technicalVisit.getUsers.useQuery();
  const createVisit = api.technicalVisit.create.useMutation();
  const updateVisit = api.technicalVisit.update.useMutation();
  const deleteVisit = api.technicalVisit.delete.useMutation();

  const form = useForm<TechnicalVisitFormValues>({
    initialValues: {
      nombreCliente: "",
      contacto: "",
      direccion: "",
      descripcion: "",
      fechaVisita: null,
      horaVisita: null,
      estado: TechnicalVisitStatus.PROGRAMADA,
      assignedTo: "",
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
      fechaVisita: (value) => (value ? null : "La fecha de visita es requerida"),
      horaVisita: (value) => (value ? null : "La hora de visita es requerida"),
    },
  });

  const handleOpenModal = (visitId?: number) => {
    if (visitId) {
      const visit = visits?.find((v) => v.id === visitId);
      if (visit) {
        setEditingId(visitId);
        form.setValues({
          nombreCliente: visit.nombreCliente,
          contacto: visit.contacto,
          direccion: visit.direccion,
          descripcion: visit.descripcion,
          fechaVisita: new Date(visit.fechaVisita),
          horaVisita: new Date(visit.horaVisita),
          estado: visit.estado,
          assignedTo: visit.assignedTo || "",
        });
      }
    } else {
      setEditingId(null);
      form.reset();
    }
    setOpened(true);
  };

  const handleCloseModal = () => {
    setOpened(false);
    setEditingId(null);
    form.reset();
  };

  const handleSubmit = async (values: TechnicalVisitFormValues) => {
    try {
      const visitData = {
        nombreCliente: values.nombreCliente,
        contacto: values.contacto,
        direccion: values.direccion,
        descripcion: values.descripcion,
        fechaVisita: values.fechaVisita!,
        horaVisita: values.horaVisita!,
        estado: values.estado,
        assignedTo: values.assignedTo || undefined,
      };

      if (editingId) {
        await updateVisit.mutateAsync({
          id: editingId,
          ...visitData,
        });
        notifications.show({
          title: "Visita actualizada",
          message: "La visita técnica ha sido actualizada exitosamente",
          color: "green",
        });
      } else {
        await createVisit.mutateAsync(visitData);
        notifications.show({
          title: "Visita creada",
          message: "La visita técnica ha sido creada exitosamente",
          color: "green",
        });
      }
      handleCloseModal();
      await refetch();
    } catch (error) {
      console.error("Error al guardar visita:", error);
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Ocurrió un error al guardar la visita",
        color: "red",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta visita técnica?")) {
      try {
        await deleteVisit.mutateAsync({ id });
        notifications.show({
          title: "Visita eliminada",
          message: "La visita técnica ha sido eliminada exitosamente",
          color: "green",
        });
        await refetch();
      } catch (error) {
        notifications.show({
          title: "Error",
          message: "Ocurrió un error al eliminar la visita",
          color: "red",
        });
      }
    }
  };

  const handleStatusChange = async (visitId: number, newStatus: TechnicalVisitStatus) => {
    try {
      await updateVisit.mutateAsync({
        id: visitId,
        estado: newStatus,
      });
      notifications.show({
        title: "Estado actualizado",
        message: "El estado de la visita ha sido actualizado",
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

  const handleViewDetails = (visit: any) => {
    setSelectedVisit(visit);
    setDetailsOpened(true);
  };

  const getEstadoBadgeColor = (estado: TechnicalVisitStatus) => {
    switch (estado) {
      case TechnicalVisitStatus.PROGRAMADA:
        return "blue";
      case TechnicalVisitStatus.REALIZADA:
        return "green";
      case TechnicalVisitStatus.REPROGRAMADA:
        return "orange";
      case TechnicalVisitStatus.CANCELADA:
        return "red";
      default:
        return "gray";
    }
  };

  // Filtrado y ordenamiento
  const filteredAndSortedVisits = useMemo(() => {
    if (!visits) return [];

    let filtered = [...visits];

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (visit) =>
          visit.nombreCliente.toLowerCase().includes(query) ||
          visit.direccion.toLowerCase().includes(query) ||
          visit.contacto.toLowerCase().includes(query) ||
          visit.descripcion.toLowerCase().includes(query)
      );
    }

    // Filtrar por estado
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((visit) => visit.estado === statusFilter);
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "fechaVisita-asc":
          return new Date(a.fechaVisita).getTime() - new Date(b.fechaVisita).getTime();
        case "fechaVisita-desc":
          return new Date(b.fechaVisita).getTime() - new Date(a.fechaVisita).getTime();
        case "cliente-asc":
          return a.nombreCliente.localeCompare(b.nombreCliente);
        case "cliente-desc":
          return b.nombreCliente.localeCompare(a.nombreCliente);
        default:
          return 0;
      }
    });

    return filtered;
  }, [visits, searchQuery, statusFilter, sortBy]);

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
                    Visitas Técnicas
                  </Title>
                  <Text c="dimmed" size="sm">
                    Gestiona las visitas presenciales para medición y asesoría
                  </Text>
                </div>
                <Button
                  leftSection={<IconPlus size={20} />}
                  onClick={() => handleOpenModal()}
                  size="md"
                >
                  Agregar Visita
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
                      { value: TechnicalVisitStatus.PROGRAMADA, label: "Programada" },
                      { value: TechnicalVisitStatus.REALIZADA, label: "Realizada" },
                      { value: TechnicalVisitStatus.REPROGRAMADA, label: "Reprogramada" },
                      { value: TechnicalVisitStatus.CANCELADA, label: "Cancelada" },
                    ]}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <Select
                    placeholder="Ordenar por"
                    value={sortBy}
                    onChange={(value) => setSortBy(value || "fechaVisita-asc")}
                    data={[
                      { value: "fechaVisita-asc", label: "Fecha más próxima" },
                      { value: "fechaVisita-desc", label: "Fecha más lejana" },
                      { value: "cliente-asc", label: "Cliente (A-Z)" },
                      { value: "cliente-desc", label: "Cliente (Z-A)" },
                    ]}
                  />
                </Grid.Col>
              </Grid>
            </Card>

            {/* Visits Table */}
            <Card shadow="sm" padding="lg" radius="md" className="bg-white">
              {filteredAndSortedVisits && filteredAndSortedVisits.length > 0 ? (
                <>
                  {/* Desktop Table - Hidden on mobile */}
                  <Box visibleFrom="md">
                    <div className="overflow-x-auto">
                      <Table striped highlightOnHover withTableBorder>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Cliente</Table.Th>
                            <Table.Th>Dirección</Table.Th>
                            <Table.Th>Fecha Visita</Table.Th>
                            <Table.Th>Hora</Table.Th>
                            <Table.Th>Asignado a</Table.Th>
                            <Table.Th>Estado</Table.Th>
                            <Table.Th>Acciones</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {filteredAndSortedVisits.map((visit) => (
                            <Table.Tr key={visit.id}>
                              <Table.Td>
                                <div>
                                  <Text size="sm" fw={500}>
                                    {visit.nombreCliente}
                                  </Text>
                                  <Text size="xs" c="dimmed">
                                    {visit.contacto}
                                  </Text>
                                </div>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" lineClamp={1}>
                                  {visit.direccion}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm">
                                  {new Date(visit.fechaVisita).toLocaleDateString("es-CL")}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm">
                                  {new Date(visit.horaVisita).toLocaleTimeString("es-CL", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" c={visit.assignedUser ? "blue" : "dimmed"}>
                                  {visit.assignedUser?.name || "Sin asignar"}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Select
                                  value={visit.estado}
                                  onChange={(value) =>
                                    value && handleStatusChange(visit.id, value as TechnicalVisitStatus)
                                  }
                                  data={[
                                    { value: TechnicalVisitStatus.PROGRAMADA, label: "Programada" },
                                    { value: TechnicalVisitStatus.REALIZADA, label: "Realizada" },
                                    { value: TechnicalVisitStatus.REPROGRAMADA, label: "Reprogramada" },
                                    { value: TechnicalVisitStatus.CANCELADA, label: "Cancelada" },
                                  ]}
                                  size="xs"
                                  styles={{
                                    input: {
                                      fontWeight: 500,
                                      backgroundColor:
                                        visit.estado === TechnicalVisitStatus.PROGRAMADA
                                          ? "#dbeafe"
                                          : visit.estado === TechnicalVisitStatus.REALIZADA
                                          ? "#d1fae5"
                                          : visit.estado === TechnicalVisitStatus.REPROGRAMADA
                                          ? "#fed7aa"
                                          : "#fee2e2",
                                      color:
                                        visit.estado === TechnicalVisitStatus.PROGRAMADA
                                          ? "#1e40af"
                                          : visit.estado === TechnicalVisitStatus.REALIZADA
                                          ? "#065f46"
                                          : visit.estado === TechnicalVisitStatus.REPROGRAMADA
                                          ? "#9a3412"
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
                                    onClick={() => handleViewDetails(visit)}
                                    size="lg"
                                  >
                                    <IconEye size={16} />
                                  </ActionIcon>
                                  <ActionIcon
                                    variant="light"
                                    color="blue"
                                    onClick={() => handleOpenModal(visit.id)}
                                  >
                                    <IconEdit size={16} />
                                  </ActionIcon>
                                  <ActionIcon
                                    variant="light"
                                    color="red"
                                    onClick={() => handleDelete(visit.id)}
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
                  </Box>

                  {/* Mobile Cards - Hidden on desktop */}
                  <Box hiddenFrom="md">
                    <Stack gap="md">
                      {filteredAndSortedVisits.map((visit) => (
                        <Paper key={visit.id} p="md" withBorder radius="md" className="bg-gray-50">
                          <Stack gap="xs">
                            <Group justify="space-between" align="flex-start">
                              <div style={{ flex: 1 }}>
                                <Text size="sm" fw={600} mb={4}>
                                  {visit.nombreCliente}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  {visit.contacto}
                                </Text>
                              </div>
                              <Badge
                                color={
                                  visit.estado === TechnicalVisitStatus.PROGRAMADA
                                    ? "blue"
                                    : visit.estado === TechnicalVisitStatus.REALIZADA
                                    ? "green"
                                    : visit.estado === TechnicalVisitStatus.REPROGRAMADA
                                    ? "orange"
                                    : "red"
                                }
                                variant="light"
                              >
                                {visit.estado === TechnicalVisitStatus.PROGRAMADA
                                  ? "Programada"
                                  : visit.estado === TechnicalVisitStatus.REALIZADA
                                  ? "Realizada"
                                  : visit.estado === TechnicalVisitStatus.REPROGRAMADA
                                  ? "Reprogramada"
                                  : "Cancelada"}
                              </Badge>
                            </Group>

                            <Divider />

                            <Grid gutter="xs">
                              <Grid.Col span={12}>
                                <Group gap={4}>
                                  <IconMapPin size={14} className="text-gray-500" />
                                  <Text size="xs" c="dimmed">
                                    {visit.direccion}
                                  </Text>
                                </Group>
                              </Grid.Col>

                              <Grid.Col span={6}>
                                <Text size="xs" c="dimmed">
                                  Fecha Visita
                                </Text>
                                <Text size="xs" fw={500}>
                                  {new Date(visit.fechaVisita).toLocaleDateString("es-CL")}
                                </Text>
                              </Grid.Col>

                              <Grid.Col span={6}>
                                <Text size="xs" c="dimmed">
                                  Hora
                                </Text>
                                <Text size="xs" fw={500}>
                                  {new Date(visit.horaVisita).toLocaleTimeString("es-CL", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </Text>
                              </Grid.Col>

                              <Grid.Col span={12}>
                                <Text size="xs" c="dimmed">
                                  Asignado a
                                </Text>
                                <Text size="xs" fw={500} c={visit.assignedUser ? "blue" : "dimmed"}>
                                  {visit.assignedUser?.name || "Sin asignar"}
                                </Text>
                              </Grid.Col>
                            </Grid>

                            <Divider />

                            <Group justify="space-between" wrap="nowrap">
                              <Select
                                value={visit.estado}
                                onChange={(value) =>
                                  value && handleStatusChange(visit.id, value as TechnicalVisitStatus)
                                }
                                data={[
                                  { value: TechnicalVisitStatus.PROGRAMADA, label: "Programada" },
                                  { value: TechnicalVisitStatus.REALIZADA, label: "Realizada" },
                                  { value: TechnicalVisitStatus.REPROGRAMADA, label: "Reprogramada" },
                                  { value: TechnicalVisitStatus.CANCELADA, label: "Cancelada" },
                                ]}
                                size="xs"
                                style={{ flex: 1 }}
                                styles={{
                                  input: {
                                    fontWeight: 500,
                                    backgroundColor:
                                      visit.estado === TechnicalVisitStatus.PROGRAMADA
                                        ? "#dbeafe"
                                        : visit.estado === TechnicalVisitStatus.REALIZADA
                                        ? "#d1fae5"
                                        : visit.estado === TechnicalVisitStatus.REPROGRAMADA
                                        ? "#fed7aa"
                                        : "#fee2e2",
                                    color:
                                      visit.estado === TechnicalVisitStatus.PROGRAMADA
                                        ? "#1e40af"
                                        : visit.estado === TechnicalVisitStatus.REALIZADA
                                        ? "#065f46"
                                        : visit.estado === TechnicalVisitStatus.REPROGRAMADA
                                        ? "#9a3412"
                                        : "#991b1b",
                                  },
                                }}
                              />
                              <Group gap={4}>
                                <ActionIcon
                                  variant="light"
                                  color="indigo"
                                  onClick={() => handleViewDetails(visit)}
                                  size="sm"
                                >
                                  <IconEye size={14} />
                                </ActionIcon>
                                <ActionIcon
                                  variant="light"
                                  color="blue"
                                  onClick={() => handleOpenModal(visit.id)}
                                  size="sm"
                                >
                                  <IconEdit size={14} />
                                </ActionIcon>
                                <ActionIcon
                                  variant="light"
                                  color="red"
                                  onClick={() => handleDelete(visit.id)}
                                  size="sm"
                                >
                                  <IconTrash size={14} />
                                </ActionIcon>
                              </Group>
                            </Group>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                </>
              ) : (
                <Center className="py-12">
                  <Stack align="center" gap="md">
                    <IconTool
                      size={48}
                      className="text-gray-400"
                      stroke={1.5}
                    />
                    <div className="text-center">
                      <Text size="lg" fw={500} c="dimmed">
                        No hay visitas técnicas registradas
                      </Text>
                      <Text size="sm" c="dimmed">
                        Comienza agregando tu primera visita técnica
                      </Text>
                    </div>
                    <Button
                      leftSection={<IconPlus size={20} />}
                      onClick={() => handleOpenModal()}
                    >
                      Agregar Primera Visita
                    </Button>
                  </Stack>
                </Center>
              )}
            </Card>
          </Stack>
        </div>
      </div>

      {/* Modal de Agregar/Editar Visita */}
      <Modal
        opened={opened}
        onClose={handleCloseModal}
        title={
          <Title order={3}>
            {editingId ? "Editar Visita Técnica" : "Agregar Nueva Visita Técnica"}
          </Title>
        }
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
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
                    leftSection={<IconPhone size={16} />}
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

            {/* Detalles de la Visita */}
            <div>
              <Text size="sm" fw={600} mb="xs" className="text-gray-700">
                Detalles de la Visita
              </Text>
              <Grid>
                <Grid.Col span={12}>
                  <Textarea
                    label="Descripción / Motivo"
                    placeholder="Medición de espacio, asesoría sobre tipo de carpa..."
                    required
                    minRows={3}
                    {...form.getInputProps("descripcion")}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <DateTimePicker
                    label="Fecha de Visita"
                    placeholder="Selecciona fecha"
                    required
                    valueFormat="DD/MM/YYYY"
                    {...form.getInputProps("fechaVisita")}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <DateTimePicker
                    label="Hora de Visita"
                    placeholder="Selecciona hora"
                    required
                    valueFormat="HH:mm"
                    {...form.getInputProps("horaVisita")}
                  />
                </Grid.Col>
              </Grid>
            </div>

            {/* Asignación y Estado */}
            <div>
              <Text size="sm" fw={600} mb="xs" className="text-gray-700">
                Asignación y Estado
              </Text>
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Select
                    label="Asignar a"
                    placeholder="Selecciona un técnico"
                    clearable
                    searchable
                    leftSection={<IconUserCheck size={16} />}
                    data={
                      users?.map((user) => ({
                        value: user.id,
                        label: user.name || user.email || "Sin nombre",
                      })) || []
                    }
                    {...form.getInputProps("assignedTo")}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Select
                    label="Estado"
                    placeholder="Selecciona un estado"
                    required
                    data={[
                      { value: TechnicalVisitStatus.PROGRAMADA, label: "Programada" },
                      { value: TechnicalVisitStatus.REALIZADA, label: "Realizada" },
                      { value: TechnicalVisitStatus.REPROGRAMADA, label: "Reprogramada" },
                      { value: TechnicalVisitStatus.CANCELADA, label: "Cancelada" },
                    ]}
                    {...form.getInputProps("estado")}
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
                loading={createVisit.isPending || updateVisit.isPending}
              >
                {editingId ? "Actualizar Visita" : "Crear Visita"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal de Detalles de la Visita */}
      <Modal
        opened={detailsOpened}
        onClose={() => setDetailsOpened(false)}
        title={
          <Group>
            <ThemeIcon size="lg" radius="md" color="indigo" variant="light">
              <IconTool size={20} />
            </ThemeIcon>
            <Title order={3}>Detalles de la Visita Técnica</Title>
          </Group>
        }
        size="lg"
      >
        {selectedVisit && (
          <ScrollArea h={500}>
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
                        {selectedVisit.nombreCliente}
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
                        <Text size="md">{selectedVisit.contacto}</Text>
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
                        <Text size="md">{selectedVisit.direccion}</Text>
                      </Group>
                    </div>
                  </Grid.Col>
                </Grid>
              </Paper>

              {/* Fecha y Hora */}
              <Paper p="md" withBorder radius="md" className="bg-gray-50">
                <Group mb="md">
                  <ThemeIcon size="md" radius="md" color="grape" variant="light">
                    <IconCalendar size={18} />
                  </ThemeIcon>
                  <Text fw={600} size="lg">
                    Fecha y Hora
                  </Text>
                </Group>
                <Grid>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Fecha de Visita
                      </Text>
                      <Text size="lg" fw={700} c="indigo">
                        {new Date(selectedVisit.fechaVisita).toLocaleDateString("es-CL", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </Text>
                    </div>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Hora
                      </Text>
                      <Group gap="xs">
                        <IconClock size={18} className="text-indigo-600" />
                        <Text size="lg" fw={700} c="indigo">
                          {new Date(selectedVisit.horaVisita).toLocaleTimeString("es-CL", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </Group>
                    </div>
                  </Grid.Col>
                </Grid>
              </Paper>

              {/* Asignación */}
              <Paper p="md" withBorder radius="md" className="bg-gray-50">
                <Group mb="md">
                  <ThemeIcon size="md" radius="md" color="teal" variant="light">
                    <IconUserCheck size={18} />
                  </ThemeIcon>
                  <Text fw={600} size="lg">
                    Asignación
                  </Text>
                </Group>
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                    Técnico Asignado
                  </Text>
                  {selectedVisit.assignedUser ? (
                    <div>
                      <Text size="md" fw={500}>
                        {selectedVisit.assignedUser.name}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {selectedVisit.assignedUser.email}
                      </Text>
                    </div>
                  ) : (
                    <Text size="md" c="dimmed">
                      Sin asignar
                    </Text>
                  )}
                </div>
              </Paper>

              {/* Descripción */}
              <Paper p="md" withBorder radius="md" className="bg-gray-50">
                <Group mb="md">
                  <ThemeIcon size="md" radius="md" color="cyan" variant="light">
                    <IconNotes size={18} />
                  </ThemeIcon>
                  <Text fw={600} size="lg">
                    Descripción / Motivo
                  </Text>
                </Group>
                <Text size="sm">{selectedVisit.descripcion}</Text>
              </Paper>

              {/* Estado */}
              <Paper p="md" withBorder radius="md" className="bg-gray-50">
                <Text fw={600} size="lg" mb="xs">
                  Estado Actual
                </Text>
                <Badge
                  size="xl"
                  color={getEstadoBadgeColor(selectedVisit.estado)}
                  variant="filled"
                >
                  {selectedVisit.estado}
                </Badge>
              </Paper>

              {/* Botones de Acción */}
              <Group justify="flex-end" mt="md">
                <Button
                  variant="light"
                  onClick={() => {
                    setDetailsOpened(false);
                    handleOpenModal(selectedVisit.id);
                  }}
                  leftSection={<IconEdit size={16} />}
                >
                  Editar Visita
                </Button>
                <Button variant="subtle" onClick={() => setDetailsOpened(false)}>
                  Cerrar
                </Button>
              </Group>
            </Stack>
          </ScrollArea>
        )}
      </Modal>
    </MainLayout>
  );
}

