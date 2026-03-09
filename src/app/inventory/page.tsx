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
  Tooltip,
  SimpleGrid,
  Divider,
  Alert,
} from "@mantine/core";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconPackage,
  IconSearch,
  IconEye,
  IconAdjustments,
  IconPhoto,
  IconBox,
  IconRuler,
  IconAlertTriangle,
  IconCircleCheck,
  IconArrowUp,
  IconArrowDown,
  IconRefresh,
  IconFilter,
  IconLayoutGrid,
  IconList,
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
  const [adjustingItem, setAdjustingItem] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name-asc");

  const { data: items, isLoading, refetch } = api.inventory.getAll.useQuery();
  const { data: types } = api.inventory.getTypes.useQuery();
  const createItem = api.inventory.create.useMutation();
  const updateItem = api.inventory.update.useMutation();
  const deleteItem = api.inventory.delete.useMutation();
  const adjustStock = api.inventory.adjustStock.useMutation();

  const form = useForm<ItemFormValues>({
    initialValues: { name: "", type: "", quantity: 0, unit: "", imageUrl: "" },
    validate: {
      name: (value) => (value.trim().length > 0 ? null : "El nombre es requerido"),
      type: (value) => (value.trim().length > 0 ? null : "El tipo es requerido"),
      quantity: (value) => (value >= 0 ? null : "La cantidad debe ser mayor o igual a 0"),
    },
  });

  const adjustmentForm = useForm<StockAdjustmentFormValues>({
    initialValues: { quantity: 0, type: "IN", reason: "" },
    validate: {
      quantity: (value) => (value > 0 ? null : "La cantidad debe ser mayor a 0"),
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
        await updateItem.mutateAsync({ id: editingId, ...values });
        notifications.show({ title: "Item actualizado", message: "Guardado exitosamente", color: "green" });
      } else {
        await createItem.mutateAsync(values);
        notifications.show({ title: "Item creado", message: "Agregado al inventario", color: "green" });
      }
      handleCloseModal();
      await refetch();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Ocurrió un error al guardar",
        color: "red",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este item?")) {
      try {
        await deleteItem.mutateAsync({ id });
        notifications.show({ title: "Item eliminado", message: "Eliminado del inventario", color: "green" });
        await refetch();
      } catch {
        notifications.show({ title: "Error", message: "No se pudo eliminar el item", color: "red" });
      }
    }
  };

  const handleViewDetails = (item: any) => {
    setSelectedItem(item);
    setDetailsOpened(true);
  };

  const handleOpenAdjustment = (item: any) => {
    setAdjustingItem(item);
    adjustmentForm.reset();
    setAdjustmentOpened(true);
  };

  const handleAdjustStock = async (values: StockAdjustmentFormValues) => {
    if (!adjustingItem) return;
    try {
      await adjustStock.mutateAsync({ id: adjustingItem.id, ...values });
      notifications.show({ title: "Stock actualizado", message: "El stock ha sido ajustado", color: "green" });
      setAdjustmentOpened(false);
      setAdjustingItem(null);
      adjustmentForm.reset();
      await refetch();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "No se pudo ajustar el stock",
        color: "red",
      });
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { color: "red", label: "Sin stock", icon: IconAlertTriangle };
    if (quantity < 10) return { color: "orange", label: "Stock bajo", icon: IconAlertTriangle };
    return { color: "green", label: "Disponible", icon: IconCircleCheck };
  };

  const stats = useMemo(() => {
    if (!items) return { total: 0, sinStock: 0, stockBajo: 0, disponibles: 0 };
    return {
      total: items.length,
      sinStock: items.filter((i) => i.quantity === 0).length,
      stockBajo: items.filter((i) => i.quantity > 0 && i.quantity < 10).length,
      disponibles: items.filter((i) => i.quantity >= 10).length,
    };
  }, [items]);

  const filteredAndSortedItems = useMemo(() => {
    if (!items) return [];
    let filtered = [...items];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q) ||
          item.unit.toLowerCase().includes(q)
      );
    }

    if (typeFilter && typeFilter !== "all") {
      filtered = filtered.filter((item) => item.type === typeFilter);
    }

    if (stockFilter === "sin-stock") filtered = filtered.filter((i) => i.quantity === 0);
    if (stockFilter === "stock-bajo") filtered = filtered.filter((i) => i.quantity > 0 && i.quantity < 10);
    if (stockFilter === "disponible") filtered = filtered.filter((i) => i.quantity >= 10);

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name-asc": return a.name.localeCompare(b.name);
        case "name-desc": return b.name.localeCompare(a.name);
        case "quantity-asc": return a.quantity - b.quantity;
        case "quantity-desc": return b.quantity - a.quantity;
        default: return 0;
      }
    });

    return filtered;
  }, [items, searchQuery, typeFilter, sortBy, stockFilter]);

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
          <Stack gap="lg">

            {/* Header */}
            <Group justify="space-between" align="center">
              <div>
                <Title order={1} className="text-gray-900">Inventario</Title>
                <Text c="dimmed" size="sm">
                  {stats.total} items registrados
                </Text>
              </div>
              <Button leftSection={<IconPlus size={18} />} onClick={() => handleOpenModal()} size="md">
                Agregar Item
              </Button>
            </Group>

            {/* Tarjetas de resumen */}
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
              <Card withBorder padding="md" radius="md">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total</Text>
                    <Text size="2xl" fw={800} className="text-3xl">{stats.total}</Text>
                  </div>
                  <ThemeIcon size="lg" variant="light" color="blue" radius="md">
                    <IconPackage size={20} />
                  </ThemeIcon>
                </Group>
                <Text size="xs" c="dimmed" mt="xs">items en inventario</Text>
              </Card>

              <Card withBorder padding="md" radius="md">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Disponibles</Text>
                    <Text size="2xl" fw={800} c="green" className="text-3xl">{stats.disponibles}</Text>
                  </div>
                  <ThemeIcon size="lg" variant="light" color="green" radius="md">
                    <IconCircleCheck size={20} />
                  </ThemeIcon>
                </Group>
                <Text size="xs" c="dimmed" mt="xs">con stock suficiente</Text>
              </Card>

              <Card withBorder padding="md" radius="md">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Stock Bajo</Text>
                    <Text size="2xl" fw={800} c="orange" className="text-3xl">{stats.stockBajo}</Text>
                  </div>
                  <ThemeIcon size="lg" variant="light" color="orange" radius="md">
                    <IconAlertTriangle size={20} />
                  </ThemeIcon>
                </Group>
                <Text size="xs" c="dimmed" mt="xs">menos de 10 unidades</Text>
              </Card>

              <Card withBorder padding="md" radius="md">
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Sin Stock</Text>
                    <Text size="2xl" fw={800} c="red" className="text-3xl">{stats.sinStock}</Text>
                  </div>
                  <ThemeIcon size="lg" variant="light" color="red" radius="md">
                    <IconAlertTriangle size={20} />
                  </ThemeIcon>
                </Group>
                <Text size="xs" c="dimmed" mt="xs">requieren reposición</Text>
              </Card>
            </SimpleGrid>

            {/* Alerta de stock bajo/sin stock */}
            {(stats.sinStock > 0 || stats.stockBajo > 0) && (
              <Alert
                icon={<IconAlertTriangle size={18} />}
                color="orange"
                variant="light"
                title="Atención: Items con stock bajo"
              >
                {stats.sinStock > 0 && (
                  <Text size="sm">{stats.sinStock} item(s) <strong>sin stock</strong> — requieren reposición urgente.</Text>
                )}
                {stats.stockBajo > 0 && (
                  <Text size="sm">{stats.stockBajo} item(s) con <strong>menos de 10 unidades</strong> disponibles.</Text>
                )}
              </Alert>
            )}

            {/* Filtros */}
            <Card withBorder padding="md" radius="md">
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text fw={600} size="sm">Filtrar y buscar</Text>
                  <Group gap="xs">
                    <Tooltip label="Vista en grilla">
                      <ActionIcon
                        variant={viewMode === "grid" ? "filled" : "subtle"}
                        color="blue"
                        onClick={() => setViewMode("grid")}
                      >
                        <IconLayoutGrid size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Vista en lista">
                      <ActionIcon
                        variant={viewMode === "list" ? "filled" : "subtle"}
                        color="blue"
                        onClick={() => setViewMode("list")}
                      >
                        <IconList size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Group>

                <Grid>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput
                      placeholder="Buscar por nombre, tipo o unidad..."
                      leftSection={<IconSearch size={16} />}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.currentTarget.value)}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <Select
                      placeholder="Filtrar por categoría"
                      clearable
                      leftSection={<IconFilter size={16} />}
                      value={typeFilter}
                      onChange={setTypeFilter}
                      data={[
                        { value: "all", label: "Todas las categorías" },
                        ...(types?.map((type) => ({ value: type, label: type })) || []),
                      ]}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <Select
                      placeholder="Ordenar por"
                      value={sortBy}
                      onChange={(value) => setSortBy(value || "name-asc")}
                      data={[
                        { value: "name-asc", label: "Nombre (A-Z)" },
                        { value: "name-desc", label: "Nombre (Z-A)" },
                        { value: "quantity-asc", label: "Menor stock primero" },
                        { value: "quantity-desc", label: "Mayor stock primero" },
                      ]}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 2 }}>
                    <Select
                      placeholder="Estado"
                      value={stockFilter}
                      onChange={(value) => setStockFilter(value || "all")}
                      data={[
                        { value: "all", label: "Todos" },
                        { value: "disponible", label: "Disponibles" },
                        { value: "stock-bajo", label: "Stock bajo" },
                        { value: "sin-stock", label: "Sin stock" },
                      ]}
                    />
                  </Grid.Col>
                </Grid>

                {(searchQuery || typeFilter || stockFilter !== "all") && (
                  <Group gap="xs">
                    <Text size="sm" c="dimmed">
                      {filteredAndSortedItems.length} resultado(s)
                    </Text>
                    <Button
                      size="xs"
                      variant="subtle"
                      leftSection={<IconRefresh size={12} />}
                      onClick={() => { setSearchQuery(""); setTypeFilter(null); setStockFilter("all"); }}
                    >
                      Limpiar filtros
                    </Button>
                  </Group>
                )}
              </Stack>
            </Card>

            {/* Lista de items */}
            {filteredAndSortedItems.length === 0 ? (
              <Center className="py-16">
                <Stack align="center" gap="md">
                  <IconPackage size={56} stroke={1.2} className="text-gray-300" />
                  <div className="text-center">
                    <Text size="lg" fw={500} c="dimmed">No se encontraron items</Text>
                    <Text size="sm" c="dimmed">
                      {searchQuery || typeFilter || stockFilter !== "all"
                        ? "Intenta con otros filtros"
                        : "Comienza agregando tu primer item al inventario"}
                    </Text>
                  </div>
                  {!searchQuery && !typeFilter && stockFilter === "all" && (
                    <Button leftSection={<IconPlus size={16} />} onClick={() => handleOpenModal()}>
                      Agregar Primer Item
                    </Button>
                  )}
                </Stack>
              </Center>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredAndSortedItems.map((item) => {
                  const stockStatus = getStockStatus(item.quantity);
                  return (
                    <Card
                      key={item.id}
                      shadow="sm"
                      padding="0"
                      radius="md"
                      withBorder
                      className="bg-white hover:shadow-md transition-shadow overflow-hidden"
                    >
                      {/* Imagen */}
                      <div className="relative">
                        <Image
                          src={item.imageUrl || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsnstZz_dVqG5A3vcpAdtB-cGp8u01zQnG7A&s"}
                          height={150}
                          alt={item.name}
                          fit="cover"
                        />
                        {/* Badge de estado flotante */}
                        <div className="absolute top-2 right-2">
                          <Badge
                            color={stockStatus.color}
                            variant="filled"
                            size="sm"
                          >
                            {stockStatus.label}
                          </Badge>
                        </div>
                      </div>

                      <div className="p-4">
                        <Stack gap="sm">
                          {/* Nombre y categoría */}
                          <div>
                            <Text fw={700} size="md" lineClamp={1}>{item.name}</Text>
                            <Badge size="xs" variant="light" color="blue" mt={4}>{item.type}</Badge>
                          </div>

                          {/* Stock actual */}
                          <Group gap="sm" align="center">
                            <ThemeIcon
                              size="lg"
                              radius="xl"
                              color={stockStatus.color}
                              variant="light"
                            >
                              <stockStatus.icon size={16} />
                            </ThemeIcon>
                            <div>
                              <Text size="xs" c="dimmed">Tienes disponible:</Text>
                              <Text fw={800} size="lg" c={item.quantity === 0 ? "red" : item.quantity < 10 ? "orange" : "green"}>
                                {item.quantity === 0
                                  ? "Sin stock"
                                  : `${item.quantity}${item.unit ? ` ${item.unit}` : " unidades"}`}
                              </Text>
                            </div>
                          </Group>

                          {/* Acciones */}
                          <Divider />
                          <Group justify="space-between">
                            <Group gap={4}>
                              <Tooltip label="Ver detalles">
                                <ActionIcon variant="subtle" color="gray" onClick={() => handleViewDetails(item)}>
                                  <IconEye size={16} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Editar item">
                                <ActionIcon variant="subtle" color="blue" onClick={() => handleOpenModal(item.id)}>
                                  <IconEdit size={16} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Eliminar item">
                                <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(item.id)}>
                                  <IconTrash size={16} />
                                </ActionIcon>
                              </Tooltip>
                            </Group>
                            <Button
                              size="xs"
                              variant="light"
                              color="green"
                              leftSection={<IconAdjustments size={14} />}
                              onClick={() => handleOpenAdjustment(item)}
                            >
                              Ajustar
                            </Button>
                          </Group>
                        </Stack>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              /* Vista lista */
              <Stack gap="sm">
                {filteredAndSortedItems.map((item) => {
                  const stockStatus = getStockStatus(item.quantity);
                  return (
                    <Card key={item.id} withBorder padding="md" radius="md" className="hover:shadow-sm transition-shadow">
                      <Group justify="space-between" align="center">
                        <Group gap="md">
                          <Image
                            src={item.imageUrl || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsnstZz_dVqG5A3vcpAdtB-cGp8u01zQnG7A&s"}
                            w={56}
                            h={56}
                            radius="sm"
                            fit="cover"
                            alt={item.name}
                          />
                          <div>
                            <Text fw={700}>{item.name}</Text>
                            <Group gap="xs" mt={2}>
                              <Badge size="xs" variant="light" color="blue">{item.type}</Badge>
                              <Badge size="xs" color={stockStatus.color} variant="dot">
                                {stockStatus.label}
                              </Badge>
                            </Group>
                          </div>
                        </Group>

                        <Group gap="xl" align="center">
                          <div className="text-right">
                            <Text size="xs" c="dimmed">Disponible</Text>
                            <Text fw={700} c={stockStatus.color}>
                              {item.quantity === 0
                                ? "Sin stock"
                                : `${item.quantity}${item.unit ? ` ${item.unit}` : " uds."}`}
                            </Text>
                          </div>

                          <Group gap={4}>
                            <Tooltip label="Ver detalles">
                              <ActionIcon variant="subtle" color="gray" onClick={() => handleViewDetails(item)}>
                                <IconEye size={16} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Editar">
                              <ActionIcon variant="subtle" color="blue" onClick={() => handleOpenModal(item.id)}>
                                <IconEdit size={16} />
                              </ActionIcon>
                            </Tooltip>
                            <Button
                              size="xs"
                              variant="light"
                              color="green"
                              leftSection={<IconAdjustments size={14} />}
                              onClick={() => handleOpenAdjustment(item)}
                            >
                              Ajustar stock
                            </Button>
                            <Tooltip label="Eliminar">
                              <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(item.id)}>
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Group>
                      </Group>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </Stack>
        </div>
      </div>

      {/* Modal Agregar/Editar */}
      <Modal
        opened={opened}
        onClose={handleCloseModal}
        title={<Title order={3}>{editingId ? "Editar Item" : "Agregar Nuevo Item"}</Title>}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="¿Cómo se llama este item?"
              placeholder="Ej: Sillas plegables, Carpa 10x10, Tela negra, Vigas de acero"
              required
              leftSection={<IconPackage size={16} />}
              description='El nombre completo del producto o material'
              {...form.getInputProps("name")}
            />

            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Categoría"
                  placeholder="Carpa, Silla, Mesa, Tela, Estructura..."
                  required
                  leftSection={<IconBox size={16} />}
                  description="Para agrupar items del mismo tipo"
                  {...form.getInputProps("type")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="¿En qué se mide? (opcional)"
                  placeholder="metros, kg, rollos de 10mt, unidades..."
                  leftSection={<IconRuler size={16} />}
                  description='Dejar vacío si se cuenta por unidades (sillas, mesas, carpas...)'
                  {...form.getInputProps("unit")}
                />
              </Grid.Col>
            </Grid>

            <NumberInput
              label="¿Cuántos tienes ahora?"
              placeholder="0"
              required
              min={0}
              {...form.getInputProps("quantity")}
            />

            {/* Vista previa en lenguaje natural */}
            {form.values.name && (
              <Paper p="md" withBorder radius="md" bg={form.values.quantity === 0 ? "red.0" : "green.0"}>
                <Text size="xs" fw={600} c={form.values.quantity === 0 ? "red" : "green"} mb={6}>
                  Así se verá en el inventario:
                </Text>
                <Group gap="xs" align="center">
                  <ThemeIcon size="sm" color={form.values.quantity === 0 ? "red" : "green"} variant="light" radius="xl">
                    <IconPackage size={12} />
                  </ThemeIcon>
                  <Text fw={700} c={form.values.quantity === 0 ? "red" : "green.8"}>
                    {form.values.name || "..."}
                  </Text>
                  <Text c="dimmed" size="sm">—</Text>
                  <Text fw={600} c={form.values.quantity === 0 ? "red" : "green.8"}>
                    {form.values.quantity === 0
                      ? "Sin stock"
                      : `${form.values.quantity}${form.values.unit ? ` ${form.values.unit}` : " unidades"} disponibles`}
                  </Text>
                </Group>
              </Paper>
            )}

            <TextInput
              label="URL de Imagen (opcional)"
              placeholder="https://ejemplo.com/imagen.jpg"
              leftSection={<IconPhoto size={16} />}
              {...form.getInputProps("imageUrl")}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={handleCloseModal}>Cancelar</Button>
              <Button type="submit" loading={createItem.isPending || updateItem.isPending}>
                {editingId ? "Guardar cambios" : "Agregar al inventario"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal Ajustar Stock */}
      <Modal
        opened={adjustmentOpened}
        onClose={() => { setAdjustmentOpened(false); setAdjustingItem(null); adjustmentForm.reset(); }}
        title={
          <Group gap="sm">
            <ThemeIcon size="md" color="green" variant="light" radius="md">
              <IconAdjustments size={18} />
            </ThemeIcon>
            <div>
              <Title order={4}>Ajustar Stock</Title>
              {adjustingItem && <Text size="xs" c="dimmed">{adjustingItem.name}</Text>}
            </div>
          </Group>
        }
        size="md"
      >
        {adjustingItem && (
          <Paper withBorder p="sm" radius="md" mb="md" className={
            adjustingItem.quantity === 0 ? "bg-red-50" :
            adjustingItem.quantity < 10 ? "bg-orange-50" : "bg-green-50"
          }>
            <Text size="xs" c="dimmed">Stock actual</Text>
            <Text fw={700} size="lg" c={getStockStatus(adjustingItem.quantity).color}>
              {adjustingItem.quantity}{adjustingItem.unit ? ` ${adjustingItem.unit}` : ""}
            </Text>
          </Paper>
        )}

        <form onSubmit={adjustmentForm.onSubmit(handleAdjustStock)}>
          <Stack gap="md">
            <div>
              <Text size="sm" fw={500} mb="xs">¿Qué tipo de movimiento es?</Text>
              <SimpleGrid cols={3}>
                {[
                  { value: "IN", label: "Entrada", desc: "Agregar al stock", color: "green", icon: IconArrowUp },
                  { value: "OUT", label: "Salida", desc: "Restar del stock", color: "red", icon: IconArrowDown },
                  { value: "ADJUSTMENT", label: "Corrección", desc: "Establecer cantidad exacta", color: "blue", icon: IconRefresh },
                ].map(({ value, label, desc, color, icon: Icon }) => (
                  <Paper
                    key={value}
                    withBorder
                    p="sm"
                    radius="md"
                    className={`cursor-pointer transition-all ${adjustmentForm.values.type === value ? `border-${color}-400 bg-${color}-50` : "hover:bg-gray-50"}`}
                    style={{
                      borderWidth: adjustmentForm.values.type === value ? 2 : 1,
                      borderColor: adjustmentForm.values.type === value ?
                        (color === "green" ? "#22c55e" : color === "red" ? "#ef4444" : "#3b82f6") : undefined,
                    }}
                    onClick={() => adjustmentForm.setFieldValue("type", value as "IN" | "OUT" | "ADJUSTMENT")}
                  >
                    <Stack gap={4} align="center">
                      <ThemeIcon size="md" color={color} variant="light" radius="md">
                        <Icon size={16} />
                      </ThemeIcon>
                      <Text size="xs" fw={700} ta="center">{label}</Text>
                      <Text size="xs" c="dimmed" ta="center" style={{ fontSize: 10 }}>{desc}</Text>
                    </Stack>
                  </Paper>
                ))}
              </SimpleGrid>
            </div>

            <NumberInput
              label={
                adjustmentForm.values.type === "IN" ? "¿Cuántas unidades entran?" :
                adjustmentForm.values.type === "OUT" ? "¿Cuántas unidades salen?" :
                "¿Cuál es la cantidad correcta?"
              }
              placeholder="0"
              required
              min={1}
              {...adjustmentForm.getInputProps("quantity")}
            />

            <Textarea
              label="Motivo (opcional)"
              placeholder="Ej: Compra de materiales, Evento del 15/03, Ajuste de inventario..."
              minRows={2}
              {...adjustmentForm.getInputProps("reason")}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={() => { setAdjustmentOpened(false); setAdjustingItem(null); adjustmentForm.reset(); }}>
                Cancelar
              </Button>
              <Button type="submit" loading={adjustStock.isPending} color="green">
                Confirmar ajuste
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Modal Detalles */}
      <Modal
        opened={detailsOpened}
        onClose={() => setDetailsOpened(false)}
        title={
          <Group gap="sm">
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
              <Image
                src={selectedItem.imageUrl || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsnstZz_dVqG5A3vcpAdtB-cGp8u01zQnG7A&s"}
                height={220}
                fit="cover"
                radius="md"
                alt={selectedItem.name}
              />

              <Paper withBorder p="md" radius="md">
                <Stack gap="md">
                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Nombre</Text>
                    <Text size="xl" fw={700}>{selectedItem.name}</Text>
                  </div>

                  <Grid>
                    <Grid.Col span={6}>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Categoría</Text>
                      <Badge size="lg" variant="filled" color="blue" mt={4}>{selectedItem.type}</Badge>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Unidad</Text>
                      <Text size="md" fw={500} c={selectedItem.unit ? undefined : "dimmed"} mt={4}>
                        {selectedItem.unit || "Sin especificar"}
                      </Text>
                    </Grid.Col>
                  </Grid>

                  <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="xs">Stock Actual</Text>
                    <Group gap="sm" align="center">
                      <Badge
                        size="xl"
                        color={getStockStatus(selectedItem.quantity).color}
                        variant="filled"
                      >
                        {selectedItem.quantity}{selectedItem.unit ? ` ${selectedItem.unit}` : ""}
                      </Badge>
                      <Badge variant="light" color={getStockStatus(selectedItem.quantity).color}>
                        {getStockStatus(selectedItem.quantity).label}
                      </Badge>
                    </Group>
                  </div>
                </Stack>
              </Paper>

              <SimpleGrid cols={3}>
                {[
                  { label: "Eventos", value: selectedItem._count?.EventItem || 0, color: "blue" },
                  { label: "Movimientos", value: selectedItem._count?.movements || 0, color: "green" },
                  { label: "Reservas", value: selectedItem._count?.reservations || 0, color: "orange" },
                ].map(({ label, value, color }) => (
                  <Paper key={label} withBorder p="md" radius="md" className="text-center">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{label}</Text>
                    <Text size="2xl" fw={800} c={color} className="text-3xl">{value}</Text>
                  </Paper>
                ))}
              </SimpleGrid>

              <Group justify="flex-end" mt="md">
                <Button
                  variant="light"
                  color="green"
                  leftSection={<IconAdjustments size={16} />}
                  onClick={() => { setDetailsOpened(false); handleOpenAdjustment(selectedItem); }}
                >
                  Ajustar Stock
                </Button>
                <Button
                  variant="light"
                  leftSection={<IconEdit size={16} />}
                  onClick={() => { setDetailsOpened(false); handleOpenModal(selectedItem.id); }}
                >
                  Editar
                </Button>
                <Button variant="subtle" onClick={() => setDetailsOpened(false)}>Cerrar</Button>
              </Group>
            </Stack>
          </ScrollArea>
        )}
      </Modal>
    </MainLayout>
  );
}
