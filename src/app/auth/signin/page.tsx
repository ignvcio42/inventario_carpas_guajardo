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
  Box
} from '@mantine/core';
import { IconBrandGoogle, IconAlertCircle } from '@tabler/icons-react';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Container size="xs" className="w-full">
        <Paper shadow="sm" p="xl" radius="md" className="w-full">
          <Stack gap="lg">
            <Box ta="center">
              <Title order={2} className="text-gray-900">
                Iniciar Sesión
              </Title>
              <Text size="sm" c="dimmed" mt="xs">
                Sistema de Inventario de Carpas
              </Text>
            </Box>

            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <TextInput
                  label="Email"
                  placeholder="Email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  size="md"
                />

                <PasswordInput
                  label="Contraseña"
                  placeholder="Contraseña"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  size="md"
                />

                {error && (
                  <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  fullWidth
                  size="md"
                  loading={isLoading}
                  disabled={isLoading}
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
            >
              Google
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
      </Container>
    </div>
  );
}


