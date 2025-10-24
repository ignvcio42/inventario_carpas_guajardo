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
  Select,
  Grid,
  ActionIcon,
  Loader,
  Center,
  Divider,
  Paper,
  ThemeIcon,
  Tooltip,
  Box,
  Textarea,
  Switch,
  Alert,
  Anchor,
} from "@mantine/core";
import {
  IconBuildingStore,
  IconEdit,
  IconTrash,
  IconPlus,
  IconSearch,
  IconPhone,
  IconMail,
  IconMapPin,
  IconUser,
  IconInfoCircle,
  IconCheck,
  IconX,
  IconToggleRight,
  IconToggleLeft,
  IconEye,
} from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { api } from "~/trpc/react";
import { TipoServicio } from "@prisma/client";

interface ProveedorFormValues {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  tipoServicio: TipoServicio;
  contacto: string;
  rut: string;
  notas: string;
  activo: boolean;
}

export default function ProveedoresPage() {
  const { data: session, status } = useSession();
  const [opened, setOpened] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detailsOpened, setDetailsOpened] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState<any>(null);
  
  // Estados para búsqueda y filtrado
  const [searchQuery, setSearchQuery] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data: proveedores, isLoading, refetch } = api.proveedor.getAll.useQuery();
  const { data: proveedorStats } = api.proveedor.getStats.useQuery();
  const { data: proveedorDetails } = api.proveedor.getById.useQuery(
    { id: selectedProveedor?.id || 0 },
    { enabled: !!selectedProveedor?.id }
  );

  const createProveedor = api.proveedor.create.useMutation();
  const updateProveedor = api.proveedor.update.useMutation();
  const deleteProveedor = api.proveedor.delete.useMutation();
  const toggleStatus = api.proveedor.toggleStatus.useMutation();

  const form = useForm<ProveedorFormValues>({
    initialValues: {
      nombre: "",
      email: "",
      telefono: "",
      direccion: "",
      tipoServicio: TipoServicio.MOBILIARIO,
      contacto: "",
      rut: "",
      notas: "",
      activo: true,
    },
    validate: {
      nombre: (value) =>
        value.trim().length > 0 ? null : "El nombre es requerido",
      email: (value) =>
        value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? null
          : "Email inválido",
    },
  });

  const handleOpenModal = (proveedorId?: number) => {
    if (proveedorId) {
      const proveedor = proveedores?.find((p) => p.id === proveedorId);
      if (proveedor) {
        setEditingId(proveedorId);
        form.setValues({
          nombre: proveedor.nombre,
          email: proveedor.email || "",
          telefono: proveedor.telefono || "",
          direccion: proveedor.direccion || "",
          tipoServicio: proveedor.tipoServicio,
          contacto: proveedor.contacto || "",
          rut: proveedor.rut || "",
          notas: proveedor.notas || "",
          activo: proveedor.activo,
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

  const handleSubmit = async (values: ProveedorFormValues) => {
    try {
      if (editingId) {
        await updateProveedor.mutateAsync({
          id: editingId,
          ...values,
        });
        notifications.show({
          title: "Proveedor actualizado",
          message: "El proveedor ha sido actualizado exitosamente",
          color: "green",
        });
      } else {
        await createProveedor.mutateAsync(values);
        notifications.show({
          title: "Proveedor creado",
          message: "El proveedor ha sido creado exitosamente",
          color: "green",
        });
      }
      handleCloseModal();
      await refetch();
    } catch (error) {
      console.error("Error al guardar proveedor:", error);
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Ocurrió un error al guardar el proveedor",
        color: "red",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este proveedor?")) {
      try {
        await deleteProveedor.mutateAsync({ id });
        notifications.show({
          title: "Proveedor eliminado",
          message: "El proveedor ha sido eliminado exitosamente",
          color: "green",
        });
        await refetch();
      } catch (error) {
        notifications.show({
          title: "Error",
          message: error instanceof Error ? error.message : "Ocurrió un error al eliminar el proveedor",
          color: "red",
        });
      }
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await toggleStatus.mutateAsync({ id });
      notifications.show({
        title: "Estado actualizado",
        message: "El estado del proveedor ha sido actualizado",
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

  const handleViewDetails = (proveedor: any) => {
    setSelectedProveedor(proveedor);
    setDetailsOpened(true);
  };

  const getTipoServicioBadgeColor = (tipo: TipoServicio) => {
    switch (tipo) {
      case TipoServicio.MOBILIARIO:
        return "blue";
      case TipoServicio.DECORACION:
        return "purple";
      case TipoServicio.CATERING:
        return "orange";
      case TipoServicio.SONIDO:
        return "green";
      case TipoServicio.ILUMINACION:
        return "yellow";
      case TipoServicio.TRANSPORTE:
        return "cyan";
      case TipoServicio.OTROS:
        return "gray";
      default:
        return "gray";
    }
  };

  const getTipoServicioLabel = (tipo: TipoServicio) => {
    switch (tipo) {
      case TipoServicio.MOBILIARIO:
        return "Mobiliario";
      case TipoServicio.DECORACION:
        return "Decoración";
      case TipoServicio.CATERING:
        return "Catering";
      case TipoServicio.SONIDO:
        return "Sonido";
      case TipoServicio.ILUMINACION:
        return "Iluminación";
      case TipoServicio.TRANSPORTE:
        return "Transporte";
      case TipoServicio.OTROS:
        return "Otros";
      default:
        return tipo;
    }
  };

  // Filtrado y ordenamiento
  const filteredProveedores = useMemo(() => {
    if (!proveedores) return [];

    let filtered = [...proveedores];

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (proveedor) =>
          proveedor.nombre.toLowerCase().includes(query) ||
          proveedor.email?.toLowerCase().includes(query) ||
          proveedor.telefono?.toLowerCase().includes(query) ||
          proveedor.contacto?.toLowerCase().includes(query)
      );
    }

    // Filtrar por tipo
    if (tipoFilter && tipoFilter !== "all") {
      filtered = filtered.filter((proveedor) => proveedor.tipoServicio === tipoFilter);
    }

    // Filtrar por estado
    if (statusFilter && statusFilter !== "all") {
      const isActive = statusFilter === "active";
      filtered = filtered.filter((proveedor) => proveedor.activo === isActive);
    }

    return filtered;
  }, [proveedores, searchQuery, tipoFilter, statusFilter]);

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
                    Proveedores
                  </Title>
                  <Text c="dimmed" size="sm">
                    Gestiona proveedores de servicios complementarios
                  </Text>
                </div>
                <Button
                  leftSection={<IconPlus size={20} />}
                  onClick={() => handleOpenModal()}
                  size="md"
                >
                  Agregar Proveedor
                </Button>
              </Group>
            </Card>

            {/* Estadísticas */}
            {proveedorStats && (
              <Grid>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Card shadow="sm" padding="md" radius="md" className="bg-white">
                    <Group>
                      <ThemeIcon size="xl" radius="xl" color="blue" variant="light">
                        <IconBuildingStore size={24} />
                      </ThemeIcon>
                      <div>
                        <Text size="xl" fw={700} c="blue">
                          {proveedorStats.total}
                        </Text>
                        <Text size="sm" c="dimmed">
                          Total Proveedores
                        </Text>
                      </div>
                    </Group>
                  </Card>
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Card shadow="sm" padding="md" radius="md" className="bg-white">
                    <Group>
                      <ThemeIcon size="xl" radius="xl" color="green" variant="light">
                        <IconCheck size={24} />
                      </ThemeIcon>
                      <div>
                        <Text size="xl" fw={700} c="green">
                          {proveedorStats.activos}
                        </Text>
                        <Text size="sm" c="dimmed">
                          Activos
                        </Text>
                      </div>
                    </Group>
                  </Card>
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Card shadow="sm" padding="md" radius="md" className="bg-white">
                    <Group>
                      <ThemeIcon size="xl" radius="xl" color="red" variant="light">
                        <IconX size={24} />
                      </ThemeIcon>
                      <div>
                        <Text size="xl" fw={700} c="red">
                          {proveedorStats.inactivos}
                        </Text>
                        <Text size="sm" c="dimmed">
                          Inactivos
                        </Text>
                      </div>
                    </Group>
                  </Card>
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Card shadow="sm" padding="md" radius="md" className="bg-white">
                    <Group>
                      <ThemeIcon size="xl" radius="xl" color="purple" variant="light">
                        <IconInfoCircle size={24} />
                      </ThemeIcon>
                      <div>
                        <Text size="xl" fw={700} c="purple">
                          {proveedorStats.porTipo.length}
                        </Text>
                        <Text size="sm" c="dimmed">
                          Tipos de Servicio
                        </Text>
                      </div>
                    </Group>
                  </Card>
                </Grid.Col>
              </Grid>
            )}

            {/* Filtros y Búsqueda */}
            <Card shadow="sm" padding="lg" radius="md" className="bg-white">
              <Grid>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    placeholder="Buscar por nombre, email, teléfono, contacto..."
                    leftSection={<IconSearch size={16} />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.currentTarget.value)}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <Select
                    placeholder="Filtrar por tipo de servicio"
                    clearable
                    value={tipoFilter}
                    onChange={setTipoFilter}
                    data={[
                      { value: "all", label: "Todos los tipos" },
                      { value: TipoServicio.MOBILIARIO, label: "Mobiliario" },
                      { value: TipoServicio.DECORACION, label: "Decoración" },
                      { value: TipoServicio.CATERING, label: "Catering" },
                      { value: TipoServicio.SONIDO, label: "Sonido" },
                      { value: TipoServicio.ILUMINACION, label: "Iluminación" },
                      { value: TipoServicio.TRANSPORTE, label: "Transporte" },
                      { value: TipoServicio.OTROS, label: "Otros" },
                    ]}
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
                      { value: "active", label: "Activos" },
                      { value: "inactive", label: "Inactivos" },
                    ]}
                  />
                </Grid.Col>
              </Grid>
            </Card>

            {/* Tabla de Proveedores - Desktop */}
            <Card shadow="sm" padding="lg" radius="md" className="bg-white hidden md:block">
              {filteredProveedores && filteredProveedores.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Proveedor</Table.Th>
                        <Table.Th>Tipo de Servicio</Table.Th>
                        <Table.Th>Contacto</Table.Th>
                        <Table.Th>Estado</Table.Th>
                        <Table.Th>Creado</Table.Th>
                        <Table.Th>Acciones</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filteredProveedores.map((proveedor) => (
                        <Table.Tr key={proveedor.id}>
                          <Table.Td>
                            <div>
                              <Text size="sm" fw={500}>
                                {proveedor.nombre}
                              </Text>
                              {proveedor.rut && (
                                <Text size="xs" c="dimmed">
                                  RUT: {proveedor.rut}
                                </Text>
                              )}
                            </div>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              color={getTipoServicioBadgeColor(proveedor.tipoServicio)}
                              variant="light"
                              size="sm"
                            >
                              {getTipoServicioLabel(proveedor.tipoServicio)}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Stack gap="xs">
                              {proveedor.email && (
                                <Group gap="xs">
                                  <IconMail size={14} className="text-gray-500" />
                                  <Text size="xs">{proveedor.email}</Text>
                                </Group>
                              )}
                              {proveedor.telefono && (
                                <Group gap="xs">
                                  <IconPhone size={14} className="text-gray-500" />
                                  <Anchor
                                    href={`tel:${proveedor.telefono}`}
                                    size="xs"
                                    c="blue"
                                    underline="hover"
                                  >
                                    {proveedor.telefono}
                                  </Anchor>
                                </Group>
                              )}
                              {proveedor.contacto && (
                                <Group gap="xs">
                                  <IconUser size={14} className="text-gray-500" />
                                  <Text size="xs">{proveedor.contacto}</Text>
                                </Group>
                              )}
                            </Stack>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              color={proveedor.activo ? "green" : "red"}
                              variant="light"
                              size="sm"
                            >
                              {proveedor.activo ? "Activo" : "Inactivo"}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" c="dimmed">
                              {new Date(proveedor.createdAt).toLocaleDateString("es-CL")}
                            </Text>
                            <Text size="xs" c="dimmed">
                              por {proveedor.createdBy.name}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <ActionIcon
                                variant="light"
                                color="indigo"
                                onClick={() => handleViewDetails(proveedor)}
                                size="lg"
                              >
                                <IconInfoCircle size={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="light"
                                color="blue"
                                onClick={() => handleOpenModal(proveedor.id)}
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="light"
                                color={proveedor.activo ? "orange" : "green"}
                                onClick={() => handleToggleStatus(proveedor.id)}
                                loading={toggleStatus.isPending}
                              >
                                {proveedor.activo ? (
                                  <IconToggleRight size={16} />
                                ) : (
                                  <IconToggleLeft size={16} />
                                )}
                              </ActionIcon>
                              <ActionIcon
                                variant="light"
                                color="red"
                                onClick={() => handleDelete(proveedor.id)}
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
                    <IconBuildingStore
                      size={48}
                      className="text-gray-400"
                      stroke={1.5}
                    />
                    <div className="text-center">
                      <Text size="lg" fw={500} c="dimmed">
                        No hay proveedores registrados
                      </Text>
                      <Text size="sm" c="dimmed">
                        Comienza agregando tu primer proveedor
                      </Text>
                    </div>
                    <Button
                      leftSection={<IconPlus size={20} />}
                      onClick={() => handleOpenModal()}
                    >
                      Agregar Primer Proveedor
                    </Button>
                  </Stack>
                </Center>
              )}
            </Card>

            {/* Cards de Proveedores - Mobile */}
            <div className="md:hidden">
              {filteredProveedores && filteredProveedores.length > 0 ? (
                <Stack gap="sm">
                  {filteredProveedores.map((proveedor) => (
                    <Card
                      key={proveedor.id}
                      shadow="sm"
                      padding="md"
                      radius="md"
                      className="bg-white"
                      withBorder
                    >
                      <Stack gap="xs">
                        <Group justify="space-between" align="flex-start">
                          <div style={{ flex: 1 }}>
                            <Text size="sm" fw={600} mb={4}>
                              {proveedor.nombre}
                            </Text>
                            {proveedor.rut && (
                              <Text size="xs" c="dimmed">
                                RUT: {proveedor.rut}
                              </Text>
                            )}
                          </div>
                          <Badge
                            color={getTipoServicioBadgeColor(proveedor.tipoServicio)}
                            variant="light"
                            size="sm"
                          >
                            {getTipoServicioLabel(proveedor.tipoServicio)}
                          </Badge>
                        </Group>

                        <Divider />

                        <Grid gutter="xs">
                          {proveedor.email && (
                            <Grid.Col span={12}>
                              <Group gap={4}>
                                <IconMail size={14} className="text-gray-500" />
                                <Text size="xs">{proveedor.email}</Text>
                              </Group>
                            </Grid.Col>
                          )}

                          {proveedor.telefono && (
                            <Grid.Col span={12}>
                              <Group gap={4}>
                                <IconPhone size={14} className="text-gray-500" />
                                <Anchor
                                  href={`tel:${proveedor.telefono}`}
                                  size="xs"
                                  c="blue"
                                  underline="hover"
                                >
                                  {proveedor.telefono}
                                </Anchor>
                              </Group>
                            </Grid.Col>
                          )}

                          {proveedor.contacto && (
                            <Grid.Col span={12}>
                              <Group gap={4}>
                                <IconUser size={14} className="text-gray-500" />
                                <Text size="xs">{proveedor.contacto}</Text>
                              </Group>
                            </Grid.Col>
                          )}

                          {proveedor.direccion && (
                            <Grid.Col span={12}>
                              <Group gap={4}>
                                <IconMapPin size={14} className="text-gray-500" />
                                <Text size="xs">{proveedor.direccion}</Text>
                              </Group>
                            </Grid.Col>
                          )}

                          <Grid.Col span={6}>
                            <Text size="xs" c="dimmed">
                              Estado
                            </Text>
                            <Badge
                              color={proveedor.activo ? "green" : "red"}
                              variant="light"
                              size="sm"
                            >
                              {proveedor.activo ? "Activo" : "Inactivo"}
                            </Badge>
                          </Grid.Col>

                          <Grid.Col span={6}>
                            <Text size="xs" c="dimmed">
                              Creado
                            </Text>
                            <Text size="xs" fw={500}>
                              {new Date(proveedor.createdAt).toLocaleDateString("es-CL")}
                            </Text>
                          </Grid.Col>
                        </Grid>

                        <Divider />

                        <Group justify="flex-end" gap={4}>
                          <ActionIcon
                            variant="light"
                            color="indigo"
                            onClick={() => handleViewDetails(proveedor)}
                            size="sm"
                          >
                            <IconEye size={14} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() => handleOpenModal(proveedor.id)}
                            size="sm"
                          >
                            <IconEdit size={14} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color={proveedor.activo ? "orange" : "green"}
                            onClick={() => handleToggleStatus(proveedor.id)}
                            loading={toggleStatus.isPending}
                            size="sm"
                          >
                            {proveedor.activo ? (
                              <IconToggleRight size={14} />
                            ) : (
                              <IconToggleLeft size={14} />
                            )}
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => handleDelete(proveedor.id)}
                            size="sm"
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Group>
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Card shadow="sm" padding="lg" radius="md" className="bg-white">
                  <Center className="py-12">
                    <Stack align="center" gap="md">
                      <IconBuildingStore
                        size={48}
                        className="text-gray-400"
                        stroke={1.5}
                      />
                      <div className="text-center">
                        <Text size="lg" fw={500} c="dimmed">
                          No hay proveedores registrados
                        </Text>
                        <Text size="sm" c="dimmed">
                          Comienza agregando tu primer proveedor
                        </Text>
                      </div>
                      <Button
                        leftSection={<IconPlus size={20} />}
                        onClick={() => handleOpenModal()}
                      >
                        Agregar Proveedor
                      </Button>
                    </Stack>
                  </Center>
                </Card>
              )}
            </div>
          </Stack>
        </div>
      </div>

      {/* Modal de Agregar/Editar Proveedor */}
      <Modal
        opened={opened}
        onClose={handleCloseModal}
        title={
          <Title order={3}>
            {editingId ? "Editar Proveedor" : "Agregar Nuevo Proveedor"}
          </Title>
        }
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Nombre del Proveedor"
                  placeholder="Proveedor ABC"
                  required
                  leftSection={<IconBuildingStore size={16} />}
                  {...form.getInputProps("nombre")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Tipo de Servicio"
                  placeholder="Selecciona el tipo"
                  required
                  data={[
                    { value: TipoServicio.MOBILIARIO, label: "Mobiliario" },
                    { value: TipoServicio.DECORACION, label: "Decoración" },
                    { value: TipoServicio.CATERING, label: "Catering" },
                    { value: TipoServicio.SONIDO, label: "Sonido" },
                    { value: TipoServicio.ILUMINACION, label: "Iluminación" },
                    { value: TipoServicio.TRANSPORTE, label: "Transporte" },
                    { value: TipoServicio.OTROS, label: "Otros" },
                  ]}
                  {...form.getInputProps("tipoServicio")}
                />
              </Grid.Col>
            </Grid>

            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Email"
                  placeholder="proveedor@ejemplo.com"
                  leftSection={<IconMail size={16} />}
                  {...form.getInputProps("email")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Teléfono"
                  placeholder="+56 9 1234 5678"
                  leftSection={<IconPhone size={16} />}
                  {...form.getInputProps("telefono")}
                />
              </Grid.Col>
            </Grid>

            <TextInput
              label="Dirección"
              placeholder="Av. Principal 123, Santiago"
              leftSection={<IconMapPin size={16} />}
              {...form.getInputProps("direccion")}
            />

            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Persona de Contacto"
                  placeholder="Juan Pérez"
                  leftSection={<IconUser size={16} />}
                  {...form.getInputProps("contacto")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="RUT"
                  placeholder="12.345.678-9"
                  {...form.getInputProps("rut")}
                />
              </Grid.Col>
            </Grid>

            <Textarea
              label="Notas"
              placeholder="Información adicional sobre el proveedor..."
              minRows={3}
              {...form.getInputProps("notas")}
            />

            <Switch
              label="Proveedor activo"
              description="Los proveedores inactivos no aparecerán en las opciones disponibles"
              {...form.getInputProps("activo", { type: "checkbox" })}
            />

            {/* Botones */}
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={createProveedor.isPending || updateProveedor.isPending}
              >
                {editingId ? "Actualizar Proveedor" : "Crear Proveedor"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal de Detalles del Proveedor */}
      <Modal
        opened={detailsOpened}
        onClose={() => setDetailsOpened(false)}
        title={
          <Group>
            <ThemeIcon size="lg" radius="md" color="indigo" variant="light">
              <IconBuildingStore size={20} />
            </ThemeIcon>
            <Title order={3}>Detalles del Proveedor</Title>
          </Group>
        }
        size="lg"
      >
        {proveedorDetails && (
          <Stack gap="lg">
            {/* Información del Proveedor */}
            <Paper p="md" withBorder radius="md" className="bg-gray-50">
              <Group mb="md">
                <ThemeIcon size="md" radius="md" color="blue" variant="light">
                  <IconBuildingStore size={18} />
                </ThemeIcon>
                <Text fw={600} size="lg">
                  Información del Proveedor
                </Text>
              </Group>
              <Grid>
                <Grid.Col span={12}>
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      Nombre
                    </Text>
                    <Text size="md" fw={500}>
                      {proveedorDetails.nombre}
                    </Text>
                  </div>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      Tipo de Servicio
                    </Text>
                    <Badge
                      color={getTipoServicioBadgeColor(proveedorDetails.tipoServicio)}
                      variant="light"
                      size="lg"
                    >
                      {getTipoServicioLabel(proveedorDetails.tipoServicio)}
                    </Badge>
                  </div>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      Estado
                    </Text>
                    <Badge
                      color={proveedorDetails.activo ? "green" : "red"}
                      variant="light"
                      size="lg"
                    >
                      {proveedorDetails.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </Grid.Col>
                {proveedorDetails.rut && (
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        RUT
                      </Text>
                      <Text size="md">{proveedorDetails.rut}</Text>
                    </div>
                  </Grid.Col>
                )}
                {proveedorDetails.contacto && (
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Persona de Contacto
                      </Text>
                      <Text size="md">{proveedorDetails.contacto}</Text>
                    </div>
                  </Grid.Col>
                )}
              </Grid>
            </Paper>

            {/* Información de Contacto */}
            <Paper p="md" withBorder radius="md" className="bg-gray-50">
              <Group mb="md">
                <ThemeIcon size="md" radius="md" color="green" variant="light">
                  <IconPhone size={18} />
                </ThemeIcon>
                <Text fw={600} size="lg">
                  Información de Contacto
                </Text>
              </Group>
              <Grid>
                {proveedorDetails.email && (
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Email
                      </Text>
                      <Group gap="xs">
                        <IconMail size={16} className="text-gray-500" />
                        <Text size="md">{proveedorDetails.email}</Text>
                      </Group>
                    </div>
                  </Grid.Col>
                )}
                {proveedorDetails.telefono && (
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Teléfono
                      </Text>
                      <Group gap="xs">
                        <IconPhone size={16} className="text-gray-500" />
                        <Text size="md">{proveedorDetails.telefono}</Text>
                      </Group>
                    </div>
                  </Grid.Col>
                )}
                {proveedorDetails.direccion && (
                  <Grid.Col span={12}>
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Dirección
                      </Text>
                      <Group gap="xs">
                        <IconMapPin size={16} className="text-gray-500" />
                        <Text size="md">{proveedorDetails.direccion}</Text>
                      </Group>
                    </div>
                  </Grid.Col>
                )}
              </Grid>
            </Paper>

            {/* Notas */}
            {proveedorDetails.notas && (
              <Paper p="md" withBorder radius="md" className="bg-gray-50">
                <Text fw={600} size="lg" mb="xs">
                  Notas
                </Text>
                <Text size="sm" c="dimmed">
                  {proveedorDetails.notas}
                </Text>
              </Paper>
            )}

            {/* Información del Sistema */}
            <Paper p="md" withBorder radius="md" className="bg-gray-50">
              <Text fw={600} size="lg" mb="xs">
                Información del Sistema
              </Text>
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      Creado
                    </Text>
                    <Text size="sm">
                      {new Date(proveedorDetails.createdAt).toLocaleDateString("es-CL")}
                    </Text>
                    <Text size="xs" c="dimmed">
                      por {proveedorDetails.createdBy.name}
                    </Text>
                  </div>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      Última actualización
                    </Text>
                    <Text size="sm">
                      {new Date(proveedorDetails.updatedAt).toLocaleDateString("es-CL")}
                    </Text>
                  </div>
                </Grid.Col>
              </Grid>
            </Paper>

            {/* Botones de Acción */}
            <Group justify="flex-end" mt="md">
              <Button
                variant="light"
                onClick={() => {
                  setDetailsOpened(false);
                  handleOpenModal(proveedorDetails.id);
                }}
                leftSection={<IconEdit size={16} />}
              >
                Editar Proveedor
              </Button>
              <Button variant="subtle" onClick={() => setDetailsOpened(false)}>
                Cerrar
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </MainLayout>
  );
}
