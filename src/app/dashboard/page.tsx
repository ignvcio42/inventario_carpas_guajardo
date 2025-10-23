"use client";

import { useSession } from "next-auth/react";
import MainLayout from "../_components/main-layout";
import { 
  Grid, 
  Card, 
  Text, 
  Group, 
  Avatar, 
  Badge, 
  Button, 
  Stack, 
  Title, 
  Box,
  ThemeIcon,
  Loader,
  Center
} from '@mantine/core';
import { 
  IconCalendarEvent, 
  IconPackage, 
  IconTool, 
  IconCurrencyDollar,
  IconPlus,
  IconClock
} from '@tabler/icons-react';

export default function Dashboard() {
  const { data: session, status } = useSession();

  if (status === "loading") {
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
          <div className="flex flex-col gap-6">
            {/* Welcome Section */}
            <Card shadow="sm" padding="lg" radius="md" className="bg-white">
              <Title order={1} className="text-gray-900 mb-2">
                ¡Bienvenido, {session?.user?.name}! 👋
              </Title>
              <Text c="dimmed">
                Sistema de gestión de inventario para eventos y carpas
              </Text>
            </Card>

            {/* Stats Cards */}
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <Card shadow="sm" padding="lg" radius="md" className="bg-white">
                  <Group>
                    <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                      <IconCalendarEvent size={24} />
                    </ThemeIcon>
                    <Box>
                      <Text size="sm" c="dimmed">Eventos Activos</Text>
                      <Text size="xl" fw={700}>12</Text>
                    </Box>
                  </Group>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <Card shadow="sm" padding="lg" radius="md" className="bg-white">
                  <Group>
                    <ThemeIcon size="lg" radius="md" color="green" variant="light">
                      <IconPackage size={24} />
                    </ThemeIcon>
                    <Box>
                      <Text size="sm" c="dimmed">Items en Stock</Text>
                      <Text size="xl" fw={700}>156</Text>
                    </Box>
                  </Group>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <Card shadow="sm" padding="lg" radius="md" className="bg-white">
                  <Group>
                    <ThemeIcon size="lg" radius="md" color="yellow" variant="light">
                      <IconTool size={24} />
                    </ThemeIcon>
                    <Box>
                      <Text size="sm" c="dimmed">Visitas Pendientes</Text>
                      <Text size="xl" fw={700}>5</Text>
                    </Box>
                  </Group>
                </Card>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <Card shadow="sm" padding="lg" radius="md" className="bg-white">
                  <Group>
                    <ThemeIcon size="lg" radius="md" color="purple" variant="light">
                      <IconCurrencyDollar size={24} />
                    </ThemeIcon>
                    <Box>
                      <Text size="sm" c="dimmed">Ingresos del Mes</Text>
                      <Text size="xl" fw={700}>$2.4M</Text>
                    </Box>
                  </Group>
                </Card>
              </Grid.Col>
            </Grid>

            {/* Quick Actions */}
            <Card shadow="sm" padding="lg" radius="md" className="bg-white">
              <Title order={3} className="text-gray-900 mb-4">Acciones Rápidas</Title>
              <Grid>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Button
                    variant="outline"
                    fullWidth
                    size="lg"
                    leftSection={<IconPlus size={20} />}
                    className="h-24 border-dashed"
                    styles={{
                      root: {
                        borderStyle: 'dashed',
                        '&:hover': {
                          borderColor: 'var(--mantine-color-indigo-5)',
                          backgroundColor: 'var(--mantine-color-indigo-0)',
                        }
                      }
                    }}
                  >
                    <Stack gap="xs" align="center">
                      <Text fw={500}>Nuevo Evento</Text>
                      <Text size="xs" c="dimmed">Crear un nuevo evento</Text>
                    </Stack>
                  </Button>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Button
                    variant="outline"
                    fullWidth
                    size="lg"
                    leftSection={<IconTool size={20} />}
                    className="h-24 border-dashed"
                    styles={{
                      root: {
                        borderStyle: 'dashed',
                        '&:hover': {
                          borderColor: 'var(--mantine-color-indigo-5)',
                          backgroundColor: 'var(--mantine-color-indigo-0)',
                        }
                      }
                    }}
                  >
                    <Stack gap="xs" align="center">
                      <Text fw={500}>Visita Técnica</Text>
                      <Text size="xs" c="dimmed">Programar visita</Text>
                    </Stack>
                  </Button>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Button
                    variant="outline"
                    fullWidth
                    size="lg"
                    leftSection={<IconPackage size={20} />}
                    className="h-24 border-dashed"
                    styles={{
                      root: {
                        borderStyle: 'dashed',
                        '&:hover': {
                          borderColor: 'var(--mantine-color-indigo-5)',
                          backgroundColor: 'var(--mantine-color-indigo-0)',
                        }
                      }
                    }}
                  >
                    <Stack gap="xs" align="center">
                      <Text fw={500}>Agregar Item</Text>
                      <Text size="xs" c="dimmed">Nuevo inventario</Text>
                    </Stack>
                  </Button>
                </Grid.Col>
              </Grid>
            </Card>

            {/* Recent Activity */}
            <Card shadow="sm" padding="lg" radius="md" className="bg-white">
              <Title order={3} className="text-gray-900 mb-4">Actividad Reciente</Title>
              <div className="space-y-4">
                <Group className="p-3 bg-gray-50 rounded-lg">
                  <ThemeIcon size="md" radius="md" color="blue" variant="light">
                    <IconCalendarEvent size={16} />
                  </ThemeIcon>
                  <Box style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>Evento "Fiesta de Cumpleaños" creado</Text>
                    <Text size="xs" c="dimmed">Hace 2 horas</Text>
                  </Box>
                </Group>

                <Group className="p-3 bg-gray-50 rounded-lg">
                  <ThemeIcon size="md" radius="md" color="green" variant="light">
                    <IconPackage size={16} />
                  </ThemeIcon>
                  <Box style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>Stock de "Carpa 10x10" actualizado</Text>
                    <Text size="xs" c="dimmed">Hace 4 horas</Text>
                  </Box>
                </Group>

                <Group className="p-3 bg-gray-50 rounded-lg">
                  <ThemeIcon size="md" radius="md" color="yellow" variant="light">
                    <IconTool size={16} />
                  </ThemeIcon>
                  <Box style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>Visita técnica completada</Text>
                    <Text size="xs" c="dimmed">Ayer</Text>
                  </Box>
                </Group>

                <Group className="p-3 bg-gray-50 rounded-lg">
                  <ThemeIcon size="md" radius="md" color="purple" variant="light">
                    <IconCurrencyDollar size={16} />
                  </ThemeIcon>
                  <Box style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>Pago recibido por evento "Boda María"</Text>
                    <Text size="xs" c="dimmed">Hace 1 día</Text>
                  </Box>
                </Group>

                <Group className="p-3 bg-gray-50 rounded-lg">
                  <ThemeIcon size="md" radius="md" color="blue" variant="light">
                    <IconCalendarEvent size={16} />
                  </ThemeIcon>
                  <Box style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>Evento "Graduación Universidad" programado</Text>
                    <Text size="xs" c="dimmed">Hace 2 días</Text>
                  </Box>
                </Group>

                <Group className="p-3 bg-gray-50 rounded-lg">
                  <ThemeIcon size="md" radius="md" color="green" variant="light">
                    <IconPackage size={16} />
                  </ThemeIcon>
                  <Box style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>Nueva carpa agregada al inventario</Text>
                    <Text size="xs" c="dimmed">Hace 3 días</Text>
                  </Box>
                </Group>

                <Group className="p-3 bg-gray-50 rounded-lg">
                  <ThemeIcon size="md" radius="md" color="yellow" variant="light">
                    <IconTool size={16} />
                  </ThemeIcon>
                  <Box style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>Mantenimiento de equipos completado</Text>
                    <Text size="xs" c="dimmed">Hace 1 semana</Text>
                  </Box>
                </Group>

                <Group className="p-3 bg-gray-50 rounded-lg">
                  <ThemeIcon size="md" radius="md" color="blue" variant="light">
                    <IconCalendarEvent size={16} />
                  </ThemeIcon>
                  <Box style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>Evento "Conferencia Empresarial" finalizado</Text>
                    <Text size="xs" c="dimmed">Hace 1 semana</Text>
                  </Box>
                </Group>

                <Group className="p-3 bg-gray-50 rounded-lg">
                  <ThemeIcon size="md" radius="md" color="green" variant="light">
                    <IconPackage size={16} />
                  </ThemeIcon>
                  <Box style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>Inventario de sillas actualizado</Text>
                    <Text size="xs" c="dimmed">Hace 2 semanas</Text>
                  </Box>
                </Group>

                <Group className="p-3 bg-gray-50 rounded-lg">
                  <ThemeIcon size="md" radius="md" color="purple" variant="light">
                    <IconCurrencyDollar size={16} />
                  </ThemeIcon>
                  <Box style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>Facturación mensual completada</Text>
                    <Text size="xs" c="dimmed">Hace 2 semanas</Text>
                  </Box>
                </Group>

                <Group className="p-3 bg-gray-50 rounded-lg">
                  <ThemeIcon size="md" radius="md" color="yellow" variant="light">
                    <IconTool size={16} />
                  </ThemeIcon>
                  <Box style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>Inspección de seguridad realizada</Text>
                    <Text size="xs" c="dimmed">Hace 3 semanas</Text>
                  </Box>
                </Group>

                <Group className="p-3 bg-gray-50 rounded-lg">
                  <ThemeIcon size="md" radius="md" color="blue" variant="light">
                    <IconCalendarEvent size={16} />
                  </ThemeIcon>
                  <Box style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>Evento "Feria Comercial" programado</Text>
                    <Text size="xs" c="dimmed">Hace 1 mes</Text>
                  </Box>
                </Group>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}


