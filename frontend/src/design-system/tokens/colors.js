// Design Tokens - Colors
// TaskFlow Design System v1.0

export const colors = {
  // Brand Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main brand blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7', // Main brand purple
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },

  // Semantic Colors
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  info: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },

  // Neutral Colors (Light Theme)
  light: {
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
    },
    surface: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      elevated: '#ffffff',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
      tertiary: '#94a3b8',
      disabled: '#cbd5e1',
      inverse: '#ffffff',
    },
    border: {
      primary: '#e2e8f0',
      secondary: '#cbd5e1',
      focus: '#3b82f6',
      error: '#ef4444',
    },
  },

  // Neutral Colors (Dark Theme)
  dark: {
    background: {
      primary: '#0f172a',
      secondary: '#1e293b',
      tertiary: '#334155',
    },
    surface: {
      primary: '#1e293b',
      secondary: '#334155',
      elevated: '#475569',
      overlay: 'rgba(0, 0, 0, 0.7)',
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#cbd5e1',
      tertiary: '#94a3b8',
      disabled: '#64748b',
      inverse: '#1e293b',
    },
    border: {
      primary: '#475569',
      secondary: '#64748b',
      focus: '#60a5fa',
      error: '#f87171',
    },
  },

  // Additional theme variants
  themes: {
    ocean: {
      primary: '#0891b2', // cyan-600
      secondary: '#0e7490', // cyan-700
      accent: '#67e8f9', // cyan-300
    },
    forest: {
      primary: '#059669', // emerald-600
      secondary: '#047857', // emerald-700
      accent: '#6ee7b7', // emerald-300
    },
    sunset: {
      primary: '#ea580c', // orange-600
      secondary: '#dc2626', // red-600
      accent: '#fed7aa', // orange-200
    },
    lavender: {
      primary: '#7c3aed', // violet-700
      secondary: '#a855f7', // purple-500
      accent: '#ddd6fe', // violet-200
    },
    monochrome: {
      primary: '#374151', // gray-700
      secondary: '#1f2937', // gray-800
      accent: '#d1d5db', // gray-300
    },
  },
};

// Color utility functions
export const getColorValue = (colorPath, theme = 'light') => {
  const paths = colorPath.split('.');
  let current = colors;
  
  for (const path of paths) {
    current = current?.[path];
  }
  
  return current;
};

export const withOpacity = (color, opacity) => {
  // Convert hex to rgba
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  // If already rgba/rgb, modify opacity
  if (color.startsWith('rgb')) {
    return color.replace(/rgba?\([^)]+\)/, match => {
      const values = match.match(/\d+(\.\d+)?/g);
      if (values && values.length >= 3) {
        return `rgba(${values[0]}, ${values[1]}, ${values[2]}, ${opacity})`;
      }
      return match;
    });
  }
  
  return color;
};

export default colors;