"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  NavLink, 
  Avatar, 
  Text, 
  Group, 
  Badge, 
  Button, 
  Box,
  ScrollArea,
  Divider,
  Indicator,
} from '@mantine/core';
import { 
  IconDashboard, 
  IconCalendarEvent, 
  IconTool, 
  IconPackage, 
  IconBell, 
  IconSettings, 
  IconLogout,
  IconX,
  IconShield,
  IconPencil,
  IconUser,
  IconHammer,
  IconCurrencyDollar,
} from '@tabler/icons-react';
import { api } from "~/trpc/react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  badge?: number;
  disabled?: boolean;
  underConstruction?: boolean;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { data: unreadCount } = api.notification.getUnreadCount.useQuery();
  const { data: isAdmin } = api.admin.isAdmin.useQuery();

  const navigation: NavigationItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: IconDashboard },
    { name: "Eventos", href: "/eventos", icon: IconCalendarEvent },
    { name: "Visitas Técnicas", href: "/technical-visits", icon: IconTool },
    { name: "Inventario", href: "/inventory", icon: IconPackage },
    { name: "Bocetos", href: "/sketches", icon: IconPencil },
    { name: "Notificaciones", href: "/notifications", icon: IconBell, badge: unreadCount },
    ...(isAdmin ? [{ name: "Panel Admin", href: "/admin", icon: IconShield }] : []),
    { name: "Clientes", href: "/clientes", icon: IconUser, disabled: true, underConstruction: true },
    { name: "Cotizaciones", href: "/cotizaciones", icon: IconCurrencyDollar, disabled: true, underConstruction: true },
    { name: "Configuración", href: "/settings", icon: IconSettings },
  ] as NavigationItem[];

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" });
  };

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <Group justify="space-between" className="p-4 border-b">
            <Text size="xl" fw={700} className="text-gray-900">
              Carpas Guajardo
            </Text>
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Cerrar menú"
            >
              <IconX size={20} />
            </button>
          </Group>

          {/* User Info */}
          <Box className="p-4 border-b bg-gray-50">
            <Group>
              <Avatar
                src={session?.user?.image}
                size="md"
                radius="xl"
                color="indigo"
              >
                {session?.user?.name?.charAt(0) || "U"}
              </Avatar>
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" fw={500} className="text-gray-900 truncate">
                  {session?.user?.name || "Usuario"}
                </Text>
                <Text size="xs" className="text-gray-500 truncate">
                  {session?.user?.email}
                </Text>
                <Badge size="xs" color="indigo" variant="light">
                  {session?.user?.role || "ADMIN"}
                </Badge>
              </Box>
            </Group>
          </Box>

          {/* Navigation */}
          <ScrollArea className="flex-1">
            <Box className="px-4 py-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const IconComponent = item.icon;
                const showBadge = item.badge && Number(item.badge) > 0;
                const isDisabled = item.disabled;
                const isUnderConstruction = item.underConstruction;
                
                if (isDisabled) {
                  return (
                    <Box
                      key={item.name}
                      className="mb-1 p-2 rounded-md opacity-60 cursor-not-allowed"
                      style={{
                        borderRadius: '6px',
                      }}
                    >
                      <Group>
                        {showBadge ? (
                          <Indicator color="red" size={8} processing>
                            <IconComponent size={16} color="#9ca3af" />
                          </Indicator>
                        ) : (
                          <IconComponent size={16} color="#9ca3af" />
                        )}
                        <Group justify="space-between" style={{ flex: 1 }}>
                          <Text size="sm" c="dimmed">
                            {item.name}
                          </Text>
                          <Group gap="xs">
                            {isUnderConstruction && (
                              <Badge size="xs" color="orange" variant="light">
                                <Group gap={4}>
                                  <IconHammer size={10} />
                                  <Text size="xs">En construcción</Text>
                                </Group>
                              </Badge>
                            )}
                            {showBadge && (
                              <Badge size="xs" color="red" variant="filled" circle>
                                {item.badge}
                              </Badge>
                            )}
                          </Group>
                        </Group>
                      </Group>
                    </Box>
                  );
                }

                return (
                  <NavLink
                    key={item.name}
                    component={Link}
                    href={item.href}
                    label={
                      <Group justify="space-between" style={{ flex: 1 }}>
                        <Text size="sm">{item.name}</Text>
                        {showBadge && (
                          <Badge size="xs" color="red" variant="filled" circle>
                            {item.badge}
                          </Badge>
                        )}
                      </Group>
                    }
                    leftSection={
                      showBadge ? (
                        <Indicator color="red" size={8} processing>
                          <IconComponent size={16} />
                        </Indicator>
                      ) : (
                        <IconComponent size={16} />
                      )
                    }
                    active={isActive}
                    onClick={onClose}
                    className="mb-1"
                    styles={{
                      root: {
                        borderRadius: '6px',
                        '&[data-active]': {
                          backgroundColor: '#e0e7ff',
                          color: '#4338ca',
                        },
                        '&:hover': {
                          backgroundColor: '#f9fafb',
                        }
                      }
                    }}
                  />
                );
              })}
            </Box>
          </ScrollArea>

          {/* Footer - Fixed at bottom */}
          <Box className="p-4 border-t mt-auto">
            <Button
              variant="subtle"
              fullWidth
              leftSection={<IconLogout size={16} />}
              onClick={handleSignOut}
              className="text-gray-600 hover:text-gray-900"
              styles={{
                root: {
                  justifyContent: 'flex-start',
                  '&:hover': {
                    backgroundColor: '#f9fafb',
                  }
                }
              }}
            >
              Cerrar Sesión
            </Button>
          </Box>
        </div>
      </div>
    </>
  );
}


