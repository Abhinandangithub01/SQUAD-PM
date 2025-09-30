import React, { useState } from 'react';
import { AppShell, Navbar, ScrollArea, UnstyledButton, Group, Text, rem } from '@mantine/core';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import {
  UserIcon,
  UsersIcon,
  BellIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

const DoubleNavbar = ({ activeTab, onTabChange, children, userRole }) => {
  const { isDarkMode } = useTheme();

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'users', name: 'Users', icon: UsersIcon, adminOnly: true },
    { id: 'preferences', name: 'Preferences', icon: Cog6ToothIcon },
  ];

  const visibleTabs = tabs.filter(t => !t.adminOnly || userRole === 'admin');

  const handleTabClick = (tab) => {
    onTabChange(tab.id);
  };

  return (
    <MantineProvider>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Settings Navigation - Single Column */}
        <div
          style={{
            width: '220px',
            borderRight: `1px solid ${isDarkMode() ? '#2C2E33' : '#e9ecef'}`,
            backgroundColor: isDarkMode() ? '#25262B' : '#fff',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
              <ScrollArea style={{ flex: 1 }}>
                <div style={{ padding: rem(12) }}>
                  {visibleTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    
                    return (
                      <UnstyledButton
                        key={tab.id}
                        onClick={() => handleTabClick(tab)}
                        style={{
                          width: '100%',
                          padding: `${rem(10)} ${rem(12)}`,
                          borderRadius: rem(8),
                          marginBottom: rem(4),
                          backgroundColor: isActive
                            ? (isDarkMode() ? '#2C2E33' : '#f1f3f5')
                            : 'transparent',
                          transition: 'background-color 150ms ease',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = isDarkMode() ? '#2C2E33' : '#f8f9fa';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <Icon
                          style={{
                            width: rem(18),
                            height: rem(18),
                            marginRight: rem(12),
                            color: isActive
                              ? (isDarkMode() ? '#fff' : '#228be6')
                              : (isDarkMode() ? '#909296' : '#868e96'),
                          }}
                        />
                        <Text
                          size="sm"
                          fw={500}
                          style={{
                            color: isActive
                              ? (isDarkMode() ? '#fff' : '#228be6')
                              : (isDarkMode() ? '#C1C2C5' : '#495057'),
                          }}
                        >
                          {tab.name}
                        </Text>
                      </UnstyledButton>
                    );
                  })}
                </div>
              </ScrollArea>
        </div>

        {/* Main Content Area */}
        <div
          style={{
            flex: 1,
            backgroundColor: isDarkMode() ? '#1A1B1E' : '#f8f9fa',
            minHeight: '100vh',
            padding: rem(24),
          }}
        >
          {children}
        </div>
      </div>
    </MantineProvider>
  );
};

export default DoubleNavbar;
