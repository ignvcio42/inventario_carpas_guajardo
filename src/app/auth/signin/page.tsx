"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Container, 
  Paper, 
  TextInput, 
  PasswordInput, 
  Button, 
  Title, 
  Text, 
  Stack, 
  Divider, 
  Group,
  Alert,
  Center,
  Box,
  Grid,
  Image,
  ThemeIcon
} from '@mantine/core';
import { IconBrandGoogle, IconAlertCircle, IconCalendarEvent, IconShield, IconLogin } from '@tabler/icons-react';

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Credenciales inválidas");
      } else {
        // Verificar la sesión y redirigir
        const session = await getSession();
        if (session) {
          router.push("/dashboard");
        }
      }
    } catch (error) {
      setError("Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Grid className="min-h-screen" gutter={0} style={{ margin: 0 }}>
        {/* Lado izquierdo - Imagen y branding */}
        <Grid.Col span={{ base: 0, md: 6 }} className="hidden md:block" style={{ minHeight: '100vh' }}>
          <div className="h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex flex-col justify-between items-center p-16 text-white relative overflow-hidden">
            {/* Patrón de fondo */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full"></div>
              <div className="absolute bottom-20 right-20 w-24 h-24 bg-white rounded-full"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white rounded-full"></div>
            </div>
            
            {/* Contenido superior */}
            <div className="relative z-10 text-center max-w-lg">
              <ThemeIcon size={100} radius="xl" color="white" variant="light" className="mx-auto mb-8">
                <IconLogin size={50} color="#4f46e5" />
              </ThemeIcon>
              
              <Title order={1} className="text-white mb-6" size="h1">
                Bienvenido de vuelta
              </Title>
              
              <Text size="xl" className="text-indigo-100 mb-12 leading-relaxed">
                Accede a tu sistema profesional de gestión de inventario para eventos y carpas. 
                Continúa organizando, planificando y controlando todos tus proyectos de manera eficiente.
              </Text>
            </div>

            {/* Contenido inferior */}
            <div className="relative z-10 w-full max-w-lg">
              <div className="flex justify-center space-x-12">
                <div className="text-center">
                  <ThemeIcon size={60} radius="md" color="white" variant="light" className="mb-3">
                    <IconCalendarEvent size={28} color="#4f46e5" />
                  </ThemeIcon>
                  <Text size="md" className="text-indigo-100 font-medium">Gestión de Eventos</Text>
                </div>
                <div className="text-center">
                  <ThemeIcon size={60} radius="md" color="white" variant="light" className="mb-3">
                    <IconShield size={28} color="#4f46e5" />
                  </ThemeIcon>
                  <Text size="md" className="text-indigo-100 font-medium">Control Total</Text>
                </div>
              </div>
              
              {/* Información adicional */}
              <div className="mt-12 text-center">
                <Text size="sm" className="text-indigo-200">
                  Sistema desarrollado para profesionales del sector eventos
                </Text>
              </div>
            </div>
          </div>
        </Grid.Col>

        {/* Lado derecho - Formulario */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <div className="h-full flex items-center justify-center p-8">
            <div className="w-full max-w-md">
              {/* Header móvil */}
              <div className="md:hidden text-center mb-8">
                <ThemeIcon size={60} radius="xl" color="indigo" variant="light" className="mx-auto mb-4">
                  <IconLogin size={30} />
                </ThemeIcon>
                <Title order={2} className="text-gray-900 mb-2">
                  Carpas Guajardo
                </Title>
                <Text size="sm" c="dimmed">
                  Sistema de Inventario de Carpas
                </Text>
              </div>

              <Paper shadow="xl" p="xl" radius="lg" className="bg-white/80 backdrop-blur-sm border border-white/20">
                <Stack gap="lg">
                  {/* Logo/Branding */}
                  <Box ta="center">
                    <Title order={1} className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2" style={{ fontSize: '2rem', fontWeight: 800 }}>
                      Carpas Guajardo
                    </Title>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: '0.1em' }}>
                      Sistema de Gestión
                    </Text>
                  </Box>

                  <Box ta="center" mt="md">
                    <Title order={2} className="text-gray-900 mb-2">
                      Bienvenido de vuelta
                    </Title>
                    <Text size="sm" c="dimmed">
                      Inicia sesión en tu cuenta
                    </Text>
                  </Box>

                  <form onSubmit={handleSubmit}>
                    <Stack gap="md">
                      <TextInput
                        label="Email"
                        placeholder="tu@email.com"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        size="md"
                        styles={{
                          input: {
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            '&:focus': {
                              borderColor: '#4f46e5',
                              boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.1)',
                            }
                          }
                        }}
                      />

                      <PasswordInput
                        label="Contraseña"
                        placeholder="Tu contraseña"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        size="md"
                        styles={{
                          input: {
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            '&:focus': {
                              borderColor: '#4f46e5',
                              boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.1)',
                            }
                          }
                        }}
                      />

                      {error && (
                        <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" radius="md">
                          {error}
                        </Alert>
                      )}

                      <Button
                        type="submit"
                        fullWidth
                        size="md"
                        loading={isLoading}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                        styles={{
                          root: {
                            borderRadius: '8px',
                            height: '44px',
                            fontWeight: 500,
                          }
                        }}
                      >
                        {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                      </Button>
                    </Stack>
                  </form>

                  <Divider label="O continúa con" labelPosition="center" />

                  <Button
                    variant="outline"
                    fullWidth
                    size="md"
                    leftSection={<IconBrandGoogle size={16} />}
                    onClick={handleGoogleSignIn}
                    styles={{
                      root: {
                        borderRadius: '8px',
                        height: '44px',
                        borderColor: '#e2e8f0',
                        '&:hover': {
                          borderColor: '#4f46e5',
                          backgroundColor: '#f8fafc',
                        }
                      }
                    }}
                  >
                    Continuar con Google
                  </Button>

                  <Center>
                    <Text size="sm" c="dimmed">
                      ¿No tienes cuenta?{" "}
                      <Text
                        component={Link}
                        href="/auth/signup"
                        c="indigo"
                        fw={500}
                        td="none"
                        className="hover:underline"
                      >
                        Regístrate aquí
                      </Text>
                    </Text>
                  </Center>
                </Stack>
              </Paper>
            </div>
          </div>
        </Grid.Col>
      </Grid>
    </div>
  );
}


