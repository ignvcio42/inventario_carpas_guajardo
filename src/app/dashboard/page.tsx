"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MainLayout from "../_components/main-layout";
import { 
  Grid, 
  Card, 
  Text, 
  Group, 
  Badge, 
  Button, 
  Stack, 
  Title, 
  Box,
  ThemeIcon,
  Loader,
  Center,
  Progress,
  Timeline,
  RingProgress,
  SimpleGrid,
  Paper,
  Divider,
  ScrollArea,
} from '@mantine/core';
import { 
  IconCalendarEvent, 
  IconPackage, 
  IconTool, 
  IconCurrencyDollar,
  IconPlus,
  IconClock,
  IconBell,
  IconArrowUpRight,
  IconAlertCircle,
  IconCircleCheck,
  IconHourglass,
  IconX,
  IconMapPin,
  IconUser,
  IconTrendingUp,
  IconTrendingDown,
} from '@tabler/icons-react';
import { api } from "~/trpc/react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: unreadCount } = api.notification.getUnreadCount.useQuery();
  const { data: stats, isLoading: statsLoading } = api.dashboard.getStats.useQuery();
  const { data: recentActivity } = api.dashboard.getRecentActivity.useQuery();
  const { data: upcomingEvents } = api.dashboard.getUpcomingEvents.useQuery();
  const { data: upcomingVisits } = api.dashboard.getUpcomingVisits.useQuery();
  const { data: eventsByStatus } = api.dashboard.getEventsByStatus.useQuery();

  if (status === "loading" || statsLoading) {
    return (
      <MainLayout>
        <Center className="h-64">
          <Loader size="lg" />
        </Center>
      </MainLayout>
    );
  }

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "PENDIENTE": return "yellow";
      case "EN_PROCESO": return "blue";
      case "COMPLETADO": return "green";
      case "CANCELADO": return "red";
      case "PROGRAMADA": return "cyan";
      case "REALIZADA": return "green";
      case "REPROGRAMADA": return "orange";
      case "CANCELADA": return "red";
      default: return "gray";
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case "PENDIENTE": return <IconHourglass size={16} />;
      case "EN_PROCESO": return <IconClock size={16} />;
      case "COMPLETADO": return <IconCircleCheck size={16} />;
      case "CANCELADO": return <IconX size={16} />;
      case "PROGRAMADA": return <IconCalendarEvent size={16} />;
      case "REALIZADA": return <IconCircleCheck size={16} />;
      default: return <IconClock size={16} />;
    }
  };

  const formatCurrency = (amount: number | bigint | { toString: () => string }) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(Number(amount));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calcular porcentaje de eventos por estado
  const totalEvents = eventsByStatus?.reduce((sum, item) => sum + item.count, 0) || 0;
  const completedEvents = eventsByStatus?.find(item => item.status === "COMPLETADO")?.count || 0;
  const completionRate = totalEvents > 0 ? (completedEvents / totalEvents) * 100 : 0;

  return (
    <MainLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Stack gap="lg">
            {/* Welcome Section */}
            <Card shadow="sm" padding="lg" radius="md" className="bg-gradient-to-r from-indigo-500 to-purple-600">
              <Group justify="space-between" align="center">
                <div>
                  <Title order={1} className="text-white mb-2">
                    ¡Bienvenido, {session?.user?.name}! 👋
                  </Title>
                  <Text className="text-indigo-100" size="sm">
                    Aquí tienes un resumen de tu sistema de gestión
                  </Text>
                </div>
                <ThemeIcon size={60} radius="xl" variant="light" color="white">
                  <IconTrendingUp size={32} />
                </ThemeIcon>
              </Group>
            </Card>

            {/* Stats Cards */}
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
              <Card shadow="sm" padding="lg" radius="md" className="bg-white border-l-4 border-blue-500">
                <Group justify="space-between" mb="xs">
                  <Text size="sm" c="dimmed" fw={500}>Eventos Activos</Text>
                  <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                    <IconCalendarEvent size={20} />
                  </ThemeIcon>
                </Group>
                <Text size="xl" fw={700} c="blue">{stats?.activeEvents || 0}</Text>
                <Text size="xs" c="dimmed" mt="xs">
                  Pendientes y en proceso
                </Text>
              </Card>

              <Card shadow="sm" padding="lg" radius="md" className="bg-white border-l-4 border-green-500">
                <Group justify="space-between" mb="xs">
                  <Text size="sm" c="dimmed" fw={500}>Items en Inventario</Text>
                  <ThemeIcon size="lg" radius="md" color="green" variant="light">
                    <IconPackage size={20} />
                  </ThemeIcon>
                </Group>
                <Text size="xl" fw={700} c="green">{stats?.totalItems || 0}</Text>
                <Group gap="xs" mt="xs">
                  {stats?.lowStockItems && stats.lowStockItems > 0 ? (
                    <>
                      <IconAlertCircle size={14} className="text-red-500" />
                      <Text size="xs" c="red">{stats.lowStockItems} con stock bajo</Text>
                    </>
                  ) : (
                    <Text size="xs" c="dimmed">Stock normal</Text>
                  )}
                </Group>
              </Card>

              <Card shadow="sm" padding="lg" radius="md" className="bg-white border-l-4 border-purple-500">
                <Group justify="space-between" mb="xs">
                  <Text size="sm" c="dimmed" fw={500}>Ingresos del Mes</Text>
                  <ThemeIcon size="lg" radius="md" color="purple" variant="light">
                    <IconCurrencyDollar size={20} />
                  </ThemeIcon>
                </Group>
                <Text size="xl" fw={700} c="purple">
                  {formatCurrency(Number(stats?.monthlyRevenue || 0))}
                </Text>
                <Text size="xs" c="dimmed" mt="xs">
                  Eventos completados
                </Text>
              </Card>

              <Card shadow="sm" padding="lg" radius="md" className="bg-white border-l-4 border-orange-500">
                <Group justify="space-between" mb="xs">
                  <Text size="sm" c="dimmed" fw={500}>Visitas Programadas</Text>
                  <ThemeIcon size="lg" radius="md" color="orange" variant="light">
                    <IconTool size={20} />
                  </ThemeIcon>
                </Group>
                <Text size="xl" fw={700} c="orange">{stats?.scheduledVisits || 0}</Text>
                <Text size="xs" c="dimmed" mt="xs">
                  Próximas visitas técnicas
                </Text>
              </Card>
            </SimpleGrid>

            {/* Quick Actions */}
            <Card shadow="sm" padding="lg" radius="md" className="bg-white">
              <Title order={3} className="text-gray-900 mb-4">Acciones Rápidas</Title>
              <Grid>
                <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
                  <Button
                    variant="gradient"
                    gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                    fullWidth
                    size="lg"
                    leftSection={<IconPlus size={20} />}
                    onClick={() => router.push('/eventos')}
                  >
                    Nuevo Evento
                  </Button>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
                  <Button
                    variant="gradient"
                    gradient={{ from: 'orange', to: 'red', deg: 90 }}
                    fullWidth
                    size="lg"
                    leftSection={<IconTool size={20} />}
                    onClick={() => router.push('/technical-visits')}
                  >
                    Visita Técnica
                  </Button>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
                  <Button
                    variant="gradient"
                    gradient={{ from: 'teal', to: 'lime', deg: 90 }}
                    fullWidth
                    size="lg"
                    leftSection={<IconPackage size={20} />}
                    onClick={() => router.push('/inventory')}
                  >
                    Agregar Item
                  </Button>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
                  <Button
                    variant="gradient"
                    gradient={{ from: 'indigo', to: 'purple', deg: 90 }}
                    fullWidth
                    size="lg"
                    leftSection={<IconBell size={20} />}
                    onClick={() => router.push('/notifications')}
                    rightSection={
                      unreadCount && unreadCount > 0 ? (
                        <Badge size="sm" color="red" variant="filled" circle>
                          {unreadCount}
                        </Badge>
                      ) : null
                    }
                  >
                    Notificaciones
                  </Button>
                </Grid.Col>
              </Grid>
            </Card>

            <Grid>
              {/* Próximos Eventos - Calendario */}
              <Grid.Col span={{ base: 12, lg: 6 }}>
                <Card shadow="sm" padding="lg" radius="md" className="bg-white" h="100%">
                  <Group justify="space-between" mb="md">
                    <Group gap="xs">
                      <ThemeIcon size="md" radius="md" color="blue" variant="light">
                        <IconCalendarEvent size={18} />
                      </ThemeIcon>
                      <Title order={3} className="text-gray-900">Próximos Eventos</Title>
                    </Group>
                    <Button
                      variant="subtle"
                      size="xs"
                      rightSection={<IconArrowUpRight size={14} />}
                      onClick={() => router.push('/eventos')}
                    >
                      Ver todos
                    </Button>
                  </Group>
                  <ScrollArea h={400}>
                    {upcomingEvents && upcomingEvents.length > 0 ? (
                      <Stack gap="sm">
                        {upcomingEvents.map((event) => (
                          <Paper
                            key={event.id}
                            p="md"
                            withBorder
                            radius="md"
                            className="hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => router.push('/eventos')}
                          >
                            <Group justify="space-between" mb="xs">
                              <Group gap="xs">
                                <ThemeIcon
                                  size="sm"
                                  radius="md"
                                  color={getStatusColor(event.estado)}
                                  variant="light"
                                >
                                  {getStatusIcon(event.estado)}
                                </ThemeIcon>
                                <Text fw={600} size="sm">{event.nombreCliente}</Text>
                              </Group>
                              <Badge size="sm" color={getStatusColor(event.estado)}>
                                {event.estado}
                              </Badge>
                            </Group>
                            <Group gap="xs" mb="xs">
                              <IconCalendarEvent size={14} className="text-gray-400" />
                              <Text size="xs" c="dimmed">
                                {formatDate(event.startDate)} - {formatDate(event.endDate)}
                              </Text>
                            </Group>
                            <Group gap="xs" mb="xs">
                              <IconMapPin size={14} className="text-gray-400" />
                              <Text size="xs" c="dimmed" lineClamp={1}>
                                {event.direccion}
                              </Text>
                            </Group>
                            <Group justify="space-between">
                              <Text size="xs" c="dimmed">Monto:</Text>
                              <Text size="sm" fw={600} c="green">
                                {formatCurrency(Number(event.montoTotal))}
                              </Text>
                            </Group>
                          </Paper>
                        ))}
                      </Stack>
                    ) : (
                      <Center h={300}>
                        <Stack align="center" gap="sm">
                          <IconCalendarEvent size={48} className="text-gray-300" stroke={1.5} />
                          <Text c="dimmed">No hay eventos próximos</Text>
                        </Stack>
                      </Center>
                    )}
                  </ScrollArea>
                </Card>
              </Grid.Col>

              {/* Próximas Visitas Técnicas */}
              <Grid.Col span={{ base: 12, lg: 6 }}>
                <Card shadow="sm" padding="lg" radius="md" className="bg-white" h="100%">
                  <Group justify="space-between" mb="md">
                    <Group gap="xs">
                      <ThemeIcon size="md" radius="md" color="orange" variant="light">
                        <IconTool size={18} />
                      </ThemeIcon>
                      <Title order={3} className="text-gray-900">Próximas Visitas</Title>
                    </Group>
                    <Button
                      variant="subtle"
                      size="xs"
                      rightSection={<IconArrowUpRight size={14} />}
                      onClick={() => router.push('/technical-visits')}
                    >
                      Ver todas
                    </Button>
                  </Group>
                  <ScrollArea h={400}>
                    {upcomingVisits && upcomingVisits.length > 0 ? (
                      <Stack gap="sm">
                        {upcomingVisits.map((visit) => (
                          <Paper
                            key={visit.id}
                            p="md"
                            withBorder
                            radius="md"
                            className="hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => router.push('/technical-visits')}
                          >
                            <Group justify="space-between" mb="xs">
                              <Group gap="xs">
                                <ThemeIcon
                                  size="sm"
                                  radius="md"
                                  color={getStatusColor(visit.estado)}
                                  variant="light"
                                >
                                  {getStatusIcon(visit.estado)}
                                </ThemeIcon>
                                <Text fw={600} size="sm">{visit.nombreCliente}</Text>
                              </Group>
                              <Badge size="sm" color={getStatusColor(visit.estado)}>
                                {visit.estado}
                              </Badge>
                            </Group>
                            <Group gap="xs" mb="xs">
                              <IconCalendarEvent size={14} className="text-gray-400" />
                              <Text size="xs" c="dimmed">
                                {formatDate(visit.fechaVisita)} - {formatTime(visit.horaVisita)}
                              </Text>
                            </Group>
                            <Group gap="xs" mb="xs">
                              <IconMapPin size={14} className="text-gray-400" />
                              <Text size="xs" c="dimmed" lineClamp={1}>
                                {visit.direccion}
                              </Text>
                            </Group>
                            {visit.assignedUser && (
                              <Group gap="xs">
                                <IconUser size={14} className="text-gray-400" />
                                <Text size="xs" c="dimmed">
                                  Asignado a: {visit.assignedUser.name}
                                </Text>
                              </Group>
                            )}
                          </Paper>
                        ))}
                      </Stack>
                    ) : (
                      <Center h={300}>
                        <Stack align="center" gap="sm">
                          <IconTool size={48} className="text-gray-300" stroke={1.5} />
                          <Text c="dimmed">No hay visitas próximas</Text>
                        </Stack>
                      </Center>
                    )}
                  </ScrollArea>
                </Card>
              </Grid.Col>
            </Grid>

            {/* Analytics and Activity */}
            <Grid>
              {/* Event Status Distribution */}
              <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
                <Card shadow="sm" padding="lg" radius="md" className="bg-white" h="100%">
                  <Title order={4} className="text-gray-900 mb-md">
                    Estado de Eventos
                  </Title>
                  <Center>
                    <RingProgress
                      size={180}
                      thickness={16}
                      sections={
                        eventsByStatus?.map((item) => ({
                          value: totalEvents > 0 ? (item.count / totalEvents) * 100 : 0,
                          color: getStatusColor(item.status),
                          tooltip: `${item.status}: ${item.count}`,
                        })) || []
                      }
                      label={
                        <Center>
                          <Stack gap={0} align="center">
                            <Text size="xl" fw={700}>
                              {totalEvents}
                            </Text>
                            <Text size="xs" c="dimmed">
                              Total
                            </Text>
                          </Stack>
                        </Center>
                      }
                    />
                  </Center>
                  <Stack gap="xs" mt="md">
                    {eventsByStatus?.map((item) => (
                      <Group key={item.status} justify="space-between">
                        <Group gap="xs">
                          <Box
                            w={12}
                            h={12}
                            style={{
                              backgroundColor: `var(--mantine-color-${getStatusColor(item.status)}-6)`,
                              borderRadius: "2px",
                            }}
                          />
                          <Text size="sm">{item.status}</Text>
                        </Group>
                        <Text size="sm" fw={600}>
                          {item.count}
                        </Text>
                      </Group>
                    ))}
                  </Stack>
                  <Divider my="md" />
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>Tasa de Completitud</Text>
                    <Text size="sm" fw={700} c="green">
                      {completionRate.toFixed(1)}%
                    </Text>
                  </Group>
                  <Progress value={completionRate} color="green" size="sm" mt="xs" />
                </Card>
              </Grid.Col>

              {/* Recent Activity Timeline */}
              <Grid.Col span={{ base: 12, md: 6, lg: 8 }}>
                <Card shadow="sm" padding="lg" radius="md" className="bg-white" h="100%">
                  <Title order={4} className="text-gray-900 mb-md">
                    Actividad Reciente
                  </Title>
                  <ScrollArea h={350}>
                    <Timeline active={-1} bulletSize={24} lineWidth={2}>
                      {recentActivity?.events.map((event) => (
                        <Timeline.Item
                          key={`event-${event.id}`}
                          bullet={<IconCalendarEvent size={12} />}
                          title={
                            <Group gap="xs">
                              <Text size="sm" fw={500}>Evento creado</Text>
                              <Badge size="xs" color={getStatusColor(event.estado)}>
                                {event.estado}
                              </Badge>
                            </Group>
                          }
                        >
                          <Text size="sm" c="dimmed">{event.nombreCliente}</Text>
                          <Text size="xs" c="dimmed" mt={4}>
                            {formatDate(event.createdAt)}
                          </Text>
                        </Timeline.Item>
                      ))}
                      {recentActivity?.visits.map((visit) => (
                        <Timeline.Item
                          key={`visit-${visit.id}`}
                          bullet={<IconTool size={12} />}
                          title={
                            <Group gap="xs">
                              <Text size="sm" fw={500}>Visita programada</Text>
                              <Badge size="xs" color={getStatusColor(visit.estado)}>
                                {visit.estado}
                              </Badge>
                            </Group>
                          }
                        >
                          <Text size="sm" c="dimmed">{visit.nombreCliente}</Text>
                          <Text size="xs" c="dimmed" mt={4}>
                            {formatDate(visit.createdAt)}
                          </Text>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  </ScrollArea>
                </Card>
              </Grid.Col>
            </Grid>
          </Stack>
        </div>
      </div>
    </MainLayout>
  );
}
