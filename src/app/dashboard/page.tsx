"use client";

import { useState } from "react";
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
  SegmentedControl,
  ActionIcon,
  Indicator,
  Popover,
} from '@mantine/core';
import { Calendar } from '@mantine/dates';
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
  IconList,
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
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

  // Estados para la vista de calendario
  const [eventsView, setEventsView] = useState<"list" | "calendar">("calendar");
  const [visitsView, setVisitsView] = useState<"list" | "calendar">("calendar");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentVisitsMonth, setCurrentVisitsMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedVisitDate, setSelectedVisitDate] = useState<Date | null>(null);

  // Redirigir si no hay sesión
  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  if (status === "loading" || statsLoading) {
    return (
      <MainLayout>
        <Center className="h-64">
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text size="sm" c="dimmed">Cargando dashboard...</Text>
          </Stack>
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

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "America/Santiago",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Funciones para el calendario
  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const getLocalDate = (dateString: Date | string) => {
    const date = new Date(dateString);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  const getDayEvents = (date: Date) => {
    if (!upcomingEvents) return [];
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    return upcomingEvents
      .map((event) => {
        const montajeDate = getLocalDate(event.horaInicio);
        const eventoStartDate = getLocalDate(event.startDate);
        const eventoEndDate = getLocalDate(event.endDate);
        const desmonteDate = getLocalDate(event.horaTermino);
        
        const types = [];
        
        // Verificar si es día de montaje
        if (checkDate.getTime() === montajeDate.getTime()) {
          types.push('montaje');
        }
        
        // Verificar si está dentro del rango del evento
        if (checkDate.getTime() >= eventoStartDate.getTime() && 
            checkDate.getTime() <= eventoEndDate.getTime()) {
          types.push('evento');
        }
        
        // Verificar si es día de desmontaje
        if (checkDate.getTime() === desmonteDate.getTime()) {
          types.push('desmontaje');
        }
        
        return types.length > 0 ? { ...event, types } : null;
      })
      .filter((event): event is typeof upcomingEvents[0] & { types: string[] } => event !== null);
  };

  const hasEventsOnDay = (date: Date) => {
    return getDayEvents(date).length > 0;
  };

  const getEventsForSelectedDate = () => {
    if (!selectedDate) return [];
    return getDayEvents(selectedDate);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Funciones para visitas técnicas
  const getDayVisits = (date: Date) => {
    if (!upcomingVisits) return [];
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    return upcomingVisits.filter((visit) => {
      const visitDate = getLocalDate(visit.fechaVisita);
      return checkDate.getTime() === visitDate.getTime();
    });
  };

  const hasVisitsOnDay = (date: Date) => {
    return getDayVisits(date).length > 0;
  };

  const getVisitsForSelectedDate = () => {
    if (!selectedVisitDate) return [];
    return getDayVisits(selectedVisitDate);
  };

  const goToPreviousVisitsMonth = () => {
    setCurrentVisitsMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextVisitsMonth = () => {
    setCurrentVisitsMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToTodayVisits = () => {
    setCurrentVisitsMonth(new Date());
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

            {/* Info Card - Calendario */}
            <Paper p="md" radius="md" className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500">
              <Group gap="sm">
                <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                  <IconCalendarEvent size={24} />
                </ThemeIcon>
                <div style={{ flex: 1 }}>
                  <Text fw={600} size="sm" mb={4}>
                    📅 Nuevo Sistema de Calendario
                  </Text>
                  <Text size="xs" c="dimmed">
                    El calendario ahora muestra claramente las fechas de <strong style={{ color: '#fd7e14' }}>montaje</strong>, 
                    el <strong style={{ color: '#228be6' }}>evento</strong> y el <strong style={{ color: '#be4bdb' }}>desmontaje</strong> con 
                    indicadores de colores diferenciados. Haz clic en cualquier día para ver los detalles.
                  </Text>
                </div>
              </Group>
            </Paper>

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
              {/* Próximos Eventos - Lista/Calendario */}
              <Grid.Col span={{ base: 12, lg: 6 }}>
                <Card shadow="sm" padding="lg" radius="md" className="bg-white" h="100%">
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Group gap="xs">
                        <ThemeIcon size="md" radius="md" color="blue" variant="light">
                          <IconCalendarEvent size={18} />
                        </ThemeIcon>
                        <Title order={3} className="text-gray-900">Montajes y Desmontajes</Title>
                      </Group>
                      <Group gap="xs">
                        <SegmentedControl
                          value={eventsView}
                          onChange={(value) => setEventsView(value as "list" | "calendar")}
                          data={[
                            { label: <IconCalendar size={16} />, value: "calendar" },
                            { label: <IconList size={16} />, value: "list" },
                          ]}
                          size="xs"
                        />
                        <Button
                          variant="subtle"
                          size="xs"
                          rightSection={<IconArrowUpRight size={14} />}
                          onClick={() => router.push('/eventos')}
                        >
                          Ver todos
                        </Button>
                      </Group>
                    </Group>

                    {eventsView === "calendar" ? (
                      <Stack gap="sm">
                        {/* Leyenda de colores */}
                        <Paper p="xs" withBorder bg="gray.0">
                          <Text size="xs" fw={600} mb={6} c="dimmed">Leyenda:</Text>
                          <Group gap="xs" wrap="wrap">
                            <Group gap={4}>
                              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#fd7e14' }} />
                              <Text size="xs" c="dimmed">Montaje</Text>
                            </Group>
                            <Group gap={4}>
                              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#228be6' }} />
                              <Text size="xs" c="dimmed">Evento</Text>
                            </Group>
                            <Group gap={4}>
                              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#be4bdb' }} />
                              <Text size="xs" c="dimmed">Desmontaje</Text>
                            </Group>
                          </Group>
                        </Paper>
                        
                        {/* Navegación del mes */}
                        <Group justify="space-between" align="center">
                          <ActionIcon variant="subtle" onClick={goToPreviousMonth}>
                            <IconChevronLeft size={18} />
                          </ActionIcon>
                          <Text fw={600}>
                            {currentMonth.toLocaleDateString("es-CL", { month: "long", year: "numeric" })}
                          </Text>
                          <ActionIcon variant="subtle" onClick={goToNextMonth}>
                            <IconChevronRight size={18} />
                          </ActionIcon>
                        </Group>
                        <Button size="xs" variant="light" onClick={goToToday} fullWidth>
                          Hoy
                        </Button>

                        {/* Calendario */}
                        <div style={{ width: "100%" }}>
                          <Calendar
                            date={currentMonth}
                            onDateChange={(date) => setCurrentMonth(new Date(date))}
                            getDayProps={(dateString) => {
                              const date = new Date(dateString);
                              const hasEvents = hasEventsOnDay(date);
                              const isSelected = selectedDate && isSameDay(date, selectedDate);
                              const eventsCount = getDayEvents(date).length;
                              
                              return {
                                onClick: () => setSelectedDate(date),
                                style: {
                                  backgroundColor: isSelected ? "#228be6" : hasEvents ? "#e7f5ff" : undefined,
                                  color: isSelected ? "white" : hasEvents ? "#228be6" : undefined,
                                  fontWeight: hasEvents ? 700 : 400,
                                  position: "relative" as const,
                                  borderRadius: "8px",
                                  transition: "all 0.2s ease",
                                },
                                children: (
                                  <div style={{ position: "relative", width: "100%", height: "100%" }}>
                                    <div style={{ paddingTop: "8px" }}>{date.getDate()}</div>
                                    {hasEvents && (
                                      <div
                                        style={{
                                          position: "absolute",
                                          bottom: "6px",
                                          left: "50%",
                                          transform: "translateX(-50%)",
                                          display: "flex",
                                          gap: "2px",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        {(() => {
                                          const dayEvents = getDayEvents(date);
                                          const allTypes = new Set(dayEvents.flatMap(e => e.types || []));
                                          const typesArray = Array.from(allTypes);
                                          
                                          return typesArray.map((type, i) => {
                                            let color = "#228be6"; // Azul por defecto
                                            if (type === 'montaje') color = "#fd7e14"; // Naranja
                                            if (type === 'evento') color = "#228be6"; // Azul
                                            if (type === 'desmontaje') color = "#be4bdb"; // Morado
                                            
                                            return (
                                              <div
                                                key={i}
                                                style={{
                                                  width: "6px",
                                                  height: "6px",
                                                  borderRadius: "50%",
                                                  backgroundColor: isSelected ? "white" : color,
                                                }}
                                              />
                                            );
                                          });
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                ),
                              };
                            }}
                            styles={{
                              calendarHeader: { maxWidth: "100%" },
                              month: { width: "100%" },
                              monthCell: { 
                                height: "60px",
                              },
                            }}
                          />
                        </div>

                        {/* Eventos del día seleccionado */}
                        {selectedDate && (
                          <Paper p="sm" withBorder>
                            <Text size="sm" fw={600} mb="xs">
                              Eventos para {formatDate(selectedDate)}
                            </Text>
                            {getEventsForSelectedDate().length > 0 ? (
                              <Stack gap="xs">
                                {getEventsForSelectedDate().map((event: any) => (
                                  <Paper
                                    key={event.id}
                                    p="xs"
                                    withBorder
                                    radius="sm"
                                    className="hover:shadow-sm transition-shadow cursor-pointer"
                                    onClick={() => router.push('/eventos')}
                                  >
                                    <Group justify="space-between" mb={4}>
                                      <Text size="xs" fw={600} lineClamp={1}>
                                        {event.nombreCliente}
                                      </Text>
                                      <Badge size="xs" color={getStatusColor(event.estado)}>
                                        {event.estado}
                                      </Badge>
                                    </Group>
                                    
                                    {/* Badges para tipo de evento */}
                                    <Group gap={4} mb={4}>
                                      {event.types?.includes('montaje') && (
                                        <Badge size="xs" color="orange" variant="dot">
                                          🏗️ Montaje
                                        </Badge>
                                      )}
                                      {event.types?.includes('evento') && (
                                        <Badge size="xs" color="blue" variant="dot">
                                          🎉 Evento
                                        </Badge>
                                      )}
                                      {event.types?.includes('desmontaje') && (
                                        <Badge size="xs" color="grape" variant="dot">
                                          🔧 Desmontaje
                                        </Badge>
                                      )}
                                    </Group>
                                    
                                    {/* Horarios según el tipo */}
                                    <Stack gap={2}>
                                      {event.types?.includes('montaje') && (
                                        <Text size="xs" c="orange">
                                          Montaje: {new Date(event.horaInicio).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                                        </Text>
                                      )}
                                      {event.types?.includes('evento') && (
                                        <Text size="xs" c="blue">
                                          Evento: {new Date(event.startDate).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })} - {new Date(event.endDate).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                                        </Text>
                                      )}
                                      {event.types?.includes('desmontaje') && (
                                        <Text size="xs" c="grape">
                                          Desmontaje: {new Date(event.horaTermino).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                                        </Text>
                                      )}
                                    </Stack>
                                    
                                    <Text size="xs" c="dimmed" lineClamp={1} mt={4}>
                                      <IconMapPin size={12} style={{ display: "inline", marginRight: 4 }} />
                                      {event.direccion}
                                    </Text>
                                  </Paper>
                                ))}
                              </Stack>
                            ) : (
                              <Text size="xs" c="dimmed" ta="center" py="sm">
                                No hay eventos este día
                              </Text>
                            )}
                          </Paper>
                        )}
                      </Stack>
                    ) : (
                      <ScrollArea h={400}>
                        {upcomingEvents && upcomingEvents.length > 0 ? (
                          <Stack gap="sm">
                            {upcomingEvents.map((event: any) => (
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
                                
                                <Divider my="xs" label="🎉 Evento" labelPosition="left" size="xs" />
                                <Group gap="xs" mb="xs">
                                  <IconCalendarEvent size={14} className="text-blue-500" />
                                  <Text size="xs" c="blue">
                                    {formatDate(event.startDate)} - {formatDate(event.endDate)}
                                  </Text>
                                </Group>
                                
                                <Divider my="xs" label="🏗️ Logística" labelPosition="left" size="xs" />
                                <Stack gap={4} mb="xs">
                                  <Group gap="xs">
                                    <Text size="xs" c="orange" fw={500}>Montaje:</Text>
                                    <Text size="xs" c="dimmed">
                                      {formatDate(event.horaInicio)} {new Date(event.horaInicio).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                                    </Text>
                                  </Group>
                                  <Group gap="xs">
                                    <Text size="xs" c="grape" fw={500}>Desmontaje:</Text>
                                    <Text size="xs" c="dimmed">
                                      {formatDate(event.horaTermino)} {new Date(event.horaTermino).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                                    </Text>
                                  </Group>
                                </Stack>
                                
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
                    )}
                  </Stack>
                </Card>
              </Grid.Col>

              {/* Próximas Visitas Técnicas - Lista/Calendario */}
              <Grid.Col span={{ base: 12, lg: 6 }}>
                <Card shadow="sm" padding="lg" radius="md" className="bg-white" h="100%">
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Group gap="xs">
                        <ThemeIcon size="md" radius="md" color="orange" variant="light">
                          <IconTool size={18} />
                        </ThemeIcon>
                        <Title order={3} className="text-gray-900">Próximas Visitas</Title>
                      </Group>
                      <Group gap="xs">
                        <SegmentedControl
                          value={visitsView}
                          onChange={(value) => setVisitsView(value as "list" | "calendar")}
                          data={[
                            { label: <IconCalendar size={16} />, value: "calendar" },
                            { label: <IconList size={16} />, value: "list" },
                          ]}
                          size="xs"
                        />
                        <Button
                          variant="subtle"
                          size="xs"
                          rightSection={<IconArrowUpRight size={14} />}
                          onClick={() => router.push('/technical-visits')}
                        >
                          Ver todas
                        </Button>
                      </Group>
                    </Group>

                    {visitsView === "calendar" ? (
                      <Stack gap="sm">
                        {/* Navegación del mes */}
                        <Group justify="space-between" align="center">
                          <ActionIcon variant="subtle" onClick={goToPreviousVisitsMonth}>
                            <IconChevronLeft size={18} />
                          </ActionIcon>
                          <Text fw={600}>
                            {currentVisitsMonth.toLocaleDateString("es-CL", { month: "long", year: "numeric" })}
                          </Text>
                          <ActionIcon variant="subtle" onClick={goToNextVisitsMonth}>
                            <IconChevronRight size={18} />
                          </ActionIcon>
                        </Group>
                        <Button size="xs" variant="light" onClick={goToTodayVisits} fullWidth>
                          Hoy
                        </Button>

                        {/* Calendario */}
                        <div style={{ width: "100%" }}>
                          <Calendar
                            date={currentVisitsMonth}
                            onDateChange={(date) => setCurrentVisitsMonth(new Date(date))}
                            getDayProps={(dateString) => {
                              const date = new Date(dateString);
                              const hasVisits = hasVisitsOnDay(date);
                              const isSelected = selectedVisitDate && isSameDay(date, selectedVisitDate);
                              const visitsCount = getDayVisits(date).length;
                              
                              return {
                                onClick: () => setSelectedVisitDate(date),
                                style: {
                                  backgroundColor: isSelected ? "#fd7e14" : hasVisits ? "#fff4e6" : undefined,
                                  color: isSelected ? "white" : hasVisits ? "#fd7e14" : undefined,
                                  fontWeight: hasVisits ? 700 : 400,
                                  position: "relative" as const,
                                  borderRadius: "8px",
                                  transition: "all 0.2s ease",
                                },
                                children: (
                                  <div style={{ position: "relative", width: "100%", height: "100%" }}>
                                    <div style={{ paddingTop: "8px" }}>{date.getDate()}</div>
                                    {hasVisits && (
                                      <div
                                        style={{
                                          position: "absolute",
                                          bottom: "6px",
                                          left: "50%",
                                          transform: "translateX(-50%)",
                                          display: "flex",
                                          gap: "2px",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        {Array.from({ length: Math.min(visitsCount, 3) }).map((_, i) => (
                                          <div
                                            key={i}
                                            style={{
                                              width: "5px",
                                              height: "5px",
                                              borderRadius: "50%",
                                              backgroundColor: isSelected ? "white" : "#fd7e14",
                                            }}
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ),
                              };
                            }}
                            styles={{
                              calendarHeader: { maxWidth: "100%" },
                              month: { width: "100%" },
                              monthCell: { 
                                height: "60px",
                              },
                            }}
                          />
                        </div>

                        {/* Visitas del día seleccionado */}
                        {selectedVisitDate && (
                          <Paper p="sm" withBorder>
                            <Text size="sm" fw={600} mb="xs">
                              Visitas para {formatDate(selectedVisitDate)}
                            </Text>
                            {getVisitsForSelectedDate().length > 0 ? (
                              <Stack gap="xs">
                                {getVisitsForSelectedDate().map((visit: any) => (
                                  <Paper
                                    key={visit.id}
                                    p="xs"
                                    withBorder
                                    radius="sm"
                                    className="hover:shadow-sm transition-shadow cursor-pointer"
                                    onClick={() => router.push('/technical-visits')}
                                  >
                                    <Group justify="space-between" mb={4}>
                                      <Text size="xs" fw={600} lineClamp={1}>
                                        {visit.nombreCliente}
                                      </Text>
                                      <Badge size="xs" color={getStatusColor(visit.estado)}>
                                        {visit.estado}
                                      </Badge>
                                    </Group>
                                    
                                    <Text size="xs" c="orange" fw={500} mb={2}>
                                      🔧 {new Date(visit.horaVisita).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                                    </Text>
                                    
                                    <Text size="xs" c="dimmed" lineClamp={1}>
                                      <IconMapPin size={12} style={{ display: "inline", marginRight: 4 }} />
                                      {visit.direccion}
                                    </Text>
                                    
                                    {visit.assignedUser && (
                                      <Text size="xs" c="dimmed" mt={2}>
                                        <IconUser size={12} style={{ display: "inline", marginRight: 4 }} />
                                        {visit.assignedUser.name}
                                      </Text>
                                    )}
                                  </Paper>
                                ))}
                              </Stack>
                            ) : (
                              <Text size="xs" c="dimmed" ta="center" py="sm">
                                No hay visitas este día
                              </Text>
                            )}
                          </Paper>
                        )}
                      </Stack>
                    ) : (
                      <ScrollArea h={400}>
                        {upcomingVisits && upcomingVisits.length > 0 ? (
                          <Stack gap="sm">
                            {upcomingVisits.map((visit: any) => (
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
                                
                                <Divider my="xs" label="🔧 Visita Técnica" labelPosition="left" size="xs" />
                                <Group gap="xs" mb="xs">
                                  <IconCalendarEvent size={14} className="text-orange-500" />
                                  <Text size="xs" c="orange" fw={500}>
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
                    )}
                  </Stack>
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
