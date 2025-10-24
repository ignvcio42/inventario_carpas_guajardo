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
  Alert,
} from "@mantine/core";
import {
  IconUser,
  IconEdit,
  IconTrash,
  IconPlus,
  IconSearch,
  IconPhone,
  IconMail,
  IconMapPin,
  IconBuilding,
  IconCalendarEvent,
  IconInfoCircle,
  IconUsers,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { api } from "~/trpc/react";
import { TipoCliente } from "@prisma/client";

interface ClienteFormValues {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  tipoCliente: TipoCliente;
  empresa: string;
  rut: string;
  notas: string;
}

export default function ClientesPage() {
  const { data: session, status } = useSession();
  const [opened, setOpened] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detailsOpened, setDetailsOpened] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  
  // Estados para búsqueda y filtrado
  const [searchQuery, setSearchQuery] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string | null>(null);

  const { data: clientes, isLoading, refetch } = api.cliente.getAll.useQuery();
  const { data: clienteStats } = api.cliente.getStats.useQuery();
  const { data: clienteDetails } = api.cliente.getById.useQuery(
    { id: selectedCliente?.id || 0 },
    { enabled: !!selectedCliente?.id }
  );

  const createCliente = api.cliente.create.useMutation();
  const updateCliente = api.cliente.update.useMutation();
  const deleteCliente = api.cliente.delete.useMutation();

  const form = useForm<ClienteFormValues>({
    initialValues: {
      nombre: "",
      email: "",
      telefono: "",
      direccion: "",
      tipoCliente: TipoCliente.PARTICULAR,
      empresa: "",
      rut: "",
      notas: "",
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

  const handleOpenModal = (clienteId?: number) => {
    if (clienteId) {
      const cliente = clientes?.find((c) => c.id === clienteId);
      if (cliente) {
        setEditingId(clienteId);
        form.setValues({
          nombre: cliente.nombre,
          email: cliente.email || "",
          telefono: cliente.telefono || "",
          direccion: cliente.direccion || "",
          tipoCliente: cliente.tipoCliente,
          empresa: cliente.empresa || "",
          rut: cliente.rut || "",
          notas: cliente.notas || "",
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

  const handleSubmit = async (values: ClienteFormValues) => {
    try {
      if (editingId) {
        await updateCliente.mutateAsync({
          id: editingId,
          ...values,
        });
        notifications.show({
          title: "Cliente actualizado",
          message: "El cliente ha sido actualizado exitosamente",
          color: "green",
        });
      } else {
        await createCliente.mutateAsync(values);
        notifications.show({
          title: "Cliente creado",
          message: "El cliente ha sido creado exitosamente",
          color: "green",
        });
      }
      handleCloseModal();
      await refetch();
    } catch (error) {
      console.error("Error al guardar cliente:", error);
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Ocurrió un error al guardar el cliente",
        color: "red",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este cliente?")) {
      try {
        await deleteCliente.mutateAsync({ id });
        notifications.show({
          title: "Cliente eliminado",
          message: "El cliente ha sido eliminado exitosamente",
          color: "green",
        });
        await refetch();
      } catch (error) {
        notifications.show({
          title: "Error",
          message: error instanceof Error ? error.message : "Ocurrió un error al eliminar el cliente",
          color: "red",
        });
      }
    }
  };

  const handleViewDetails = (cliente: any) => {
    setSelectedCliente(cliente);
    setDetailsOpened(true);
  };

  const getTipoClienteBadgeColor = (tipo: TipoCliente) => {
    switch (tipo) {
      case TipoCliente.PARTICULAR:
        return "blue";
      case TipoCliente.EMPRESA:
        return "green";
      case TipoCliente.ORGANIZACION:
        return "purple";
      case TipoCliente.GOBIERNO:
        return "orange";
      case TipoCliente.EMBAJADA:
        return "red";
      default:
        return "gray";
    }
  };

  const getTipoClienteLabel = (tipo: TipoCliente) => {
    switch (tipo) {
      case TipoCliente.PARTICULAR:
        return "Particular";
      case TipoCliente.EMPRESA:
        return "Empresa";
      case TipoCliente.ORGANIZACION:
        return "Organización";
      case TipoCliente.GOBIERNO:
        return "Gobierno";
      case TipoCliente.EMBAJADA:
        return "Embajada";
      default:
        return tipo;
    }
  };

  // Filtrado y ordenamiento
  const filteredClientes = useMemo(() => {
    if (!clientes) return [];

    let filtered = [...clientes];

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (cliente) =>
          cliente.nombre.toLowerCase().includes(query) ||
          cliente.email?.toLowerCase().includes(query) ||
          cliente.telefono?.toLowerCase().includes(query) ||
          cliente.empresa?.toLowerCase().includes(query)
      );
    }

    // Filtrar por tipo
    if (tipoFilter && tipoFilter !== "all") {
      filtered = filtered.filter((cliente) => cliente.tipoCliente === tipoFilter);
    }

    return filtered;
  }, [clientes, searchQuery, tipoFilter]);

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
                    Clientes
                  </Title>
                  <Text c="dimmed" size="sm">
                    Gestiona el historial de clientes y sus eventos
                  </Text>
                </div>
                <Button
                  leftSection={<IconPlus size={20} />}
                  onClick={() => handleOpenModal()}
                  size="md"
                >
                  Agregar Cliente
                </Button>
              </Group>
            </Card>

            {/* Estadísticas */}
            {clienteStats && (
              <Grid>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Card shadow="sm" padding="md" radius="md" className="bg-white">
                    <Group>
                      <ThemeIcon size="xl" radius="xl" color="blue" variant="light">
                        <IconUsers size={24} />
                      </ThemeIcon>
                      <div>
                        <Text size="xl" fw={700} c="blue">
                          {clienteStats.total}
                        </Text>
                        <Text size="sm" c="dimmed">
                          Total Clientes
                        </Text>
                      </div>
                    </Group>
                  </Card>
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Card shadow="sm" padding="md" radius="md" className="bg-white">
                    <Group>
                      <ThemeIcon size="xl" radius="xl" color="green" variant="light">
                        <IconCalendarEvent size={24} />
                      </ThemeIcon>
                      <div>
                        <Text size="xl" fw={700} c="green">
                          {clienteStats.conEventos}
                        </Text>
                        <Text size="sm" c="dimmed">
                          Con Eventos
                        </Text>
                      </div>
                    </Group>
                  </Card>
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Card shadow="sm" padding="md" radius="md" className="bg-white">
                    <Group>
                      <ThemeIcon size="xl" radius="xl" color="purple" variant="light">
                        <IconBuilding size={24} />
                      </ThemeIcon>
                      <div>
                        <Text size="xl" fw={700} c="purple">
                          {clienteStats.eventosTotales}
                        </Text>
                        <Text size="sm" c="dimmed">
                          Eventos Totales
                        </Text>
                      </div>
                    </Group>
                  </Card>
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <Card shadow="sm" padding="md" radius="md" className="bg-white">
                    <Group>
                      <ThemeIcon size="xl" radius="xl" color="orange" variant="light">
                        <IconInfoCircle size={24} />
                      </ThemeIcon>
                      <div>
                        <Text size="xl" fw={700} c="orange">
                          {clienteStats.porTipo.length}
                        </Text>
                        <Text size="sm" c="dimmed">
                          Tipos Diferentes
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
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    placeholder="Buscar por nombre, email, teléfono, empresa..."
                    leftSection={<IconSearch size={16} />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.currentTarget.value)}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    placeholder="Filtrar por tipo de cliente"
                    clearable
                    value={tipoFilter}
                    onChange={setTipoFilter}
                    data={[
                      { value: "all", label: "Todos los tipos" },
                      { value: TipoCliente.PARTICULAR, label: "Particular" },
                      { value: TipoCliente.EMPRESA, label: "Empresa" },
                      { value: TipoCliente.ORGANIZACION, label: "Organización" },
                      { value: TipoCliente.GOBIERNO, label: "Gobierno" },
                      { value: TipoCliente.EMBAJADA, label: "Embajada" },
                    ]}
                  />
                </Grid.Col>
              </Grid>
            </Card>

            {/* Tabla de Clientes */}
            <Card shadow="sm" padding="lg" radius="md" className="bg-white">
              {filteredClientes && filteredClientes.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Cliente</Table.Th>
                        <Table.Th>Tipo</Table.Th>
                        <Table.Th>Contacto</Table.Th>
                        <Table.Th>Empresa</Table.Th>
                        <Table.Th>Eventos</Table.Th>
                        <Table.Th>Creado</Table.Th>
                        <Table.Th>Acciones</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filteredClientes.map((cliente) => (
                        <Table.Tr key={cliente.id}>
                          <Table.Td>
                            <div>
                              <Text size="sm" fw={500}>
                                {cliente.nombre}
                              </Text>
                              {cliente.rut && (
                                <Text size="xs" c="dimmed">
                                  RUT: {cliente.rut}
                                </Text>
                              )}
                            </div>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              color={getTipoClienteBadgeColor(cliente.tipoCliente)}
                              variant="light"
                              size="sm"
                            >
                              {getTipoClienteLabel(cliente.tipoCliente)}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Stack gap="xs">
                              {cliente.email && (
                                <Group gap="xs">
                                  <IconMail size={14} className="text-gray-500" />
                                  <Text size="xs">{cliente.email}</Text>
                                </Group>
                              )}
                              {cliente.telefono && (
                                <Group gap="xs">
                                  <IconPhone size={14} className="text-gray-500" />
                                  <Text size="xs">{cliente.telefono}</Text>
                                </Group>
                              )}
                            </Stack>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">
                              {cliente.empresa || "-"}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              color={cliente._count.eventos > 0 ? "green" : "gray"}
                              variant="light"
                              size="sm"
                            >
                              {cliente._count.eventos} evento(s)
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" c="dimmed">
                              {new Date(cliente.createdAt).toLocaleDateString("es-CL")}
                            </Text>
                            <Text size="xs" c="dimmed">
                              por {cliente.createdBy.name}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <ActionIcon
                                variant="light"
                                color="indigo"
                                onClick={() => handleViewDetails(cliente)}
                                size="lg"
                              >
                                <IconInfoCircle size={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="light"
                                color="blue"
                                onClick={() => handleOpenModal(cliente.id)}
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="light"
                                color="red"
                                onClick={() => handleDelete(cliente.id)}
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
                    <IconUser
                      size={48}
                      className="text-gray-400"
                      stroke={1.5}
                    />
                    <div className="text-center">
                      <Text size="lg" fw={500} c="dimmed">
                        No hay clientes registrados
                      </Text>
                      <Text size="sm" c="dimmed">
                        Comienza agregando tu primer cliente
                      </Text>
                    </div>
                    <Button
                      leftSection={<IconPlus size={20} />}
                      onClick={() => handleOpenModal()}
                    >
                      Agregar Primer Cliente
                    </Button>
                  </Stack>
                </Center>
              )}
            </Card>
          </Stack>
        </div>
      </div>

      {/* Modal de Agregar/Editar Cliente */}
      <Modal
        opened={opened}
        onClose={handleCloseModal}
        title={
          <Title order={3}>
            {editingId ? "Editar Cliente" : "Agregar Nuevo Cliente"}
          </Title>
        }
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Nombre Completo"
                  placeholder="Juan Pérez"
                  required
                  leftSection={<IconUser size={16} />}
                  {...form.getInputProps("nombre")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Tipo de Cliente"
                  placeholder="Selecciona el tipo"
                  required
                  data={[
                    { value: TipoCliente.PARTICULAR, label: "Particular" },
                    { value: TipoCliente.EMPRESA, label: "Empresa" },
                    { value: TipoCliente.ORGANIZACION, label: "Organización" },
                    { value: TipoCliente.GOBIERNO, label: "Gobierno" },
                    { value: TipoCliente.EMBAJADA, label: "Embajada" },
                  ]}
                  {...form.getInputProps("tipoCliente")}
                />
              </Grid.Col>
            </Grid>

            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Email"
                  placeholder="cliente@ejemplo.com"
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
                  label="Empresa"
                  placeholder="Nombre de la empresa"
                  leftSection={<IconBuilding size={16} />}
                  {...form.getInputProps("empresa")}
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
              placeholder="Información adicional sobre el cliente..."
              minRows={3}
              {...form.getInputProps("notas")}
            />

            {/* Botones */}
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={createCliente.isPending || updateCliente.isPending}
              >
                {editingId ? "Actualizar Cliente" : "Crear Cliente"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal de Detalles del Cliente */}
      <Modal
        opened={detailsOpened}
        onClose={() => setDetailsOpened(false)}
        title={
          <Group>
            <ThemeIcon size="lg" radius="md" color="indigo" variant="light">
              <IconUser size={20} />
            </ThemeIcon>
            <Title order={3}>Detalles del Cliente</Title>
          </Group>
        }
        size="xl"
      >
        {clienteDetails && (
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
                      Nombre Completo
                    </Text>
                    <Text size="md" fw={500}>
                      {clienteDetails.nombre}
                    </Text>
                  </div>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      Tipo de Cliente
                    </Text>
                    <Badge
                      color={getTipoClienteBadgeColor(clienteDetails.tipoCliente)}
                      variant="light"
                      size="lg"
                    >
                      {getTipoClienteLabel(clienteDetails.tipoCliente)}
                    </Badge>
                  </div>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      RUT
                    </Text>
                    <Text size="md">
                      {clienteDetails.rut || "No especificado"}
                    </Text>
                  </div>
                </Grid.Col>
                {clienteDetails.empresa && (
                  <Grid.Col span={12}>
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Empresa
                      </Text>
                      <Text size="md">{clienteDetails.empresa}</Text>
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
                {clienteDetails.email && (
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Email
                      </Text>
                      <Group gap="xs">
                        <IconMail size={16} className="text-gray-500" />
                        <Text size="md">{clienteDetails.email}</Text>
                      </Group>
                    </div>
                  </Grid.Col>
                )}
                {clienteDetails.telefono && (
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Teléfono
                      </Text>
                      <Group gap="xs">
                        <IconPhone size={16} className="text-gray-500" />
                        <Text size="md">{clienteDetails.telefono}</Text>
                      </Group>
                    </div>
                  </Grid.Col>
                )}
                {clienteDetails.direccion && (
                  <Grid.Col span={12}>
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                        Dirección
                      </Text>
                      <Group gap="xs">
                        <IconMapPin size={16} className="text-gray-500" />
                        <Text size="md">{clienteDetails.direccion}</Text>
                      </Group>
                    </div>
                  </Grid.Col>
                )}
              </Grid>
            </Paper>

            {/* Notas */}
            {clienteDetails.notas && (
              <Paper p="md" withBorder radius="md" className="bg-gray-50">
                <Text fw={600} size="lg" mb="xs">
                  Notas
                </Text>
                <Text size="sm" c="dimmed">
                  {clienteDetails.notas}
                </Text>
              </Paper>
            )}

            {/* Historial de Eventos */}
            <Paper p="md" withBorder radius="md" className="bg-gray-50">
              <Group mb="md">
                <ThemeIcon size="md" radius="md" color="purple" variant="light">
                  <IconCalendarEvent size={18} />
                </ThemeIcon>
                <Text fw={600} size="lg">
                  Historial de Eventos ({clienteDetails.eventos.length})
                </Text>
              </Group>
              {clienteDetails.eventos.length > 0 ? (
                <Stack gap="xs">
                  {clienteDetails.eventos.map((evento: any) => (
                    <Card key={evento.id} padding="sm" withBorder>
                      <Group justify="space-between" align="flex-start">
                        <div style={{ flex: 1 }}>
                          <Text fw={500} size="sm">
                            {evento.nombreCliente}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {evento.descripcion}
                          </Text>
                          <Group gap="md" mt="xs">
                            <Text size="xs" c="dimmed">
                              {new Date(evento.startDate).toLocaleDateString("es-CL")}
                            </Text>
                            <Text size="xs" c="dimmed">
                              ${Number(evento.montoTotal).toLocaleString("es-CL")}
                            </Text>
                            <Badge
                              color={
                                evento.estado === "COMPLETADO"
                                  ? "green"
                                  : evento.estado === "EN_PROCESO"
                                  ? "blue"
                                  : evento.estado === "CANCELADO"
                                  ? "red"
                                  : "yellow"
                              }
                              variant="light"
                              size="xs"
                            >
                              {evento.estado.replace("_", " ")}
                            </Badge>
                          </Group>
                        </div>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Text size="sm" c="dimmed" ta="center" py="md">
                  Este cliente no tiene eventos registrados.
                </Text>
              )}
            </Paper>

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
                      {new Date(clienteDetails.createdAt).toLocaleDateString("es-CL")}
                    </Text>
                    <Text size="xs" c="dimmed">
                      por {clienteDetails.createdBy.name}
                    </Text>
                  </div>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      Última actualización
                    </Text>
                    <Text size="sm">
                      {new Date(clienteDetails.updatedAt).toLocaleDateString("es-CL")}
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
                  handleOpenModal(clienteDetails.id);
                }}
                leftSection={<IconEdit size={16} />}
              >
                Editar Cliente
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
