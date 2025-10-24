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
  Group,
  Modal,
  TextInput,
  Textarea,
  Select,
  Grid,
  Loader,
  Center,
  Divider,
  Paper,
  ThemeIcon,
  Box,
  Avatar,
  Badge,
  Switch,
  Alert,
  Tabs,
  Progress,
  Timeline,
  Anchor,
} from "@mantine/core";
import {
  IconUser,
  IconEdit,
  IconPhone,
  IconMapPin,
  IconCalendarEvent,
  IconPencil,
  IconBell,
  IconSettings,
  IconClock,
  IconLanguage,
  IconPhoto,
  IconCheck,
  IconX,
  IconInfoCircle,
  IconActivity,
  IconChartBar,
} from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { api } from "~/trpc/react";

interface ProfileFormValues {
  name: string;
  phone: string;
  address: string;
  bio: string;
  timezone: string;
  language: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [opened, setOpened] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("general");

  const { data: profile, isLoading, refetch } = api.profile.getCurrentProfile.useQuery();
  const { data: userStats } = api.profile.getUserStats.useQuery();
  const { data: recentActivity } = api.profile.getRecentActivity.useQuery({ limit: 5 });
  const { data: availablePreferences } = api.profile.getAvailablePreferences.useQuery();

  const updateProfile = api.profile.updateProfile.useMutation();
  const updatePreferences = api.profile.updatePreferences.useMutation();

  const form = useForm<ProfileFormValues>({
    initialValues: {
      name: "",
      phone: "",
      address: "",
      bio: "",
      timezone: "America/Santiago",
      language: "es",
    },
    validate: {
      name: (value) =>
        value.trim().length > 0 ? null : "El nombre es requerido",
    },
  });

  const handleOpenModal = () => {
    if (profile) {
      form.setValues({
        name: profile.name || "",
        phone: profile.phone || "",
        address: profile.address || "",
        bio: profile.bio || "",
        timezone: profile.timezone || "America/Santiago",
        language: profile.language || "es",
      });
    }
    setOpened(true);
  };

  const handleCloseModal = () => {
    setOpened(false);
    form.reset();
  };

