"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import bcrypt from "bcryptjs";
import { 
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
  ThemeIcon
} from '@mantine/core';
import { IconBrandGoogle, IconAlertCircle, IconCalendarEvent, IconShield, IconUserPlus } from '@tabler/icons-react';

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setIsLoading(false);
      return;
    }

    try {
      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(formData.password, 12);

      // Crear usuario
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: hashedPassword,
        }),
      });

      if (response.ok) {
        // Iniciar sesión automáticamente
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.ok) {
          router.push("/dashboard");
        } else {
          setError("Usuario creado, pero error al iniciar sesión");
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Error al crear usuario");
      }
    } catch (error) {
      setError("Error al crear usuario");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      <Grid className="h-screen" gutter={0} style={{ margin: 0 }}>
        {/* Lado izquierdo - Imagen y branding */}
        <Grid.Col span={{ base: 0, md: 6 }} className="hidden md:block" style={{ height: '100vh' }}>
          <div className="h-full bg-gradient-to-br from-emerald-600 to-teal-700 flex flex-col justify-center items-center p-12 text-white relative overflow-hidden">
            {/* Patrón de fondo */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full"></div>
              <div className="absolute bottom-20 right-20 w-24 h-24 bg-white rounded-full"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white rounded-full"></div>
            </div>
            
            <div className="relative z-10 text-center max-w-md">
              <ThemeIcon size={80} radius="xl" color="white" variant="light" className="mx-auto mb-6">
                <IconUserPlus size={40} color="#059669" />
              </ThemeIcon>
              
              <Title order={1} className="text-white mb-4" size="h2">
                Únete a Carpas Guajardo
              </Title>
              
              <Text size="lg" className="text-emerald-100 mb-8 leading-relaxed">
                Comienza tu experiencia profesional en la gestión de eventos. 
                Accede a herramientas avanzadas y simplifica tu trabajo diario.
              </Text>
              
              <div className="flex justify-center space-x-6">
                <div className="text-center">
                  <ThemeIcon size={50} radius="md" color="white" variant="light">
                    <IconCalendarEvent size={24} color="#059669" />
                  </ThemeIcon>
                  <Text size="sm" className="text-emerald-100 mt-2">Eventos</Text>
                </div>
                <div className="text-center">
                  <ThemeIcon size={50} radius="md" color="white" variant="light">
                    <IconShield size={24} color="#059669" />
                  </ThemeIcon>
                  <Text size="sm" className="text-emerald-100 mt-2">Seguridad</Text>
                </div>
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
                <ThemeIcon size={60} radius="xl" color="emerald" variant="light" className="mx-auto mb-4">
                  <IconUserPlus size={30} />
                </ThemeIcon>
                <Title order={2} className="text-gray-900 mb-2">
                  Carpas Guajardo
                </Title>
                <Text size="sm" c="dimmed">
                  Sistema de Inventario de Carpas
                </Text>
              </div>

              <Paper shadow="xl" p="lg" radius="lg" className="bg-white/80 backdrop-blur-sm border border-white/20">
                <Stack gap="sm">
                  {/* Logo/Branding */}
                  <Box ta="center">
                    <Title order={1} className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 mb-1" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                      Carpas Guajardo
                    </Title>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: '0.1em' }}>
                      Sistema de Gestión
                    </Text>
                  </Box>

                  <Box ta="center" mt="xs">
                    <Title order={2} className="text-gray-900 mb-1">
                      Crear cuenta
                    </Title>
                    <Text size="sm" c="dimmed">
                      Únete a nuestro sistema profesional
                    </Text>
                  </Box>

                  <form onSubmit={handleSubmit}>
                    <Stack gap="sm">
                      <TextInput
                        label="Nombre completo"
                        placeholder="Tu nombre completo"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        size="sm"
                        styles={{
                          input: {
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            '&:focus': {
                              borderColor: '#059669',
                              boxShadow: '0 0 0 3px rgba(5, 150, 105, 0.1)',
                            }
                          }
                        }}
                      />

                      <TextInput
                        label="Email"
                        placeholder="tu@email.com"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        size="sm"
                        styles={{
                          input: {
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            '&:focus': {
                              borderColor: '#059669',
                              boxShadow: '0 0 0 3px rgba(5, 150, 105, 0.1)',
                            }
                          }
                        }}
                      />

                      <PasswordInput
                        label="Contraseña"
                        placeholder="Mínimo 6 caracteres"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        size="sm"
                        styles={{
                          input: {
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            '&:focus': {
                              borderColor: '#059669',
                              boxShadow: '0 0 0 3px rgba(5, 150, 105, 0.1)',
                            }
                          }
                        }}
                      />

                      <PasswordInput
                        label="Confirmar contraseña"
                        placeholder="Repite tu contraseña"
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        size="sm"
                        styles={{
                          input: {
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            '&:focus': {
                              borderColor: '#059669',
                              boxShadow: '0 0 0 3px rgba(5, 150, 105, 0.1)',
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
                        size="sm"
                        loading={isLoading}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all duration-200"
                        styles={{
                          root: {
                            borderRadius: '8px',
                            height: '38px',
                            fontWeight: 500,
                          }
                        }}
                      >
                        {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
                      </Button>
                    </Stack>
                  </form>

                  <Divider label="O continúa con" labelPosition="center" />

                  <Button
                    variant="outline"
                    fullWidth
                    size="sm"
                    leftSection={<IconBrandGoogle size={16} />}
                    onClick={handleGoogleSignUp}
                    styles={{
                      root: {
                        borderRadius: '8px',
                        height: '38px',
                        borderColor: '#e2e8f0',
                        '&:hover': {
                          borderColor: '#059669',
                          backgroundColor: '#f8fafc',
                        }
                      }
                    }}
                  >
                    Continuar con Google
                  </Button>

                  <Center>
                    <Text size="sm" c="dimmed">
                      ¿Ya tienes cuenta?{" "}
                      <Text
                        component={Link}
                        href="/auth/signin"
                        c="emerald"
                        fw={500}
                        td="none"
                        className="hover:underline"
                      >
                        Inicia sesión aquí
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


