'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeColors {
  name: string;
  primary: {
    [key: string]: string;
  };
  accent: string;
  background: string;
  surface: string;
  surfaceHover?: string;
  border?: string;
  borderLight?: string;
  text: string;
  textSecondary: string;
  textMuted?: string;
  success?: string;
  warning?: string;
  error?: string;
  info?: string;
  cardBg?: string;
  cardBorder?: string;
  inputBg?: string;
  inputBorder?: string;
  sidebarBg?: string;
  headerBg?: string;
}

interface Branding {
  companyName: string;
  logo: string | null;
  favicon: string | null;
}

interface ThemeContextType {
  currentTheme: string;
  themes: Record<string, ThemeColors>;
  customBranding: Branding;
  changeTheme: (themeName: string) => void;
  updateBranding: (branding: Partial<Branding>) => void;
  isDarkMode: () => boolean;
  getThemeColors: () => ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const themes: Record<string, ThemeColors> = {
  default: {
    name: 'Default Blue',
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    accent: '#10b981',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1f2937',
    textSecondary: '#6b7280',
  },
  dark: {
    name: 'Dark Mode',
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    accent: '#10b981',
    background: '#0f172a',
    surface: '#1e293b',
    surfaceHover: '#334155',
    border: '#334155',
    borderLight: '#475569',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    cardBg: '#1e293b',
    cardBorder: '#334155',
    inputBg: '#0f172a',
    inputBorder: '#334155',
    sidebarBg: '#0c1420',
    headerBg: '#1e293b',
  },
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState('default');
  const [customBranding, setCustomBranding] = useState<Branding>({
    companyName: 'SQUAD PM',
    logo: null,
    favicon: null,
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme');
    const savedBranding = localStorage.getItem('app-branding');
    
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
    
    if (savedBranding) {
      try {
        setCustomBranding(JSON.parse(savedBranding));
      } catch (error) {
        console.error('Error parsing saved branding:', error);
      }
    }
  }, []);

  useEffect(() => {
    const theme = themes[currentTheme];
    const root = document.documentElement;

    Object.entries(theme.primary).forEach(([key, value]) => {
      root.style.setProperty(`--color-primary-${key}`, value);
    });

    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--color-background', theme.background);
    root.style.setProperty('--color-surface', theme.surface);
    root.style.setProperty('--color-surface-hover', theme.surfaceHover || theme.surface);
    root.style.setProperty('--color-border', theme.border || '#e5e7eb');
    root.style.setProperty('--color-border-light', theme.borderLight || '#f3f4f6');
    root.style.setProperty('--color-text', theme.text);
    root.style.setProperty('--color-text-secondary', theme.textSecondary);
    root.style.setProperty('--color-text-muted', theme.textMuted || theme.textSecondary);
    
    root.style.setProperty('--color-success', theme.success || '#10b981');
    root.style.setProperty('--color-warning', theme.warning || '#f59e0b');
    root.style.setProperty('--color-error', theme.error || '#ef4444');
    root.style.setProperty('--color-info', theme.info || '#3b82f6');
    
    root.style.setProperty('--color-card-bg', theme.cardBg || theme.surface);
    root.style.setProperty('--color-card-border', theme.cardBorder || theme.border || '#e5e7eb');
    root.style.setProperty('--color-input-bg', theme.inputBg || theme.background);
    root.style.setProperty('--color-input-border', theme.inputBorder || theme.border || '#e5e7eb');
    root.style.setProperty('--color-sidebar-bg', theme.sidebarBg || theme.surface);
    root.style.setProperty('--color-header-bg', theme.headerBg || theme.surface);

    document.body.style.backgroundColor = theme.background;
    document.body.style.color = theme.text;
    
    if (isDarkMode()) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
    }

    localStorage.setItem('app-theme', currentTheme);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTheme]);

  useEffect(() => {
    localStorage.setItem('app-branding', JSON.stringify(customBranding));
  }, [customBranding]);

  const changeTheme = (themeName: string) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  const updateBranding = (branding: Partial<Branding>) => {
    setCustomBranding((prev: Branding) => ({ ...prev, ...branding }));
  };

  const isDarkMode = () => {
    return currentTheme === 'dark' || currentTheme === 'midnight';
  };

  const getThemeColors = () => {
    return themes[currentTheme];
  };

  const value: ThemeContextType = {
    currentTheme,
    themes,
    customBranding,
    changeTheme,
    updateBranding,
    isDarkMode,
    getThemeColors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