  const handleSubmit = async (values: ProfileFormValues) => {
    try {
      await updateProfile.mutateAsync(values);
      notifications.show({
        title: "Perfil actualizado",
        message: "Tu perfil ha sido actualizado exitosamente",
        color: "green",
      });
      handleCloseModal();
      await refetch();
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Ocurrió un error al actualizar el perfil",
        color: "red",
      });
    }
  };

  const handlePreferenceChange = async (key: string, value: any) => {
    try {
      const currentPreferences = profile?.preferences as Record<string, any> || {};
      const newPreferences = {
        ...currentPreferences,
        [key]: value,
      };
      
      await updatePreferences.mutateAsync({ preferences: newPreferences });
      notifications.show({
        title: "Preferencia actualizada",
        message: "Tu preferencia ha sido guardada",
        color: "green",
      });
      await refetch();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Ocurrió un error al actualizar la preferencia",
        color: "red",
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "red";
      case "ADMIN":
        return "orange";
      case "MANAGER":
        return "blue";
      case "TECHNICIAN":
        return "green";
      case "SALES":
        return "purple";
      case "WORKER":
        return "gray";
      default:
        return "gray";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Super Administrador";
      case "ADMIN":
        return "Administrador";
      case "MANAGER":
        return "Gerente";
      case "TECHNICIAN":
        return "Técnico";
      case "SALES":
        return "Ventas";
      case "WORKER":
        return "Trabajador";
      default:
        return role;
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <MainLayout>
        <Center className="h-64">
          <Loader size="lg" />
        </Center>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout>
        <Center className="h-64">
          <Alert
            icon={<IconInfoCircle size={16} />}
            title="Error"
            color="red"
          >
            No se pudo cargar el perfil del usuario.
          </Alert>
        </Center>
      </MainLayout>
    );
  }

  const preferences = profile.preferences as Record<string, any> || {};

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
                    Mi Perfil
                  </Title>
                  <Text c="dimmed" size="sm">
                    Gestiona tu información personal y preferencias
                  </Text>
                </div>
                <Button
                  leftSection={<IconEdit size={20} />}
                  onClick={handleOpenModal}
                  size="md"
                >
                  Editar Perfil
                </Button>
              </Group>
            </Card>

            {/* Información Principal */}
            <Card shadow="sm" padding="lg" radius="md" className="bg-white">
              <Group align="flex-start" gap="lg">
                <Avatar
                  src={profile.image || profile.avatarUrl}
                  size={120}
                  radius="xl"
                  color="indigo"
                >
                  {profile.name?.charAt(0) || "U"}
                </Avatar>
                <Box style={{ flex: 1 }}>
                  <Group align="center" gap="md" mb="sm">
                    <Title order={2}>{profile.name || "Usuario"}</Title>
                    <Badge
                      color={getRoleBadgeColor(profile.role)}
                      variant="light"
                      size="lg"
                    >
                      {getRoleLabel(profile.role)}
                    </Badge>
                  </Group>
                  
                  <Stack gap="xs">
                    <Group gap="xs">
                      <IconUser size={16} className="text-gray-500" />
                      <Text size="sm">{profile.email}</Text>
                    </Group>
                    
                    {profile.phone && (
                      <Group gap="xs">
                        <IconPhone size={16} className="text-gray-500" />
                        <Text size="sm">{profile.phone}</Text>
                      </Group>
                    )}
                    
                    {profile.address && (
                      <Group gap="xs">
                        <IconMapPin size={16} className="text-gray-500" />
                        <Text size="sm">{profile.address}</Text>
                      </Group>
                    )}
                    
                    <Group gap="xs">
                      <IconCalendarEvent size={16} className="text-gray-500" />
                      <Text size="sm">
                        Miembro desde {new Date(profile.createdAt).toLocaleDateString("es-CL")}
                      </Text>
                    </Group>
                  </Stack>

                  {profile.bio && (
                    <Box mt="md">
                      <Text size="sm" c="dimmed">
                        {profile.bio}
                      </Text>
                    </Box>
                  )}
                </Box>
              </Group>
            </Card>

            {/* Estadísticas y Configuración */}
            <Tabs value={activeTab} onChange={(value) => setActiveTab(value || "general")}>
              <Tabs.List>
                <Tabs.Tab value="general" leftSection={<IconUser size={16} />}>
                  General
                </Tabs.Tab>
                <Tabs.Tab value="stats" leftSection={<IconChartBar size={16} />}>
                  Estadísticas
                </Tabs.Tab>
                <Tabs.Tab value="activity" leftSection={<IconActivity size={16} />}>
                  Actividad
                </Tabs.Tab>
                <Tabs.Tab value="preferences" leftSection={<IconSettings size={16} />}>
                  Preferencias
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="general" pt="md">
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Card shadow="sm" padding="md" radius="md" className="bg-white">
                      <Group mb="md">
                        <ThemeIcon size="md" radius="md" color="blue" variant="light">
                          <IconClock size={18} />
                        </ThemeIcon>
                        <Text fw={600}>Configuración Regional</Text>
                      </Group>
                      <Stack gap="sm">
                        <div>
                          <Text size="sm" c="dimmed">Zona Horaria</Text>
                          <Text size="md">{profile.timezone}</Text>
                        </div>
                        <div>
                          <Text size="sm" c="dimmed">Idioma</Text>
                          <Text size="md">
                            {availablePreferences?.languages.find(l => l.value === profile.language)?.label || profile.language}
                          </Text>
                        </div>
                      </Stack>
                    </Card>
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Card shadow="sm" padding="md" radius="md" className="bg-white">
                      <Group mb="md">
                        <ThemeIcon size="md" radius="md" color="green" variant="light">
                          <IconInfoCircle size={18} />
                        </ThemeIcon>
                        <Text fw={600}>Información de Cuenta</Text>
                      </Group>
                      <Stack gap="sm">
                        <div>
                          <Text size="sm" c="dimmed">Email Verificado</Text>
                          <Group gap="xs">
                            {profile.emailVerified ? (
                              <ThemeIcon size="sm" color="green" variant="light">
                                <IconCheck size={14} />
                              </ThemeIcon>
                            ) : (
                              <ThemeIcon size="sm" color="red" variant="light">
                                <IconX size={14} />
                              </ThemeIcon>
                            )}
                            <Text size="sm">
                              {profile.emailVerified ? "Verificado" : "No verificado"}
                            </Text>
                          </Group>
                        </div>
                        <div>
                          <Text size="sm" c="dimmed">Última actualización</Text>
                          <Text size="md">
                            {new Date(profile.updatedAt).toLocaleDateString("es-CL")}
                          </Text>
                        </div>
                      </Stack>
                    </Card>
                  </Grid.Col>
                </Grid>
              </Tabs.Panel>

              <Tabs.Panel value="stats" pt="md">
                <Grid>
                  <Grid.Col span={{ base: 6, sm: 3 }}>
                    <Card shadow="sm" padding="md" radius="md" className="bg-white">
                      <Stack align="center" gap="xs">
                        <ThemeIcon size="xl" radius="xl" color="blue" variant="light">
                          <IconCalendarEvent size={24} />
                        </ThemeIcon>
                        <Text size="xl" fw={700} c="blue">
                          {userStats?.totalEvents || 0}
                        </Text>
                        <Text size="sm" c="dimmed" ta="center">
                          Total Eventos
                        </Text>
                      </Stack>
                    </Card>
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 6, sm: 3 }}>
                    <Card shadow="sm" padding="md" radius="md" className="bg-white">
                      <Stack align="center" gap="xs">
                        <ThemeIcon size="xl" radius="xl" color="green" variant="light">
                          <IconCheck size={24} />
                        </ThemeIcon>
                        <Text size="xl" fw={700} c="green">
                          {userStats?.completedEvents || 0}
                        </Text>
                        <Text size="sm" c="dimmed" ta="center">
                          Completados
                        </Text>
                      </Stack>
                    </Card>
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 6, sm: 3 }}>
                    <Card shadow="sm" padding="md" radius="md" className="bg-white">
                      <Stack align="center" gap="xs">
                        <ThemeIcon size="xl" radius="xl" color="orange" variant="light">
                          <IconClock size={24} />
                        </ThemeIcon>
                        <Text size="xl" fw={700} c="orange">
                          {userStats?.pendingEvents || 0}
                        </Text>
                        <Text size="sm" c="dimmed" ta="center">
                          Pendientes
                        </Text>
                      </Stack>
                    </Card>
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 6, sm: 3 }}>
                    <Card shadow="sm" padding="md" radius="md" className="bg-white">
                      <Stack align="center" gap="xs">
                        <ThemeIcon size="xl" radius="xl" color="purple" variant="light">
                          <IconPencil size={24} />
                        </ThemeIcon>
                        <Text size="xl" fw={700} c="purple">
                          {userStats?.totalSketches || 0}
                        </Text>
                        <Text size="sm" c="dimmed" ta="center">
                          Bocetos
                        </Text>
                      </Stack>
                    </Card>
                  </Grid.Col>
                </Grid>

                {userStats && userStats.totalEvents > 0 && (
                  <Card shadow="sm" padding="md" radius="md" className="bg-white" mt="md">
                    <Text fw={600} mb="md">Progreso de Eventos</Text>
                    <Stack gap="sm">
                      <div>
                        <Group justify="space-between" mb="xs">
                          <Text size="sm">Eventos Completados</Text>
                          <Text size="sm" fw={500}>
                            {userStats.completedEvents} / {userStats.totalEvents}
                          </Text>
                        </Group>
                        <Progress
                          value={(userStats.completedEvents / userStats.totalEvents) * 100}
                          color="green"
                          size="sm"
                        />
                      </div>
                    </Stack>
                  </Card>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="activity" pt="md">
                <Card shadow="sm" padding="md" radius="md" className="bg-white">
                  <Text fw={600} mb="md">Actividad Reciente</Text>
                  {recentActivity && (recentActivity.events.length > 0 || recentActivity.sketches.length > 0) ? (
                    <Timeline active={-1} bulletSize={24} lineWidth={2}>
                      {recentActivity.events.slice(0, 3).map((event: any) => (
                        <Timeline.Item
                          key={event.id}
                          bullet={<IconCalendarEvent size={12} />}
                          title={`Evento: ${event.nombreCliente}`}
                        >
                          <Text c="dimmed" size="sm">
                            Estado: {event.estado} • {new Date(event.createdAt).toLocaleDateString("es-CL")}
                          </Text>
                        </Timeline.Item>
                      ))}
                      {recentActivity.sketches.slice(0, 2).map((sketch: any) => (
                        <Timeline.Item
                          key={sketch.id}
                          bullet={<IconPencil size={12} />}
                          title={`Boceto: ${sketch.name}`}
                        >
                          <Text c="dimmed" size="sm">
                            Creado: {new Date(sketch.createdAt).toLocaleDateString("es-CL")}
                          </Text>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  ) : (
                    <Text c="dimmed" ta="center" py="md">
                      No hay actividad reciente
                    </Text>
                  )}
                </Card>
              </Tabs.Panel>

              <Tabs.Panel value="preferences" pt="md">
                <Card shadow="sm" padding="md" radius="md" className="bg-white">
                  <Group mb="md">
                    <ThemeIcon size="md" radius="md" color="orange" variant="light">
                      <IconBell size={18} />
                    </ThemeIcon>
                    <Text fw={600}>Preferencias de Notificaciones</Text>
                  </Group>
                  
                  {availablePreferences?.notificationPreferences.map((pref) => (
                    <Group key={pref.key} justify="space-between" mb="sm">
                      <div>
                        <Text size="sm" fw={500}>{pref.label}</Text>
                        <Text size="xs" c="dimmed">
                          {pref.type === "boolean" ? "Activar/Desactivar" : "Configuración"}
                        </Text>
                      </div>
                      <Switch
                        checked={preferences[pref.key] || false}
                        onChange={(event) => handlePreferenceChange(pref.key, event.currentTarget.checked)}
                      />
                    </Group>
                  ))}
                </Card>
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </div>
      </div>

      {/* Modal de Editar Perfil */}
      <Modal
        opened={opened}
        onClose={handleCloseModal}
        title={
          <Title order={3}>Editar Perfil</Title>
        }
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Nombre Completo"
                  placeholder="Tu nombre completo"
                  required
                  leftSection={<IconUser size={16} />}
                  {...form.getInputProps("name")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Teléfono"
                  placeholder="+56 9 1234 5678"
                  leftSection={<IconPhone size={16} />}
                  {...form.getInputProps("phone")}
                />
              </Grid.Col>
            </Grid>

            <TextInput
              label="Dirección"
              placeholder="Tu dirección"
              leftSection={<IconMapPin size={16} />}
              {...form.getInputProps("address")}
            />

            <Textarea
              label="Biografía"
              placeholder="Cuéntanos algo sobre ti..."
              minRows={3}
              {...form.getInputProps("bio")}
            />

            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Zona Horaria"
                  placeholder="Selecciona tu zona horaria"
                  data={availablePreferences?.timezones || []}
                  leftSection={<IconClock size={16} />}
                  {...form.getInputProps("timezone")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Idioma"
                  placeholder="Selecciona tu idioma"
                  data={availablePreferences?.languages || []}
                  leftSection={<IconLanguage size={16} />}
                  {...form.getInputProps("language")}
                />
              </Grid.Col>
            </Grid>

            {/* Botones */}
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={updateProfile.isPending}
              >
                Guardar Cambios
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </MainLayout>
  );
}
