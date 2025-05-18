// src/lib/stores/themeStore.ts
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export type ThemeColor = 'amber' | 'crimson' | 'emerald' | 'azure' | 'violet' | 'teal';
export type ThemeMode = 'dark' | 'light';

export interface Theme {
  mode: ThemeMode;
  color: ThemeColor;
}

export interface ThemeConfig {
  name: string;
  displayName: string;
  primary: string;
  primaryHover: string;
  primaryText: string;
  secondary: string;
  secondaryHover: string;
  accent: string;
  accentHover: string;
  success: string;
  warning: string;
  error: string;
  background: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderHover: string;
  shadow: string;
}

// Theme configurations
export const themeConfigs: Record<ThemeColor, { light: ThemeConfig; dark: ThemeConfig }> = {
  amber: {
    dark: {
      name: 'amber-dark',
      displayName: 'Amber Gelap',
      primary: '#f59e0b', // amber-500
      primaryHover: '#d97706', // amber-600
      primaryText: '#ffffff',
      secondary: '#6b7280', // gray-500
      secondaryHover: '#4b5563', // gray-600
      accent: '#fbbf24', // amber-400
      accentHover: '#f59e0b', // amber-500
      success: '#10b981', // emerald-500
      warning: '#f59e0b', // amber-500
      error: '#ef4444', // red-500
      background: '#111827', // gray-900
      surface: '#1f2937', // gray-800
      surfaceHover: '#374151', // gray-700
      text: '#f9fafb', // gray-50
      textSecondary: '#d1d5db', // gray-300
      textMuted: '#9ca3af', // gray-400
      border: '#374151', // gray-700
      borderHover: '#4b5563', // gray-600
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    light: {
      name: 'amber-light',
      displayName: 'Amber Terang',
      primary: '#f59e0b', // amber-500
      primaryHover: '#d97706', // amber-600
      primaryText: '#ffffff',
      secondary: '#6b7280', // gray-500
      secondaryHover: '#4b5563', // gray-600
      accent: '#fbbf24', // amber-400
      accentHover: '#f59e0b', // amber-500
      success: '#10b981', // emerald-500
      warning: '#f59e0b', // amber-500
      error: '#ef4444', // red-500
      background: '#ffffff',
      surface: '#f9fafb', // gray-50
      surfaceHover: '#f3f4f6', // gray-100
      text: '#111827', // gray-900
      textSecondary: '#374151', // gray-700
      textMuted: '#6b7280', // gray-500
      border: '#e5e7eb', // gray-200
      borderHover: '#d1d5db', // gray-300
      shadow: 'rgba(0, 0, 0, 0.1)'
    }
  },
  crimson: {
    dark: {
      name: 'crimson-dark',
      displayName: 'Crimson Gelap',
      primary: '#dc2626', // red-600
      primaryHover: '#b91c1c', // red-700
      primaryText: '#ffffff',
      secondary: '#6b7280', // gray-500
      secondaryHover: '#4b5563', // gray-600
      accent: '#ef4444', // red-500
      accentHover: '#dc2626', // red-600
      success: '#10b981', // emerald-500
      warning: '#f59e0b', // amber-500
      error: '#ef4444', // red-500
      background: '#111827', // gray-900
      surface: '#1f2937', // gray-800
      surfaceHover: '#374151', // gray-700
      text: '#f9fafb', // gray-50
      textSecondary: '#d1d5db', // gray-300
      textMuted: '#9ca3af', // gray-400
      border: '#374151', // gray-700
      borderHover: '#4b5563', // gray-600
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    light: {
      name: 'crimson-light',
      displayName: 'Crimson Terang',
      primary: '#dc2626', // red-600
      primaryHover: '#b91c1c', // red-700
      primaryText: '#ffffff',
      secondary: '#6b7280', // gray-500
      secondaryHover: '#4b5563', // gray-600
      accent: '#ef4444', // red-500
      accentHover: '#dc2626', // red-600
      success: '#10b981', // emerald-500
      warning: '#f59e0b', // amber-500
      error: '#ef4444', // red-500
      background: '#ffffff',
      surface: '#f9fafb', // gray-50
      surfaceHover: '#f3f4f6', // gray-100
      text: '#111827', // gray-900
      textSecondary: '#374151', // gray-700
      textMuted: '#6b7280', // gray-500
      border: '#e5e7eb', // gray-200
      borderHover: '#d1d5db', // gray-300
      shadow: 'rgba(0, 0, 0, 0.1)'
    }
  },
  emerald: {
    dark: {
      name: 'emerald-dark',
      displayName: 'Emerald Gelap',
      primary: '#059669', // emerald-600
      primaryHover: '#047857', // emerald-700
      primaryText: '#ffffff',
      secondary: '#6b7280', // gray-500
      secondaryHover: '#4b5563', // gray-600
      accent: '#10b981', // emerald-500
      accentHover: '#059669', // emerald-600
      success: '#10b981', // emerald-500
      warning: '#f59e0b', // amber-500
      error: '#ef4444', // red-500
      background: '#111827', // gray-900
      surface: '#1f2937', // gray-800
      surfaceHover: '#374151', // gray-700
      text: '#f9fafb', // gray-50
      textSecondary: '#d1d5db', // gray-300
      textMuted: '#9ca3af', // gray-400
      border: '#374151', // gray-700
      borderHover: '#4b5563', // gray-600
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    light: {
      name: 'emerald-light',
      displayName: 'Emerald Terang',
      primary: '#059669', // emerald-600
      primaryHover: '#047857', // emerald-700
      primaryText: '#ffffff',
      secondary: '#6b7280', // gray-500
      secondaryHover: '#4b5563', // gray-600
      accent: '#10b981', // emerald-500
      accentHover: '#059669', // emerald-600
      success: '#10b981', // emerald-500
      warning: '#f59e0b', // amber-500
      error: '#ef4444', // red-500
      background: '#ffffff',
      surface: '#f9fafb', // gray-50
      surfaceHover: '#f3f4f6', // gray-100
      text: '#111827', // gray-900
      textSecondary: '#374151', // gray-700
      textMuted: '#6b7280', // gray-500
      border: '#e5e7eb', // gray-200
      borderHover: '#d1d5db', // gray-300
      shadow: 'rgba(0, 0, 0, 0.1)'
    }
  },
  azure: {
    dark: {
      name: 'azure-dark',
      displayName: 'Azure Gelap',
      primary: '#2563eb', // blue-600
      primaryHover: '#1d4ed8', // blue-700
      primaryText: '#ffffff',
      secondary: '#6b7280', // gray-500
      secondaryHover: '#4b5563', // gray-600
      accent: '#3b82f6', // blue-500
      accentHover: '#2563eb', // blue-600
      success: '#10b981', // emerald-500
      warning: '#f59e0b', // amber-500
      error: '#ef4444', // red-500
      background: '#111827', // gray-900
      surface: '#1f2937', // gray-800
      surfaceHover: '#374151', // gray-700
      text: '#f9fafb', // gray-50
      textSecondary: '#d1d5db', // gray-300
      textMuted: '#9ca3af', // gray-400
      border: '#374151', // gray-700
      borderHover: '#4b5563', // gray-600
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    light: {
      name: 'azure-light',
      displayName: 'Azure Terang',
      primary: '#2563eb', // blue-600
      primaryHover: '#1d4ed8', // blue-700
      primaryText: '#ffffff',
      secondary: '#6b7280', // gray-500
      secondaryHover: '#4b5563', // gray-600
      accent: '#3b82f6', // blue-500
      accentHover: '#2563eb', // blue-600
      success: '#10b981', // emerald-500
      warning: '#f59e0b', // amber-500
      error: '#ef4444', // red-500
      background: '#ffffff',
      surface: '#f9fafb', // gray-50
      surfaceHover: '#f3f4f6', // gray-100
      text: '#111827', // gray-900
      textSecondary: '#374151', // gray-700
      textMuted: '#6b7280', // gray-500
      border: '#e5e7eb', // gray-200
      borderHover: '#d1d5db', // gray-300
      shadow: 'rgba(0, 0, 0, 0.1)'
    }
  },
  violet: {
    dark: {
      name: 'violet-dark',
      displayName: 'Violet Gelap',
      primary: '#7c3aed', // violet-600
      primaryHover: '#6d28d9', // violet-700
      primaryText: '#ffffff',
      secondary: '#6b7280', // gray-500
      secondaryHover: '#4b5563', // gray-600
      accent: '#8b5cf6', // violet-500
      accentHover: '#7c3aed', // violet-600
      success: '#10b981', // emerald-500
      warning: '#f59e0b', // amber-500
      error: '#ef4444', // red-500
      background: '#111827', // gray-900
      surface: '#1f2937', // gray-800
      surfaceHover: '#374151', // gray-700
      text: '#f9fafb', // gray-50
      textSecondary: '#d1d5db', // gray-300
      textMuted: '#9ca3af', // gray-400
      border: '#374151', // gray-700
      borderHover: '#4b5563', // gray-600
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    light: {
      name: 'violet-light',
      displayName: 'Violet Terang',
      primary: '#7c3aed', // violet-600
      primaryHover: '#6d28d9', // violet-700
      primaryText: '#ffffff',
      secondary: '#6b7280', // gray-500
      secondaryHover: '#4b5563', // gray-600
      accent: '#8b5cf6', // violet-500
      accentHover: '#7c3aed', // violet-600
      success: '#10b981', // emerald-500
      warning: '#f59e0b', // amber-500
      error: '#ef4444', // red-500
      background: '#ffffff',
      surface: '#f9fafb', // gray-50
      surfaceHover: '#f3f4f6', // gray-100
      text: '#111827', // gray-900
      textSecondary: '#374151', // gray-700
      textMuted: '#6b7280', // gray-500
      border: '#e5e7eb', // gray-200
      borderHover: '#d1d5db', // gray-300
      shadow: 'rgba(0, 0, 0, 0.1)'
    }
  },
  teal: {
    dark: {
      name: 'teal-dark',
      displayName: 'Teal Gelap',
      primary: '#0891b2', // cyan-600
      primaryHover: '#0e7490', // cyan-700
      primaryText: '#ffffff',
      secondary: '#6b7280', // gray-500
      secondaryHover: '#4b5563', // gray-600
      accent: '#06b6d4', // cyan-500
      accentHover: '#0891b2', // cyan-600
      success: '#10b981', // emerald-500
      warning: '#f59e0b', // amber-500
      error: '#ef4444', // red-500
      background: '#111827', // gray-900
      surface: '#1f2937', // gray-800
      surfaceHover: '#374151', // gray-700
      text: '#f9fafb', // gray-50
      textSecondary: '#d1d5db', // gray-300
      textMuted: '#9ca3af', // gray-400
      border: '#374151', // gray-700
      borderHover: '#4b5563', // gray-600
      shadow: 'rgba(0, 0, 0, 0.3)'
    },
    light: {
      name: 'teal-light',
      displayName: 'Teal Terang',
      primary: '#0891b2', // cyan-600
      primaryHover: '#0e7490', // cyan-700
      primaryText: '#ffffff',
      secondary: '#6b7280', // gray-500
      secondaryHover: '#4b5563', // gray-600
      accent: '#06b6d4', // cyan-500
      accentHover: '#0891b2', // cyan-600
      success: '#10b981', // emerald-500
      warning: '#f59e0b', // amber-500
      error: '#ef4444', // red-500
      background: '#ffffff',
      surface: '#f9fafb', // gray-50
      surfaceHover: '#f3f4f6', // gray-100
      text: '#111827', // gray-900
      textSecondary: '#374151', // gray-700
      textMuted: '#6b7280', // gray-500
      border: '#e5e7eb', // gray-200
      borderHover: '#d1d5db', // gray-300
      shadow: 'rgba(0, 0, 0, 0.1)'
    }
  }
};

// Create the theme store
const defaultTheme: Theme = { mode: 'dark', color: 'amber' };

function createThemeStore() {
  // Initialize from localStorage if available
  let initialTheme = defaultTheme;
  if (browser) {
    const stored = localStorage.getItem('app-theme');
    if (stored) {
      try {
        initialTheme = JSON.parse(stored);
      } catch {
        // Fallback to default if parsing fails
        initialTheme = defaultTheme;
      }
    }
  }

  const { subscribe, set, update } = writable<Theme>(initialTheme);

  return {
    subscribe,
    setTheme: (theme: Theme) => {
      set(theme);
      if (browser) {
        localStorage.setItem('app-theme', JSON.stringify(theme));
      }
    },
    setColor: (color: ThemeColor) => {
      update(theme => {
        const newTheme = { ...theme, color };
        if (browser) {
          localStorage.setItem('app-theme', JSON.stringify(newTheme));
        }
        return newTheme;
      });
    },
    setMode: (mode: ThemeMode) => {
      update(theme => {
        const newTheme = { ...theme, mode };
        if (browser) {
          localStorage.setItem('app-theme', JSON.stringify(newTheme));
        }
        return newTheme;
      });
    },
    toggleMode: () => {
      update(theme => {
        const newMode: ThemeMode = theme.mode === 'dark' ? 'light' : 'dark';
        const newTheme = { ...theme, mode: newMode };
        if (browser) {
          localStorage.setItem('app-theme', JSON.stringify(newTheme));
        }
        return newTheme;
      });
    }
  };
}

export const themeStore = createThemeStore();

// Derived store for current theme config
export const currentThemeConfig = derived(
  themeStore,
  ($themeStore) => themeConfigs[$themeStore.color][$themeStore.mode]
);