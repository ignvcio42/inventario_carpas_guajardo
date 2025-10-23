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
  icons: [{ rel: "icon", url: "/favicon.ico" }],
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
