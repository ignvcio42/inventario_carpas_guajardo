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
  Select,
  Grid,
  ActionIcon,
  Loader,
  Center,
  Paper,
  ThemeIcon,
  ScrollArea,
  Image,
  Textarea,
} from "@mantine/core";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconPackage,
  IconSearch,
  IconEye,
  IconArrowUp,
  IconArrowDown,
  IconAdjustments,
  IconPhoto,
  IconBox,
  IconRuler,
  IconListDetails,
} from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { api } from "~/trpc/react";

interface ItemFormValues {
  name: string;
  type: string;
  quantity: number;
  unit: string;
  imageUrl: string;
}

interface StockAdjustmentFormValues {
  quantity: number;
  type: "IN" | "OUT" | "ADJUSTMENT";
  reason: string;
}

export default function InventoryPage() {
  const { data: session, status } = useSession();
  const [opened, setOpened] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detailsOpened, setDetailsOpened] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [adjustmentOpened, setAdjustmentOpened] = useState(false);
  const [adjustingItemId, setAdjustingItemId] = useState<number | null>(null);
  
  // Estados para búsqueda y filtrado
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("name-asc");

  const { data: items, isLoading, refetch } = api.inventory.getAll.useQuery();
  const { data: types } = api.inventory.getTypes.useQuery();
  const createItem = api.inventory.create.useMutation();
  const updateItem = api.inventory.update.useMutation();
  const deleteItem = api.inventory.delete.useMutation();
  const adjustStock = api.inventory.adjustStock.useMutation();

  const form = useForm<ItemFormValues>({
    initialValues: {
      name: "",
      type: "",
      quantity: 0,
      unit: "",
      imageUrl: "",
    },
    validate: {
      name: (value) =>
        value.trim().length > 0 ? null : "El nombre es requerido",
      type: (value) =>
        value.trim().length > 0 ? null : "El tipo es requerido",
      quantity: (value) =>
        value >= 0 ? null : "La cantidad debe ser mayor o igual a 0",
    },
  });

  const adjustmentForm = useForm<StockAdjustmentFormValues>({
    initialValues: {
      quantity: 0,
      type: "IN",
      reason: "",
    },
    validate: {
      quantity: (value) =>
        value > 0 ? null : "La cantidad debe ser mayor a 0",
    },
  });

  const handleOpenModal = (itemId?: number) => {
    if (itemId) {
      const item = items?.find((i) => i.id === itemId);
      if (item) {
        setEditingId(itemId);
        form.setValues({
          name: item.name,
          type: item.type,
          quantity: item.quantity,
          unit: item.unit,
          imageUrl: item.imageUrl || "",
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

  const handleSubmit = async (values: ItemFormValues) => {
    try {
      if (editingId) {
        await updateItem.mutateAsync({
          id: editingId,
          ...values,
        });
        notifications.show({
          title: "Item actualizado",
          message: "El item ha sido actualizado exitosamente",
          color: "green",
        });
      } else {
        await createItem.mutateAsync(values);
        notifications.show({
          title: "Item creado",
          message: "El item ha sido creado exitosamente",
          color: "green",
        });
      }
      handleCloseModal();
      await refetch();
    } catch (error) {
      console.error("Error al guardar item:", error);
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Ocurrió un error al guardar el item",
        color: "red",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este item?")) {
      try {
        await deleteItem.mutateAsync({ id });
        notifications.show({
          title: "Item eliminado",
          message: "El item ha sido eliminado exitosamente",
          color: "green",
        });
        await refetch();
      } catch (error) {
        notifications.show({
          title: "Error",
          message: "Ocurrió un error al eliminar el item",
          color: "red",
        });
      }
    }
  };

  const handleViewDetails = (item: any) => {
    setSelectedItem(item);
    setDetailsOpened(true);
  };

  const handleOpenAdjustment = (itemId: number) => {
    setAdjustingItemId(itemId);
    adjustmentForm.reset();
    setAdjustmentOpened(true);
  };

  const handleAdjustStock = async (values: StockAdjustmentFormValues) => {
    if (!adjustingItemId) return;
    
    try {
      await adjustStock.mutateAsync({
        id: adjustingItemId,
        ...values,
      });
      notifications.show({
        title: "Stock ajustado",
        message: "El stock ha sido ajustado exitosamente",
        color: "green",
      });
      setAdjustmentOpened(false);
      setAdjustingItemId(null);
      adjustmentForm.reset();
      await refetch();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Ocurrió un error al ajustar el stock",
        color: "red",
      });
    }
  };

  const getStockStatusColor = (quantity: number) => {
    if (quantity === 0) return "red";
    if (quantity < 10) return "yellow";
    return "green";
  };

  // Filtrado y ordenamiento
  const filteredAndSortedItems = useMemo(() => {
    if (!items) return [];

    let filtered = [...items];

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.type.toLowerCase().includes(query) ||
          item.unit.toLowerCase().includes(query)
      );
    }

    // Filtrar por tipo
    if (typeFilter && typeFilter !== "all") {
      filtered = filtered.filter((item) => item.type === typeFilter);
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "quantity-asc":
          return a.quantity - b.quantity;
        case "quantity-desc":
          return b.quantity - a.quantity;
        case "type-asc":
          return a.type.localeCompare(b.type);
        case "type-desc":
          return b.type.localeCompare(a.type);
        default:
          return 0;
      }
    });

    return filtered;
  }, [items, searchQuery, typeFilter, sortBy]);

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
                    Inventario
                  </Title>
                  <Text c="dimmed" size="sm">
                    Gestiona todos los items del inventario
                  </Text>
                </div>
                <Button
                  leftSection={<IconPlus size={20} />}
                  onClick={() => handleOpenModal()}
                  size="md"
                >
                  Agregar Item
                </Button>
              </Group>
            </Card>

            {/* Filtros y Búsqueda */}
            <Card shadow="sm" padding="lg" radius="md" className="bg-white">
              <Grid>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    placeholder="Buscar por nombre, tipo o unidad..."
                    leftSection={<IconSearch size={16} />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.currentTarget.value)}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <Select
                    placeholder="Filtrar por tipo"
                    clearable
                    value={typeFilter}
                    onChange={setTypeFilter}
                    data={[
                      { value: "all", label: "Todos los tipos" },
                      ...(types?.map((type) => ({ value: type, label: type })) || []),
                    ]}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <Select
                    placeholder="Ordenar por"
                    value={sortBy}
                    onChange={(value) => setSortBy(value || "name-asc")}
                    data={[
                      { value: "name-asc", label: "Nombre (A-Z)" },
                      { value: "name-desc", label: "Nombre (Z-A)" },
                      { value: "quantity-asc", label: "Stock menor" },
                      { value: "quantity-desc", label: "Stock mayor" },
                      { value: "type-asc", label: "Tipo (A-Z)" },
                      { value: "type-desc", label: "Tipo (Z-A)" },
                    ]}
                  />
                </Grid.Col>
              </Grid>
            </Card>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAndSortedItems && filteredAndSortedItems.length > 0 ? (
                filteredAndSortedItems.map((item) => (
                  <Card
                    key={item.id}
                    shadow="sm"
                    padding="lg"
                    radius="md"
                    withBorder
                    className="bg-white hover:shadow-lg transition-shadow"
                  >
                    <Card.Section>
                      <Image
                        src={item.imageUrl || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsnstZz_dVqG5A3vcpAdtB-cGp8u01zQnG7A&s"}
                        height={160}
                        alt={item.name}
                        fit="cover"
                      />
                    </Card.Section>

                    <Stack gap="xs" mt="md">
                      <div>
                        <Text fw={600} size="lg" lineClamp={1}>
                          {item.name}
                        </Text>
                        <Badge size="sm" variant="light" color="blue">
                          {item.type}
                        </Badge>
                      </div>

                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">
                          Stock:
                        </Text>
                        <Badge color={getStockStatusColor(item.quantity)} variant="filled">
                          {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                        </Badge>
                      </Group>

                      <Group justify="space-between" mt="md">
                        <ActionIcon.Group>
                          <ActionIcon
                            variant="light"
                            color="indigo"
                            onClick={() => handleViewDetails(item)}
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() => handleOpenModal(item.id)}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => handleDelete(item.id)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </ActionIcon.Group>
                        
                        <ActionIcon
                          variant="filled"
                          color="green"
                          size="lg"
                          onClick={() => handleOpenAdjustment(item.id)}
                        >
                          <IconAdjustments size={18} />
                        </ActionIcon>
                      </Group>
                    </Stack>
                  </Card>
                ))
              ) : (
                <div className="col-span-full">
                  <Center className="py-12">
                    <Stack align="center" gap="md">
                      <IconPackage
                        size={48}
                        className="text-gray-400"
                        stroke={1.5}
                      />
                      <div className="text-center">
                        <Text size="lg" fw={500} c="dimmed">
                          No hay items en el inventario
                        </Text>
                        <Text size="sm" c="dimmed">
                          Comienza agregando tu primer item
                        </Text>
                      </div>
                      <Button
                        leftSection={<IconPlus size={20} />}
                        onClick={() => handleOpenModal()}
                      >
                        Agregar Primer Item
                      </Button>
                    </Stack>
                  </Center>
                </div>
              )}
            </div>
          </Stack>
        </div>
      </div>

      {/* Modal de Agregar/Editar Item */}
      <Modal
        opened={opened}
        onClose={handleCloseModal}
        title={
          <Title order={3}>
            {editingId ? "Editar Item" : "Agregar Nuevo Item"}
          </Title>
        }
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            {/* Ejemplo de ayuda */}
            {!editingId && (
              <Paper p="sm" withBorder radius="md" className="bg-blue-50">
                <Text size="xs" fw={600} c="blue" mb={4}>
                  💡 Ejemplos de cómo llenar:
                </Text>
                <Text size="xs" c="dimmed">
                  <strong>Opción 1 - Solo nombre y cantidad:</strong>
                  <br />
                  Nombre: <code>Sillas plegables</code> + Cantidad: 30 → Resultado: <strong>&quot;30&quot;</strong>
                  <br />
                  <em>(El nombre ya indica que son sillas)</em>
                  <br />
                  <br />
                  <strong>Opción 2 - Con unidad específica:</strong>
                  <br />
                  Nombre: <code>Vigas de acero</code> + Unidad: <code>vigas de 10mt</code> + Cantidad: 40
                  <br />
                  → Resultado: <strong>&quot;40 vigas de 10mt&quot;</strong>
                  <br />
                  <br />
                  <strong>Opción 3 - Medidas:</strong>
                  <br />
                  Nombre: <code>Tela blanca</code> + Unidad: <code>metros</code> + Cantidad: 100
                  <br />
                  → Resultado: <strong>&quot;100 metros&quot;</strong>
                </Text>
              </Paper>
            )}

            <TextInput
              label="Nombre del Item"
              placeholder="Ej: Vigas de acero, Carpa 10x10, Sillas plegables"
              required
              leftSection={<IconPackage size={16} />}
              {...form.getInputProps("name")}
            />

            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Tipo / Categoría"
                  placeholder="Carpa, Silla, Mesa, Estructura, etc."
                  required
                  leftSection={<IconBox size={16} />}
                  {...form.getInputProps("type")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Unidad de Medida (Opcional)"
                  placeholder="Dejar vacío si el nombre ya lo indica"
                  leftSection={<IconRuler size={16} />}
                  description="Ej: 'vigas de 10mt', 'metros', 'kg'. Solo si necesitas especificar."
                  {...form.getInputProps("unit")}
                />
              </Grid.Col>
            </Grid>

            <NumberInput
              label="Cantidad"
              placeholder="0"
              required
              min={0}
              description="Cuántos tienes de este item"
              {...form.getInputProps("quantity")}
            />

            {/* Vista previa */}
            {form.values.quantity > 0 && (
              <Paper p="md" withBorder radius="md" className="bg-green-50">
                <Text size="sm" fw={600} c="green" mb="xs">
                  ✓ Stock se mostrará como:
                </Text>
                <Text size="lg" fw={700} c="green.8">
                  {form.values.quantity}{form.values.unit ? ` ${form.values.unit}` : ''}
                </Text>
                {!form.values.unit && (
                  <Text size="xs" c="dimmed" mt="xs">
                    Solo el número (el nombre del item ya indica qué es)
                  </Text>
                )}
              </Paper>
            )}

            <TextInput
              label="URL de Imagen (opcional)"
              placeholder="https://ejemplo.com/imagen.jpg"
              leftSection={<IconPhoto size={16} />}
              {...form.getInputProps("imageUrl")}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={createItem.isPending || updateItem.isPending}
              >
                {editingId ? "Actualizar Item" : "Crear Item"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal de Ajuste de Stock */}
      <Modal
        opened={adjustmentOpened}
        onClose={() => {
          setAdjustmentOpened(false);
          setAdjustingItemId(null);
          adjustmentForm.reset();
        }}
        title={<Title order={3}>Ajustar Stock</Title>}
        size="md"
      >
        <form onSubmit={adjustmentForm.onSubmit(handleAdjustStock)}>
          <Stack gap="md">
            <Select
              label="Tipo de Movimiento"
              placeholder="Selecciona el tipo"
              required
              data={[
                { value: "IN", label: "Entrada (Agregar stock)" },
                { value: "OUT", label: "Salida (Reducir stock)" },
                { value: "ADJUSTMENT", label: "Ajuste (Establecer cantidad)" },
              ]}
              {...adjustmentForm.getInputProps("type")}
            />

            <NumberInput
              label="Cantidad"
              placeholder="0"
              required
              min={0}
              {...adjustmentForm.getInputProps("quantity")}
            />

            <Textarea
              label="Motivo (opcional)"
              placeholder="Compra, venta, rotura, ajuste de inventario, etc."
              minRows={2}
              {...adjustmentForm.getInputProps("reason")}
            />

            <Group justify="flex-end" mt="md">
              <Button
                variant="subtle"
                onClick={() => {
                  setAdjustmentOpened(false);
                  setAdjustingItemId(null);
                  adjustmentForm.reset();
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={adjustStock.isPending}
                color="green"
              >
                Ajustar Stock
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal de Detalles del Item */}
      <Modal
        opened={detailsOpened}
        onClose={() => setDetailsOpened(false)}
        title={
          <Group>
            <ThemeIcon size="lg" radius="md" color="indigo" variant="light">
              <IconPackage size={20} />
            </ThemeIcon>
            <Title order={3}>Detalles del Item</Title>
          </Group>
        }
        size="lg"
      >
        {selectedItem && (
          <ScrollArea h={500}>
            <Stack gap="lg">
              {/* Imagen */}
              <Card withBorder>
                <Image
                  src={selectedItem.imageUrl || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsnstZz_dVqG5A3vcpAdtB-cGp8u01zQnG7A&s"}
                  height={250}
                  fit="cover"
                  radius="md"
                />
              </Card>

              {/* Información Básica */}
              <Paper p="md" withBorder radius="md" className="bg-gray-50">
                <Stack gap="md">
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      Nombre
                    </Text>
                    <Text size="xl" fw={700}>
                      {selectedItem.name}
                    </Text>
                  </div>

                  <Grid>
                    <Grid.Col span={6}>
                      <div>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                          Tipo
                        </Text>
                        <Badge size="lg" variant="filled" color="blue">
                          {selectedItem.type}
                        </Badge>
                      </div>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <div>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                          Unidad
                        </Text>
                        <Text size="md" fw={500} c={selectedItem.unit ? undefined : "dimmed"}>
                          {selectedItem.unit || "(Sin especificar)"}
                        </Text>
                      </div>
                    </Grid.Col>
                  </Grid>

                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="xs">
                      Stock Actual
                    </Text>
                    <Badge
                      size="xl"
                      color={getStockStatusColor(selectedItem.quantity)}
                      variant="filled"
                    >
                      {selectedItem.quantity}{selectedItem.unit ? ` ${selectedItem.unit}` : ''}
                    </Badge>
                  </div>
                </Stack>
              </Paper>

              {/* Estadísticas */}
              <Paper p="md" withBorder radius="md" className="bg-gray-50">
                <Text fw={600} size="lg" mb="md">
                  Estadísticas
                </Text>
                <Grid>
                  <Grid.Col span={4}>
                    <div className="text-center">
                      <Text size="xs" c="dimmed" tt="uppercase">
                        Eventos
                      </Text>
                      <Text size="xl" fw={700} c="blue">
                        {selectedItem._count?.EventItem || 0}
                      </Text>
                    </div>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <div className="text-center">
                      <Text size="xs" c="dimmed" tt="uppercase">
                        Movimientos
                      </Text>
                      <Text size="xl" fw={700} c="green">
                        {selectedItem._count?.movements || 0}
                      </Text>
                    </div>
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <div className="text-center">
                      <Text size="xs" c="dimmed" tt="uppercase">
                        Reservas
                      </Text>
                      <Text size="xl" fw={700} c="orange">
                        {selectedItem._count?.reservations || 0}
                      </Text>
                    </div>
                  </Grid.Col>
                </Grid>
              </Paper>

              {/* Botones de Acción */}
              <Group justify="flex-end" mt="md">
                <Button
                  variant="light"
                  color="green"
                  onClick={() => {
                    setDetailsOpened(false);
                    handleOpenAdjustment(selectedItem.id);
                  }}
                  leftSection={<IconAdjustments size={16} />}
                >
                  Ajustar Stock
                </Button>
                <Button
                  variant="light"
                  onClick={() => {
                    setDetailsOpened(false);
                    handleOpenModal(selectedItem.id);
                  }}
                  leftSection={<IconEdit size={16} />}
                >
                  Editar Item
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

