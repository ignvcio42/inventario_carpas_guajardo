"use client";

import { useState } from "react";
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
  ActionIcon,
  Loader,
  Center,
  Paper,
  ThemeIcon,
  Tabs,
  ScrollArea,
} from "@mantine/core";
import {
  IconBell,
  IconBellOff,
  IconCheck,
  IconTrash,
  IconCalendarEvent,
  IconTool,
  IconClock,
  IconUser,
} from "@tabler/icons-react";
import { notifications as mantineNotifications } from "@mantine/notifications";
import { api } from "~/trpc/react";
import { PushNotificationSettings } from "../_components/push-notification-setup";

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<string | null>("all");
  const utils = api.useUtils();

  const { data: allNotifications, isLoading } = api.notification.getAll.useQuery();
  const { data: unreadNotifications } = api.notification.getUnread.useQuery();
  
  const markAsRead = api.notification.markAsRead.useMutation({
    onMutate: async ({ id }) => {
      // Cancelar refetch en progreso
      await utils.notification.getAll.cancel();
      await utils.notification.getUnread.cancel();
      await utils.notification.getUnreadCount.cancel();

      // Guardar estado anterior
      const previousAll = utils.notification.getAll.getData();
      const previousUnread = utils.notification.getUnread.getData();
      const previousCount = utils.notification.getUnreadCount.getData();

      // Actualizar optimistamente
      if (previousAll) {
        utils.notification.getAll.setData(undefined, 
          previousAll.map(notif => 
            notif.id === id 
              ? { ...notif, isRead: true, readAt: new Date() }
              : notif
          )
        );
      }

      if (previousUnread) {
        utils.notification.getUnread.setData(undefined,
          previousUnread.filter(notif => notif.id !== id)
        );
      }

      if (previousCount !== undefined) {
        utils.notification.getUnreadCount.setData(undefined, Math.max(0, previousCount - 1));
      }

      return { previousAll, previousUnread, previousCount };
    },
    onError: (err, { id }, context) => {
      // Revertir en caso de error
      if (context?.previousAll) {
        utils.notification.getAll.setData(undefined, context.previousAll);
      }
      if (context?.previousUnread) {
        utils.notification.getUnread.setData(undefined, context.previousUnread);
      }
      if (context?.previousCount !== undefined) {
        utils.notification.getUnreadCount.setData(undefined, context.previousCount);
      }
      mantineNotifications.show({
        title: "Error",
        message: "Ocurrió un error al marcar la notificación",
        color: "red",
      });
    },
    onSuccess: () => {
      mantineNotifications.show({
        title: "Notificación marcada como leída",
        message: "",
        color: "green",
      });
    },
  });

  const markAllAsRead = api.notification.markAllAsRead.useMutation({
    onMutate: async () => {
      await utils.notification.getAll.cancel();
      await utils.notification.getUnread.cancel();
      await utils.notification.getUnreadCount.cancel();

      const previousAll = utils.notification.getAll.getData();
      const previousUnread = utils.notification.getUnread.getData();
      const previousCount = utils.notification.getUnreadCount.getData();

      // Marcar todas como leídas
      if (previousAll) {
        utils.notification.getAll.setData(undefined,
          previousAll.map(notif => ({ ...notif, isRead: true, readAt: new Date() }))
        );
      }

      utils.notification.getUnread.setData(undefined, []);
      utils.notification.getUnreadCount.setData(undefined, 0);

      return { previousAll, previousUnread, previousCount };
    },
    onError: (err, variables, context) => {
      if (context?.previousAll) {
        utils.notification.getAll.setData(undefined, context.previousAll);
      }
      if (context?.previousUnread) {
        utils.notification.getUnread.setData(undefined, context.previousUnread);
      }
      if (context?.previousCount !== undefined) {
        utils.notification.getUnreadCount.setData(undefined, context.previousCount);
      }
      mantineNotifications.show({
        title: "Error",
        message: "Ocurrió un error al marcar las notificaciones",
        color: "red",
      });
    },
    onSuccess: () => {
      mantineNotifications.show({
        title: "Todas las notificaciones marcadas como leídas",
        message: "",
        color: "green",
      });
    },
  });

  const deleteNotification = api.notification.delete.useMutation({
    onMutate: async ({ id }) => {
      await utils.notification.getAll.cancel();
      await utils.notification.getUnread.cancel();
      await utils.notification.getUnreadCount.cancel();

      const previousAll = utils.notification.getAll.getData();
      const previousUnread = utils.notification.getUnread.getData();
      const previousCount = utils.notification.getUnreadCount.getData();

      // Remover notificación
      if (previousAll) {
        const deletedNotif = previousAll.find(n => n.id === id);
        utils.notification.getAll.setData(undefined,
          previousAll.filter(notif => notif.id !== id)
        );

        // Si era no leída, decrementar contador
        if (deletedNotif && !deletedNotif.isRead && previousCount !== undefined) {
          utils.notification.getUnreadCount.setData(undefined, Math.max(0, previousCount - 1));
        }
      }

      if (previousUnread) {
        utils.notification.getUnread.setData(undefined,
          previousUnread.filter(notif => notif.id !== id)
        );
      }

      return { previousAll, previousUnread, previousCount };
    },
    onError: (err, { id }, context) => {
      if (context?.previousAll) {
        utils.notification.getAll.setData(undefined, context.previousAll);
      }
      if (context?.previousUnread) {
        utils.notification.getUnread.setData(undefined, context.previousUnread);
      }
      if (context?.previousCount !== undefined) {
        utils.notification.getUnreadCount.setData(undefined, context.previousCount);
      }
      mantineNotifications.show({
        title: "Error",
        message: "Ocurrió un error al eliminar la notificación",
        color: "red",
      });
    },
    onSuccess: () => {
      mantineNotifications.show({
        title: "Notificación eliminada",
        message: "",
        color: "green",
      });
    },
  });

  const deleteAllRead = api.notification.deleteAllRead.useMutation({
    onMutate: async () => {
      await utils.notification.getAll.cancel();
      await utils.notification.getUnread.cancel();
      await utils.notification.getUnreadCount.cancel();

      const previousAll = utils.notification.getAll.getData();
      const previousUnread = utils.notification.getUnread.getData();
      const previousCount = utils.notification.getUnreadCount.getData();

      // Remover todas las leídas
      if (previousAll) {
        utils.notification.getAll.setData(undefined,
          previousAll.filter(notif => !notif.isRead)
        );
      }

      return { previousAll, previousUnread, previousCount };
    },
    onError: (err, variables, context) => {
      if (context?.previousAll) {
        utils.notification.getAll.setData(undefined, context.previousAll);
      }
      if (context?.previousUnread) {
        utils.notification.getUnread.setData(undefined, context.previousUnread);
      }
      if (context?.previousCount !== undefined) {
        utils.notification.getUnreadCount.setData(undefined, context.previousCount);
      }
      mantineNotifications.show({
        title: "Error",
        message: "Ocurrió un error al eliminar las notificaciones",
        color: "red",
      });
    },
    onSuccess: () => {
      mantineNotifications.show({
        title: "Notificaciones eliminadas",
        message: "Todas las notificaciones leídas han sido eliminadas",
        color: "green",
      });
    },
  });

  const handleMarkAsRead = async (id: number) => {
    await markAsRead.mutateAsync({ id });
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead.mutateAsync();
  };

  const handleDelete = async (id: number) => {
    await deleteNotification.mutateAsync({ id });
  };

  const handleDeleteAllRead = async () => {
    if (window.confirm("¿Estás seguro de que deseas eliminar todas las notificaciones leídas?")) {
      await deleteAllRead.mutateAsync();
    }
  };

  const getNotificationIcon = (title: string) => {
    if (title.includes("evento")) {
      return <IconCalendarEvent size={20} />;
    } else if (title.includes("visita")) {
      return <IconTool size={20} />;
    }
    return <IconBell size={20} />;
  };

  const getNotificationColor = (title: string) => {
    if (title.includes("evento")) {
      return "blue";
    } else if (title.includes("visita")) {
      return "orange";
    }
    return "indigo";
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "Hace un momento";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Hace ${minutes} minuto${minutes > 1 ? "s" : ""}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Hace ${hours} hora${hours > 1 ? "s" : ""}`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `Hace ${days} día${days > 1 ? "s" : ""}`;
    } else {
      return new Date(date).toLocaleDateString("es-CL");
    }
  };

  const displayedNotifications = activeTab === "unread" 
    ? unreadNotifications 
    : allNotifications;

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
        <div className="max-w-4xl mx-auto">
          <Stack gap="md">
            {/* Header */}
            <Card shadow="sm" padding="lg" radius="md" className="bg-white">
              <Group justify="space-between" align="center">
                <div>
                  <Title order={1} className="text-gray-900">
                    Notificaciones
                  </Title>
                  <Text c="dimmed" size="sm">
                    Mantente al tanto de todos los cambios importantes
                  </Text>
                </div>
                {unreadNotifications && unreadNotifications.length > 0 && (
                  <Badge size="xl" color="red" variant="filled">
                    {unreadNotifications.length} sin leer
                  </Badge>
                )}
              </Group>
            </Card>

            {/* Push Notification Settings */}
            <PushNotificationSettings />

            {/* Actions */}
            {allNotifications && allNotifications.length > 0 && (
              <Card shadow="sm" padding="md" radius="md" className="bg-white">
                <Group justify="space-between">
                  <Button
                    variant="light"
                    leftSection={<IconCheck size={16} />}
                    onClick={handleMarkAllAsRead}
                    disabled={!unreadNotifications || unreadNotifications.length === 0}
                  >
                    Marcar todas como leídas
                  </Button>
                  <Button
                    variant="light"
                    color="red"
                    leftSection={<IconTrash size={16} />}
                    onClick={handleDeleteAllRead}
                  >
                    Eliminar leídas
                  </Button>
                </Group>
              </Card>
            )}

            {/* Tabs */}
            <Card shadow="sm" padding="lg" radius="md" className="bg-white">
              <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                  <Tabs.Tab
                    value="all"
                    leftSection={<IconBell size={16} />}
                  >
                    Todas ({allNotifications?.length || 0})
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="unread"
                    leftSection={<IconBellOff size={16} />}
                  >
                    No leídas ({unreadNotifications?.length || 0})
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="all" pt="md">
                  <ScrollArea h={600}>
                    <Stack gap="md">
                      {displayedNotifications && displayedNotifications.length > 0 ? (
                        displayedNotifications.map((notification) => (
                          <Paper
                            key={notification.id}
                            p="md"
                            withBorder
                            radius="md"
                            className={`transition-all ${
                              notification.isRead
                                ? "bg-gray-50"
                                : "bg-blue-50 border-blue-200"
                            }`}
                          >
                            <Group justify="space-between" align="flex-start">
                              <Group align="flex-start" gap="md" style={{ flex: 1 }}>
                                <ThemeIcon
                                  size="lg"
                                  radius="md"
                                  color={getNotificationColor(notification.title)}
                                  variant="light"
                                >
                                  {getNotificationIcon(notification.title)}
                                </ThemeIcon>
                                <div style={{ flex: 1 }}>
                                  <Group gap="xs" mb="xs">
                                    <Text fw={600} size="sm">
                                      {notification.title}
                                    </Text>
                                    {!notification.isRead && (
                                      <Badge size="xs" color="blue">
                                        Nueva
                                      </Badge>
                                    )}
                                  </Group>
                                  <Text size="sm" c="dimmed" mb="xs">
                                    {notification.message}
                                  </Text>
                                  {notification.actionByName && (
                                    <Group gap="xs" mb="xs">
                                      <IconUser size={14} className="text-gray-400" />
                                      <Text size="xs" c="dimmed">
                                        Por: <strong>{notification.actionByName}</strong>
                                      </Text>
                                    </Group>
                                  )}
                                  <Group gap="xs">
                                    <IconClock size={14} className="text-gray-400" />
                                    <Text size="xs" c="dimmed">
                                      {formatDate(notification.createdAt)}
                                    </Text>
                                  </Group>
                                </div>
                              </Group>

                              <Group gap="xs">
                                {!notification.isRead && (
                                  <ActionIcon
                                    variant="light"
                                    color="green"
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    title="Marcar como leída"
                                  >
                                    <IconCheck size={16} />
                                  </ActionIcon>
                                )}
                                <ActionIcon
                                  variant="light"
                                  color="red"
                                  onClick={() => handleDelete(notification.id)}
                                  title="Eliminar"
                                >
                                  <IconTrash size={16} />
                                </ActionIcon>
                              </Group>
                            </Group>
                          </Paper>
                        ))
                      ) : (
                        <Center className="py-12">
                          <Stack align="center" gap="md">
                            <IconBellOff
                              size={48}
                              className="text-gray-400"
                              stroke={1.5}
                            />
                            <div className="text-center">
                              <Text size="lg" fw={500} c="dimmed">
                                No hay notificaciones
                              </Text>
                              <Text size="sm" c="dimmed">
                                {activeTab === "unread"
                                  ? "Todas tus notificaciones están leídas"
                                  : "Aquí aparecerán las notificaciones de eventos y visitas técnicas"}
                              </Text>
                            </div>
                          </Stack>
                        </Center>
                      )}
                    </Stack>
                  </ScrollArea>
                </Tabs.Panel>

                <Tabs.Panel value="unread" pt="md">
                  <ScrollArea h={600}>
                    <Stack gap="md">
                      {displayedNotifications && displayedNotifications.length > 0 ? (
                        displayedNotifications.map((notification) => (
                          <Paper
                            key={notification.id}
                            p="md"
                            withBorder
                            radius="md"
                            className="bg-blue-50 border-blue-200 transition-all"
                          >
                            <Group justify="space-between" align="flex-start">
                              <Group align="flex-start" gap="md" style={{ flex: 1 }}>
                                <ThemeIcon
                                  size="lg"
                                  radius="md"
                                  color={getNotificationColor(notification.title)}
                                  variant="light"
                                >
                                  {getNotificationIcon(notification.title)}
                                </ThemeIcon>
                                <div style={{ flex: 1 }}>
                                  <Group gap="xs" mb="xs">
                                    <Text fw={600} size="sm">
                                      {notification.title}
                                    </Text>
                                    <Badge size="xs" color="blue">
                                      Nueva
                                    </Badge>
                                  </Group>
                                  <Text size="sm" c="dimmed" mb="xs">
                                    {notification.message}
                                  </Text>
                                  {notification.actionByName && (
                                    <Group gap="xs" mb="xs">
                                      <IconUser size={14} className="text-gray-400" />
                                      <Text size="xs" c="dimmed">
                                        Por: <strong>{notification.actionByName}</strong>
                                      </Text>
                                    </Group>
                                  )}
                                  <Group gap="xs">
                                    <IconClock size={14} className="text-gray-400" />
                                    <Text size="xs" c="dimmed">
                                      {formatDate(notification.createdAt)}
                                    </Text>
                                  </Group>
                                </div>
                              </Group>

                              <Group gap="xs">
                                <ActionIcon
                                  variant="light"
                                  color="green"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  title="Marcar como leída"
                                >
                                  <IconCheck size={16} />
                                </ActionIcon>
                                <ActionIcon
                                  variant="light"
                                  color="red"
                                  onClick={() => handleDelete(notification.id)}
                                  title="Eliminar"
                                >
                                  <IconTrash size={16} />
                                </ActionIcon>
                              </Group>
                            </Group>
                          </Paper>
                        ))
                      ) : (
                        <Center className="py-12">
                          <Stack align="center" gap="md">
                            <IconBellOff
                              size={48}
                              className="text-gray-400"
                              stroke={1.5}
                            />
                            <div className="text-center">
                              <Text size="lg" fw={500} c="dimmed">
                                No hay notificaciones sin leer
                              </Text>
                              <Text size="sm" c="dimmed">
                                ¡Estás al día con todas tus notificaciones!
                              </Text>
                            </div>
                          </Stack>
                        </Center>
                      )}
                    </Stack>
                  </ScrollArea>
                </Tabs.Panel>
              </Tabs>
            </Card>
          </Stack>
        </div>
      </div>
    </MainLayout>
  );
}

