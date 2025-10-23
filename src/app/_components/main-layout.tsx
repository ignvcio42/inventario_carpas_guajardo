"use client";

import { useState } from "react";
import Sidebar from "./sidebar";
import { AppShell, Burger, Title, Group, Box } from '@mantine/core';
import { IconMenu2 } from '@tabler/icons-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
          <Group justify="space-between" className="px-4 py-3">
            <Burger
              opened={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
              size="sm"
            />
            <Title order={4} className="text-gray-900">
              Carpas Guajardo
            </Title>
            <Box style={{ width: 32 }} /> {/* Spacer */}
          </Group>
        </header>

        {/* Page content */}
        <main className="flex-1 bg-gray-100 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
