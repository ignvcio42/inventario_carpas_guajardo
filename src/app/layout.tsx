import "~/styles/globals.css";
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import AuthProvider from "./_components/auth-provider";
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "Inventario Carpas Guajardo",
  description: "Sistema de gestión de inventario para eventos y carpas",
  icons: [
    // El formato .ico para la máxima compatibilidad (muchos navegadores lo buscan por defecto)
    { rel: "icon", url: "/favicon/favicon.ico" },
    
    // PNGs para navegadores modernos (Chrome, Firefox, etc.)
    { rel: "icon", type: "image/png", sizes: "16x16", url: "/favicon/favicon-16x16.png" },
    { rel: "icon", type: "image/png", sizes: "32x32", url: "/favicon/favicon-32x32.png" },

    // Ícono para dispositivos Apple (añadir a la pantalla de inicio)
    { rel: "apple-touch-icon", type: "image/png", sizes: "180x180", url: "/favicon/apple-touch-icon.png" },

    // Íconos de alta resolución para Android y PWA (Progressive Web App)
    { rel: "icon", type: "image/png", sizes: "192x192", url: "/favicon/android-chrome-192x192.png" },
    { rel: "icon", type: "image/png", sizes: "512x512", url: "/favicon/android-chrome-512x512.png" },
  ],
  
  // Enlazar al manifiesto web (necesario para el ícono y la experiencia PWA en Android/Chrome)
  manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${GeistSans.variable}`}>
      <body>
        <MantineProvider>
          <Notifications />
          <AuthProvider>
            <TRPCReactProvider>{children}</TRPCReactProvider>
          </AuthProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
