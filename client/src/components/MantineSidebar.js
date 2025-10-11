import React from 'react';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { AppShell, NavLink, ScrollArea, Badge, Text, rem } from '@mantine/core';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import {
  HomeIcon,
  FolderIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  BellIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Projects', href: '/projects', icon: FolderIcon },
  { name: 'Chat', href: '/chat', icon: ChatBubbleLeftRightIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

const MantineSidebar = ({ children, onNotificationClick }) => {
  const { isDarkMode } = useTheme();
  const location = useLocation();

  // Fetch unread notifications count
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      return { unread_count: 3 };
    },
    refetchInterval: 30000,
  });

  return (
    <MantineProvider>
      <AppShell
        navbar={{
          width: 80,
          breakpoint: 0,
        }}
        padding={0}
      >
        <AppShell.Navbar
          style={{
            backgroundColor: isDarkMode() ? '#1A1B1E' : '#ffffff',
            borderRight: `1px solid ${isDarkMode() ? '#2C2E33' : '#e5e7eb'}`,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Logo */}
            <div
              style={{
                height: rem(80),
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: rem(16),
                backgroundColor: isDarkMode() ? '#1A1B1E' : '#4C6EF5',
                borderBottom: `1px solid ${isDarkMode() ? '#2C2E33' : 'rgba(255,255,255,0.2)'}`,
              }}
            >
              <div
                style={{
                  height: rem(36),
                  width: rem(36),
                  backgroundColor: isDarkMode() ? '#4C6EF5' : '#ffffff',
                  borderRadius: rem(10),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isDarkMode() ? '0 2px 8px rgba(76, 110, 245, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
                }}
              >
                <svg
                  style={{ 
                    height: rem(22), 
                    width: rem(22), 
                    color: isDarkMode() ? '#ffffff' : '#4C6EF5'
                  }}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                </svg>
              </div>
              <Text
                size="xs"
                fw={700}
                style={{
                  color: isDarkMode() ? '#C1C2C5' : '#ffffff',
                  marginTop: rem(6),
                  letterSpacing: '1px',
                }}
              >
                SQUAD
              </Text>
            </div>

            {/* Navigation */}
            <ScrollArea style={{ flex: 1, padding: `${rem(12)} ${rem(8)}` }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: rem(8) }}>
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.href);

                  return (
                    <RouterNavLink
                      key={item.name}
                      to={item.href}
                      style={{ textDecoration: 'none' }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: `${rem(10)} ${rem(8)}`,
                          borderRadius: rem(12),
                          backgroundColor: isActive
                            ? (isDarkMode() ? '#2C2E33' : '#E7F5FF')
                            : 'transparent',
                          cursor: 'pointer',
                          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                          border: isActive 
                            ? `1px solid ${isDarkMode() ? '#4C6EF5' : '#74C0FC'}`
                            : '1px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = isDarkMode() ? '#25262B' : '#F1F3F5';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }
                        }}
                      >
                        <Icon
                          style={{
                            width: rem(24),
                            height: rem(24),
                            marginBottom: rem(4),
                            color: isActive
                              ? (isDarkMode() ? '#ffffff' : '#4C6EF5')
                              : (isDarkMode() ? '#909296' : '#495057'),
                          }}
                        />
                        <Text
                          size="10px"
                          fw={500}
                          style={{
                            textAlign: 'center',
                            lineHeight: 1.2,
                            color: isActive
                              ? (isDarkMode() ? '#ffffff' : '#4C6EF5')
                              : (isDarkMode() ? '#C1C2C5' : '#495057'),
                          }}
                        >
                          {item.name}
                        </Text>
                      </div>
                    </RouterNavLink>
                  );
                })}

                {/* Notifications */}
                <div
                  style={{
                    marginTop: rem(8),
                    paddingTop: rem(8),
                    borderTop: `1px solid ${isDarkMode() ? '#2C2E33' : '#e9ecef'}`,
                  }}
                >
                  <div
                    onClick={onNotificationClick}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: `${rem(12)} ${rem(8)}`,
                      borderRadius: rem(8),
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isDarkMode() ? '#25262B' : '#F8F9FA';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      <BellIcon
                        style={{
                          width: rem(24),
                          height: rem(24),
                          marginBottom: rem(4),
                          color: isDarkMode() ? '#909296' : '#495057',
                        }}
                      />
                      {notificationsData?.unread_count > 0 && (
                        <Badge
                          size="xs"
                          circle
                          style={{
                            position: 'absolute',
                            top: rem(-4),
                            right: rem(-4),
                            minWidth: rem(16),
                            height: rem(16),
                            padding: 0,
                            backgroundColor: '#fa5252',
                            color: '#ffffff',
                            fontSize: rem(10),
                          }}
                        >
                          {notificationsData.unread_count > 9 ? '9+' : notificationsData.unread_count}
                        </Badge>
                      )}
                    </div>
                    <Text
                      size="10px"
                      fw={500}
                      style={{
                        textAlign: 'center',
                        lineHeight: 1.2,
                        color: isDarkMode() ? '#C1C2C5' : '#495057',
                      }}
                    >
                      Notifications
                    </Text>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </AppShell.Navbar>

        <AppShell.Main
          style={{
            backgroundColor: isDarkMode() ? '#1A1B1E' : '#f8f9fa',
            minHeight: '100vh',
          }}
        >
          {children}
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
};

export default MantineSidebar;
