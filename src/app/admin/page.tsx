"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MainLayout from "../_components/main-layout";
import {
  Card,
  Text,
  Button,
  Stack,
  Title,
  Badge,
  Group,
  ActionIcon,
  Loader,
  Center,
  Tabs,
  Table,
  Select,
  Modal,
  NumberInput,
  Switch,
  Paper,
  ThemeIcon,
  SimpleGrid,
  ScrollArea,
  Avatar,
} from "@mantine/core";
import {
  IconShield,
  IconUsers,
  IconBell,
  IconTrash,
  IconUserEdit,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconChartBar,
  IconClock,
  IconUser,
  IconTestPipe,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { api } from "~/trpc/react";

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string | null>("users");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [daysToClean, setDaysToClean] = useState(30);
  const [onlyReadClean, setOnlyReadClean] = useState(true);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [cleanModalOpened, setCleanModalOpened] = useState(false);

  const { data: isAdmin, isLoading: checkingAdmin } = api.admin.isAdmin.useQuery();
  const { data: users, refetch: refetchUsers } = api.admin.getAllUsers.useQuery(undefined, {
    enabled: !!isAdmin,
  });
  const { data: userStats } = api.admin.getUserStats.useQuery(undefined, {
    enabled: !!isAdmin,
  });
  const { data: allNotifications, refetch: refetchNotifications } = api.admin.getAllNotifications.useQuery(
    { limit: 200 },
    { enabled: !!isAdmin }
  );
  const { data: notificationStats } = api.admin.getNotificationStats.useQuery(undefined, {
    enabled: !!isAdmin,
  });

  const updateUserRole = api.admin.updateUserRole.useMutation({
    onSuccess: () => {
      notifications.show({
        title: "Rol actualizado",
        message: "El rol del usuario ha sido actualizado exitosamente",
        color: "green",
      });
      setEditingUserId(null);
      refetchUsers();
    },
    onError: (error) => {
      notifications.show({
        title: "Error",
        message: error.message,
        color: "red",
      });
    },
  });

  const deleteUser = api.admin.deleteUser.useMutation({
    onSuccess: () => {
      notifications.show({
        title: "Usuario eliminado",
        message: "El usuario ha sido eliminado del sistema",
        color: "green",
      });
      setDeleteModalOpened(false);
      setUserToDelete(null);
      refetchUsers();
    },
    onError: (error) => {
      notifications.show({
        title: "Error",
        message: error.message,
        color: "red",
      });
    },
  });

  const cleanOldNotifications = api.admin.cleanOldNotifications.useMutation({
    onSuccess: (data) => {
      notifications.show({
        title: "Limpieza completada",
        message: data.message,
        color: "green",
      });
      setCleanModalOpened(false);
      refetchNotifications();
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Ocurrió un error al limpiar las notificaciones",
        color: "red",
      });
    },
  });

  const deleteAllRead = api.admin.deleteAllReadNotifications.useMutation({
    onSuccess: (data) => {
      notifications.show({
        title: "Notificaciones eliminadas",
        message: data.message,
        color: "green",
      });
      refetchNotifications();
    },
  });

  const deleteNotification = api.admin.deleteNotification.useMutation({
    onSuccess: () => {
      notifications.show({
        title: "Notificación eliminada",
        message: "",
        color: "green",
      });
      refetchNotifications();
    },
  });

  const markAllAsRead = api.admin.markAllNotificationsAsRead.useMutation({
    onSuccess: (data) => {
      notifications.show({
        title: "Notificaciones actualizadas",
        message: data.message,
        color: "green",
      });
      refetchNotifications();
    },
  });

  const testPushNotification = api.admin.testPushNotification.useMutation({
    onSuccess: (data) => {
      notifications.show({
        title: "✅ Notificación de prueba enviada",
        message: data.message,
        color: "green",
        icon: <IconCheck size={18} />,
      });
      refetchNotifications();
    },
    onError: (error) => {
      notifications.show({
        title: "Error",
        message: error.message || "No se pudo enviar la notificación de prueba",
        color: "red",
        icon: <IconX size={18} />,
      });
    },
  });

  if (status === "loading" || checkingAdmin) {
    return (
      <MainLayout>
        <Center className="h-64">
          <Loader size="lg" />
        </Center>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return (
      <MainLayout>
        <Center className="h-64">
          <Stack align="center" gap="md">
            <ThemeIcon size={80} radius="xl" color="red" variant="light">
              <IconAlertTriangle size={40} />
            </ThemeIcon>
            <Title order={2}>Acceso Denegado</Title>
            <Text c="dimmed">No tienes permisos para acceder al panel de administración</Text>
            <Button onClick={() => router.push("/dashboard")}>Volver al Dashboard</Button>
          </Stack>
        </Center>
      </MainLayout>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN": return "red";
      case "ADMIN": return "orange";
      case "MANAGER": return "blue";
      case "TECHNICIAN": return "cyan";
      case "SALES": return "green";
      case "WORKER": return "gray";
      default: return "gray";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <MainLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Stack gap="lg">
            {/* Header */}
            <Card shadow="sm" padding="lg" radius="md" className="bg-gradient-to-r from-red-500 to-pink-600">
              <Group justify="space-between" align="center">
                <div>
                  <Title order={1} className="text-white mb-2">
                    <Group gap="xs">
                      <IconShield size={32} />
                      Panel de Administración
                    </Group>
                  </Title>
                  <Text className="text-red-100" size="sm">
                    Gestión de usuarios y sistema
                  </Text>
                </div>
              </Group>
            </Card>

            {/* Tabs */}
            <Card shadow="sm" padding="lg" radius="md" className="bg-white">
              <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                  <Tabs.Tab value="users" leftSection={<IconUsers size={16} />}>
                    Usuarios ({users?.length || 0})
                  </Tabs.Tab>
                  <Tabs.Tab value="notifications" leftSection={<IconBell size={16} />}>
                    Notificaciones ({allNotifications?.length || 0})
                  </Tabs.Tab>
                  <Tabs.Tab value="stats" leftSection={<IconChartBar size={16} />}>
                    Estadísticas
                  </Tabs.Tab>
                </Tabs.List>

                {/* Tab de Usuarios */}
                <Tabs.Panel value="users" pt="md">
                  <ScrollArea h={600}>
                    <Table striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Usuario</Table.Th>
                          <Table.Th>Email</Table.Th>
                          <Table.Th>Rol</Table.Th>
                          <Table.Th>Eventos</Table.Th>
                          <Table.Th>Notificaciones</Table.Th>
                          <Table.Th>Acciones</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {users?.map((user) => (
                          <Table.Tr key={user.id}>
                            <Table.Td>
                              <Group gap="sm">
                                <Avatar src={user.image} radius="xl" size="sm" />
                                <div>
                                  <Text size="sm" fw={500}>
                                    {user.name}
                                  </Text>
                                  {session?.user?.id === user.id && (
                                    <Badge size="xs" color="blue">
                                      Tú
                                    </Badge>
                                  )}
                                </div>
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{user.email}</Text>
                            </Table.Td>
                            <Table.Td>
                              {editingUserId === user.id ? (
                                <Select
                                  size="xs"
                                  value={selectedRole}
                                  onChange={(value) => setSelectedRole(value || "")}
                                  data={[
                                    { value: "SUPER_ADMIN", label: "Super Admin" },
                                    { value: "ADMIN", label: "Admin" },
                                    { value: "MANAGER", label: "Manager" },
                                    { value: "TECHNICIAN", label: "Técnico" },
                                    { value: "SALES", label: "Ventas" },
                                    { value: "WORKER", label: "Trabajador" },
                                  ]}
                                  style={{ width: 150 }}
                                />
                              ) : (
                                <Badge color={getRoleBadgeColor(user.role)}>
                                  {user.role}
                                </Badge>
                              )}
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{user._count.events}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{user._count.notifications}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                {editingUserId === user.id ? (
                                  <>
                                    <ActionIcon
                                      color="green"
                                      variant="light"
                                      onClick={() => {
                                        updateUserRole.mutate({
                                          userId: user.id,
                                          role: selectedRole as any,
                                        });
                                      }}
                                      loading={updateUserRole.isPending}
                                    >
                                      <IconCheck size={16} />
                                    </ActionIcon>
                                    <ActionIcon
                                      color="red"
                                      variant="light"
                                      onClick={() => setEditingUserId(null)}
                                    >
                                      <IconX size={16} />
                                    </ActionIcon>
                                  </>
                                ) : (
                                  <>
                                    <ActionIcon
                                      color="blue"
                                      variant="light"
                                      onClick={() => {
                                        setEditingUserId(user.id);
                                        setSelectedRole(user.role);
                                      }}
                                    >
                                      <IconUserEdit size={16} />
                                    </ActionIcon>
                                    {session?.user?.id !== user.id && (
                                      <ActionIcon
                                        color="red"
                                        variant="light"
                                        onClick={() => {
                                          setUserToDelete(user.id);
                                          setDeleteModalOpened(true);
                                        }}
                                      >
                                        <IconTrash size={16} />
                                      </ActionIcon>
                                    )}
                                  </>
                                )}
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                </Tabs.Panel>

                {/* Tab de Notificaciones */}
                <Tabs.Panel value="notifications" pt="md">
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        Gestión de notificaciones del sistema
                      </Text>
                      <Group>
                        <Button
                          variant="filled"
                          color="teal"
                          leftSection={<IconTestPipe size={16} />}
                          onClick={() => testPushNotification.mutate({ sendToAll: true })}
                          loading={testPushNotification.isPending}
                        >
                          Enviar Prueba Push
                        </Button>
                        <Button
                          variant="light"
                          leftSection={<IconCheck size={16} />}
                          onClick={() => markAllAsRead.mutate()}
                          loading={markAllAsRead.isPending}
                        >
                          Marcar todas como leídas
                        </Button>
                        <Button
                          variant="light"
                          color="orange"
                          leftSection={<IconTrash size={16} />}
                          onClick={() => deleteAllRead.mutate()}
                          loading={deleteAllRead.isPending}
                        >
                          Eliminar leídas
                        </Button>
                        <Button
                          variant="light"
                          color="red"
                          leftSection={<IconAlertTriangle size={16} />}
                          onClick={() => setCleanModalOpened(true)}
                        >
                          Limpieza avanzada
                        </Button>
                      </Group>
                    </Group>

                    <ScrollArea h={500}>
                      <Table striped highlightOnHover>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Usuario</Table.Th>
                            <Table.Th>Título</Table.Th>
                            <Table.Th>Mensaje</Table.Th>
                            <Table.Th>Acción por</Table.Th>
                            <Table.Th>Fecha</Table.Th>
                            <Table.Th>Estado</Table.Th>
                            <Table.Th>Acción</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {allNotifications?.map((notif) => (
                            <Table.Tr key={notif.id}>
                              <Table.Td>
                                <Text size="xs">{notif.user.name}</Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="xs" fw={500}>
                                  {notif.title}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="xs" lineClamp={2} maw={300}>
                                  {notif.message}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="xs">{notif.actionByName || "-"}</Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="xs" c="dimmed">
                                  {formatDate(notif.createdAt)}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Badge size="xs" color={notif.isRead ? "gray" : "blue"}>
                                  {notif.isRead ? "Leída" : "No leída"}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <ActionIcon
                                  color="red"
                                  variant="light"
                                  size="sm"
                                  onClick={() => deleteNotification.mutate({ id: notif.id })}
                                  loading={deleteNotification.isPending}
                                >
                                  <IconTrash size={14} />
                                </ActionIcon>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </ScrollArea>
                  </Stack>
                </Tabs.Panel>

                {/* Tab de Estadísticas */}
                <Tabs.Panel value="stats" pt="md">
                  <Stack gap="lg">
                    {/* Tarjeta de Prueba de Notificaciones Push */}
                    <Card withBorder shadow="md" style={{ backgroundColor: '#f0fdf4' }}>
                      <Stack gap="md">
                        <Group>
                          <ThemeIcon size="lg" radius="xl" color="teal" variant="light">
                            <IconTestPipe size={24} />
                          </ThemeIcon>
                          <div style={{ flex: 1 }}>
                            <Title order={4}>Prueba de Notificaciones Push</Title>
                            <Text size="sm" c="dimmed">
                              Envía una notificación de prueba a todos los usuarios para verificar que el sistema funciona correctamente
                            </Text>
                          </div>
                        </Group>
                        
                        <Paper p="md" withBorder style={{ backgroundColor: 'white' }}>
                          <Stack gap="xs">
                            <Text size="sm" fw={500}>¿Qué hace este botón?</Text>
                            <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                              <li>
                                <Text size="xs" c="dimmed">
                                  Envía una notificación push a TODOS los usuarios del sistema
                                </Text>
                              </li>
                              <li>
                                <Text size="xs" c="dimmed">
                                  Crea notificaciones en la base de datos
                                </Text>
                              </li>
                              <li>
                                <Text size="xs" c="dimmed">
                                  Los usuarios con notificaciones activadas las recibirán en sus dispositivos
                                </Text>
                              </li>
                              <li>
                                <Text size="xs" c="dimmed">
                                  Útil para verificar que las notificaciones push funcionan sin crear eventos reales
                                </Text>
                              </li>
                            </ul>
                          </Stack>
                        </Paper>

                        <Button
                          size="lg"
                          color="teal"
                          leftSection={<IconTestPipe size={20} />}
                          onClick={() => testPushNotification.mutate({ sendToAll: true })}
                          loading={testPushNotification.isPending}
                          fullWidth
                        >
                          Enviar Notificación de Prueba a Todos
                        </Button>
                      </Stack>
                    </Card>

                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                      {/* Estadísticas de Usuarios */}
                      <Card withBorder>
                        <Title order={4} mb="md">
                          Estadísticas de Usuarios
                        </Title>
                      <Stack gap="md">
                        <Group justify="space-between">
                          <Text size="sm">Total de usuarios</Text>
                          <Text size="lg" fw={700}>
                            {userStats?.total || 0}
                          </Text>
                        </Group>
                        <div>
                          <Text size="sm" mb="xs">
                            Por rol:
                          </Text>
                          <Stack gap="xs">
                            {userStats?.byRole.map((item) => (
                              <Group key={item.role} justify="space-between">
                                <Badge color={getRoleBadgeColor(item.role)}>
                                  {item.role}
                                </Badge>
                                <Text size="sm" fw={600}>
                                  {item.count}
                                </Text>
                              </Group>
                            ))}
                          </Stack>
                        </div>
                      </Stack>
                    </Card>

                    {/* Estadísticas de Notificaciones */}
                    <Card withBorder>
                      <Title order={4} mb="md">
                        Estadísticas de Notificaciones
                      </Title>
                      <Stack gap="md">
                        <Group justify="space-between">
                          <Text size="sm">Total</Text>
                          <Text size="lg" fw={700}>
                            {notificationStats?.total || 0}
                          </Text>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm">No leídas</Text>
                          <Badge color="blue">{notificationStats?.unread || 0}</Badge>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm">Leídas</Text>
                          <Badge color="gray">{notificationStats?.read || 0}</Badge>
                        </Group>
                        <div>
                          <Text size="sm" mb="xs">
                            Por tipo:
                          </Text>
                          <Stack gap="xs">
                            {notificationStats?.byType.slice(0, 5).map((item) => (
                              <Group key={item.title} justify="space-between">
                                <Text size="xs" lineClamp={1}>
                                  {item.title}
                                </Text>
                                <Text size="sm" fw={600}>
                                  {item.count}
                                </Text>
                              </Group>
                            ))}
                          </Stack>
                        </div>
                      </Stack>
                    </Card>
                    </SimpleGrid>
                  </Stack>
                </Tabs.Panel>
              </Tabs>
            </Card>
          </Stack>
        </div>
      </div>

      {/* Modal de confirmar eliminación de usuario */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        title="Confirmar eliminación"
      >
        <Stack gap="md">
          <Text>¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.</Text>
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setDeleteModalOpened(false)}>
              Cancelar
            </Button>
            <Button
              color="red"
              onClick={() => userToDelete && deleteUser.mutate({ userId: userToDelete })}
              loading={deleteUser.isPending}
            >
              Eliminar
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal de limpieza avanzada */}
      <Modal
        opened={cleanModalOpened}
        onClose={() => setCleanModalOpened(false)}
        title="Limpieza avanzada de notificaciones"
        size="md"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Eliminar notificaciones antiguas del sistema
          </Text>
          <NumberInput
            label="Días de antigüedad"
            description="Notificaciones más antiguas que estos días serán eliminadas"
            value={daysToClean}
            onChange={(value) => setDaysToClean(Number(value))}
            min={1}
            max={365}
          />
          <Switch
            label="Solo notificaciones leídas"
            description="Si está activado, solo se eliminarán las notificaciones que ya fueron leídas"
            checked={onlyReadClean}
            onChange={(event) => setOnlyReadClean(event.currentTarget.checked)}
          />
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setCleanModalOpened(false)}>
              Cancelar
            </Button>
            <Button
              color="red"
              onClick={() =>
                cleanOldNotifications.mutate({
                  daysOld: daysToClean,
                  onlyRead: onlyReadClean,
                })
              }
              loading={cleanOldNotifications.isPending}
            >
              Limpiar notificaciones
            </Button>
          </Group>
        </Stack>
      </Modal>
    </MainLayout>
  );
}

