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
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: isDarkMode() ? '#1A1B1E' : '#F8F9FA' }}>
        {/* Settings Navigation - Single Column */}
        <div
          style={{
            width: '240px',
            borderRight: `1px solid ${isDarkMode() ? '#2C2E33' : '#DEE2E6'}`,
            backgroundColor: isDarkMode() ? '#25262B' : '#ffffff',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
              {/* Header */}
              <div style={{
                padding: rem(20),
                borderBottom: `1px solid ${isDarkMode() ? '#2C2E33' : '#DEE2E6'}`,
              }}>
                <Text size="lg" fw={600} style={{ color: isDarkMode() ? '#ffffff' : '#212529' }}>
                  Settings
                </Text>
                <Text size="xs" style={{ color: isDarkMode() ? '#909296' : '#868E96', marginTop: rem(4) }}>
                  Manage your preferences
                </Text>
              </div>

              <ScrollArea style={{ flex: 1 }}>
                <div style={{ padding: rem(16) }}>
                  {visibleTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    
                    return (
                      <UnstyledButton
                        key={tab.id}
                        onClick={() => handleTabClick(tab)}
                        style={{
                          width: '100%',
                          padding: `${rem(12)} ${rem(14)}`,
                          borderRadius: rem(10),
                          marginBottom: rem(6),
                          backgroundColor: isActive
                            ? (isDarkMode() ? '#2C2E33' : '#E7F5FF')
                            : 'transparent',
                          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          border: isActive 
                            ? `1px solid ${isDarkMode() ? '#4C6EF5' : '#74C0FC'}`
                            : '1px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = isDarkMode() ? '#2C2E33' : '#F1F3F5';
                            e.currentTarget.style.transform = 'translateX(4px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.transform = 'translateX(0)';
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
            backgroundColor: isDarkMode() ? '#1A1B1E' : '#F8F9FA',
            minHeight: '100vh',
            padding: rem(32),
            overflowY: 'auto',
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {children}
          </div>
        </div>
      </div>
    </MantineProvider>
  );
};

export default DoubleNavbar;
