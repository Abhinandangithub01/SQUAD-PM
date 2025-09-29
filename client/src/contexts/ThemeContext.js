import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

// Available themes
export const themes = {
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
  purple: {
    name: 'Purple Pro',
    primary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
    },
    accent: '#06b6d4',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1f2937',
    textSecondary: '#6b7280',
  },
  green: {
    name: 'Nature Green',
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    accent: '#f59e0b',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1f2937',
    textSecondary: '#6b7280',
  },
  orange: {
    name: 'Sunset Orange',
    primary: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    accent: '#8b5cf6',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1f2937',
    textSecondary: '#6b7280',
  },
  dark: {
    name: 'Dark Mode',
    primary: {
      50: '#1e293b',
      100: '#334155',
      200: '#475569',
      300: '#64748b',
      400: '#94a3b8',
      500: '#cbd5e1',
      600: '#e2e8f0',
      700: '#f1f5f9',
      800: '#f8fafc',
      900: '#ffffff',
    },
    accent: '#10b981',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
  },
  midnight: {
    name: 'Midnight Blue',
    primary: {
      50: '#0c1426',
      100: '#1e293b',
      200: '#334155',
      300: '#475569',
      400: '#64748b',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    accent: '#06b6d4',
    background: '#020617',
    surface: '#0f172a',
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
  }
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('default');
  const [customBranding, setCustomBranding] = useState({
    companyName: 'Project Management System',
    logo: null,
    favicon: null,
  });

  // Load theme from localStorage on mount
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

  // Apply theme to document root
  useEffect(() => {
    const theme = themes[currentTheme];
    const root = document.documentElement;

    // Apply CSS custom properties
    Object.entries(theme.primary).forEach(([key, value]) => {
      root.style.setProperty(`--color-primary-${key}`, value);
    });

    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--color-background', theme.background);
    root.style.setProperty('--color-surface', theme.surface);
    root.style.setProperty('--color-text', theme.text);
    root.style.setProperty('--color-text-secondary', theme.textSecondary);

    // Update body background
    document.body.style.backgroundColor = theme.background;
    document.body.style.color = theme.text;

    // Save to localStorage
    localStorage.setItem('app-theme', currentTheme);
  }, [currentTheme]);

  // Save branding to localStorage
  useEffect(() => {
    localStorage.setItem('app-branding', JSON.stringify(customBranding));
  }, [customBranding]);

  const changeTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  const updateBranding = (branding) => {
    setCustomBranding(prev => ({ ...prev, ...branding }));
  };

  const isDarkMode = () => {
    return currentTheme === 'dark' || currentTheme === 'midnight';
  };

  const getThemeColors = () => {
    return themes[currentTheme];
  };

  const value = {
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
