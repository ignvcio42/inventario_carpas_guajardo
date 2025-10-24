"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button, Card, Text, Group, Stack, Alert } from "@mantine/core";
import { IconBell, IconBellOff, IconCheck, IconX } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { api } from "~/trpc/react";
import {
  registerServiceWorker,
  isPushNotificationSupported,
  askUserPermission,
  createPushSubscription,
  getPermissionState,
  getUserSubscription,
  unsubscribePush,
} from "~/utils/push-notifications";

export default function PushNotificationSetup() {
  const { data: session, status } = useSession();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const utils = api.useUtils();
  const { data: hasSubscription } = api.push.hasSubscription.useQuery(undefined, {
    enabled: status === "authenticated",
  });

  const subscribeMutation = api.push.subscribe.useMutation({
    onSuccess: () => {
      notifications.show({
        title: "¡Notificaciones activadas!",
        message: "Recibirás notificaciones push en este dispositivo",
        color: "green",
        icon: <IconCheck size={18} />,
      });
      setIsSubscribed(true);
      setShowPrompt(false);
      void utils.push.hasSubscription.invalidate();
    },
    onError: (error) => {
      notifications.show({
        title: "Error",
        message: "No se pudo activar las notificaciones push",
        color: "red",
        icon: <IconX size={18} />,
      });
      console.error("Error al suscribirse:", error);
    },
  });

  const unsubscribeMutation = api.push.unsubscribe.useMutation({
    onSuccess: () => {
      notifications.show({
        title: "Notificaciones desactivadas",
        message: "Ya no recibirás notificaciones push en este dispositivo",
        color: "blue",
        icon: <IconBellOff size={18} />,
      });
      setIsSubscribed(false);
      void utils.push.hasSubscription.invalidate();
    },
    onError: (error) => {
      notifications.show({
        title: "Error",
        message: "No se pudo desactivar las notificaciones push",
        color: "red",
        icon: <IconX size={18} />,
      });
      console.error("Error al desuscribirse:", error);
    },
  });

  useEffect(() => {
    if (status !== "authenticated") return;

    const checkPermissionAndSubscription = async () => {
      if (!isPushNotificationSupported()) {
        return;
      }

      const currentPermission = getPermissionState();
      setPermission(currentPermission);

      const subscription = await getUserSubscription();
      setIsSubscribed(!!subscription && !!hasSubscription);

      // Mostrar prompt si no tiene permiso y no está suscrito
      if (currentPermission === "default" && !hasSubscription) {
        // Esperar un poco antes de mostrar el prompt (para no ser intrusivo)
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
      }
    };

    void checkPermissionAndSubscription();
  }, [status, hasSubscription]);

  const handleEnableNotifications = async () => {
    setIsLoading(true);

    try {
      // Registrar el service worker
      const registration = await registerServiceWorker();
      if (!registration) {
        throw new Error("No se pudo registrar el Service Worker");
      }

      // Solicitar permiso
      const permissionResult = await askUserPermission();
      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        notifications.show({
          title: "Permiso denegado",
          message: "Necesitas dar permiso para recibir notificaciones",
          color: "orange",
          icon: <IconX size={18} />,
        });
        setIsLoading(false);
        return;
      }

      // Crear suscripción push
      const subscription = await createPushSubscription();
      if (!subscription) {
        throw new Error("No se pudo crear la suscripción push");
      }

      // Enviar suscripción al servidor
      const subscriptionJSON = subscription.toJSON();
      await subscribeMutation.mutateAsync({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscriptionJSON.keys!.p256dh!,
          auth: subscriptionJSON.keys!.auth!,
        },
      });
    } catch (error) {
      console.error("Error al habilitar notificaciones:", error);
      notifications.show({
        title: "Error",
        message: "Ocurrió un error al activar las notificaciones",
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);

    try {
      const subscription = await getUserSubscription();
      if (subscription) {
        await unsubscribePush();
        await unsubscribeMutation.mutateAsync({
          endpoint: subscription.endpoint,
        });
      }
    } catch (error) {
      console.error("Error al deshabilitar notificaciones:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Guardar en localStorage que el usuario rechazó el prompt
    localStorage.setItem("pushNotificationPromptDismissed", "true");
  };

  // No mostrar nada si no está autenticado o no está soportado
  if (status !== "authenticated" || !isPushNotificationSupported()) {
    return null;
  }

  // Mostrar prompt inicial si corresponde
  if (showPrompt && permission === "default") {
    const dismissed = localStorage.getItem("pushNotificationPromptDismissed");
    if (dismissed) return null;

    return (
      <Card
        shadow="md"
        padding="lg"
        radius="md"
        withBorder
        className="fixed bottom-4 right-4 z-50 max-w-md animate-in fade-in slide-in-from-bottom-4"
      >
        <Stack gap="md">
          <Group>
            <IconBell size={24} className="text-blue-600" />
            <div style={{ flex: 1 }}>
              <Text fw={600} size="sm">
                ¿Activar notificaciones?
              </Text>
              <Text size="xs" c="dimmed">
                Recibe alertas de eventos y visitas técnicas
              </Text>
            </div>
          </Group>

          <Group>
            <Button
              variant="light"
              color="gray"
              size="xs"
              onClick={handleDismiss}
              fullWidth
            >
              Ahora no
            </Button>
            <Button
              variant="filled"
              color="blue"
              size="xs"
              onClick={handleEnableNotifications}
              loading={isLoading}
              fullWidth
            >
              Activar
            </Button>
          </Group>
        </Stack>
      </Card>
    );
  }

  // No mostrar nada más si ya está configurado
  return null;
}

// Componente de configuración para la página de notificaciones
export function PushNotificationSettings() {
  const { status } = useSession();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { data: hasSubscription } = api.push.hasSubscription.useQuery(undefined, {
    enabled: status === "authenticated",
  });

  const subscribeMutation = api.push.subscribe.useMutation({
    onSuccess: () => {
      notifications.show({
        title: "¡Notificaciones activadas!",
        message: "Recibirás notificaciones push en este dispositivo",
        color: "green",
        icon: <IconCheck size={18} />,
      });
      setIsSubscribed(true);
    },
  });

  const unsubscribeMutation = api.push.unsubscribe.useMutation({
    onSuccess: () => {
      notifications.show({
        title: "Notificaciones desactivadas",
        message: "Ya no recibirás notificaciones push en este dispositivo",
        color: "blue",
        icon: <IconBellOff size={18} />,
      });
      setIsSubscribed(false);
    },
  });

  useEffect(() => {
    const checkStatus = async () => {
      if (!isPushNotificationSupported()) return;

      const currentPermission = getPermissionState();
      setPermission(currentPermission);

      const subscription = await getUserSubscription();
      setIsSubscribed(!!subscription && !!hasSubscription);
    };

    void checkStatus();
  }, [hasSubscription]);

  const handleToggleNotifications = async () => {
    if (isSubscribed) {
      await handleDisableNotifications();
    } else {
      await handleEnableNotifications();
    }
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);

    try {
      const registration = await registerServiceWorker();
      if (!registration) {
        throw new Error("No se pudo registrar el Service Worker");
      }

      const permissionResult = await askUserPermission();
      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        notifications.show({
          title: "Permiso denegado",
          message: "Necesitas dar permiso para recibir notificaciones",
          color: "orange",
        });
        return;
      }

      const subscription = await createPushSubscription();
      if (!subscription) {
        throw new Error("No se pudo crear la suscripción push");
      }

      const subscriptionJSON = subscription.toJSON();
      await subscribeMutation.mutateAsync({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscriptionJSON.keys!.p256dh!,
          auth: subscriptionJSON.keys!.auth!,
        },
      });
    } catch (error) {
      console.error("Error:", error);
      notifications.show({
        title: "Error",
        message: "Ocurrió un error al activar las notificaciones",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);

    try {
      const subscription = await getUserSubscription();
      if (subscription) {
        await unsubscribePush();
        await unsubscribeMutation.mutateAsync({
          endpoint: subscription.endpoint,
        });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isPushNotificationSupported()) {
    return (
      <Alert color="orange" title="No soportado" icon={<IconBellOff size={16} />}>
        Tu navegador no soporta notificaciones push
      </Alert>
    );
  }

  if (permission === "denied") {
    return (
      <Alert color="red" title="Permiso denegado" icon={<IconX size={16} />}>
        Has bloqueado las notificaciones. Para activarlas, necesitas cambiar la
        configuración en tu navegador.
      </Alert>
    );
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group>
          {isSubscribed ? (
            <IconBell size={24} className="text-green-600" />
          ) : (
            <IconBellOff size={24} className="text-gray-400" />
          )}
          <div style={{ flex: 1 }}>
            <Text fw={600}>Notificaciones Push</Text>
            <Text size="sm" c="dimmed">
              {isSubscribed
                ? "Recibirás notificaciones en este dispositivo"
                : "Activa para recibir notificaciones en tu dispositivo"}
            </Text>
          </div>
        </Group>

        <Button
          variant={isSubscribed ? "light" : "filled"}
          color={isSubscribed ? "red" : "blue"}
          leftSection={isSubscribed ? <IconBellOff size={16} /> : <IconBell size={16} />}
          onClick={handleToggleNotifications}
          loading={isLoading}
        >
          {isSubscribed ? "Desactivar notificaciones" : "Activar notificaciones"}
        </Button>

        {permission === "granted" && isSubscribed && (
          <Alert color="green" icon={<IconCheck size={16} />}>
            Las notificaciones push están activas. Recibirás alertas de eventos y
            visitas técnicas.
          </Alert>
        )}
      </Stack>
    </Card>
  );
}

