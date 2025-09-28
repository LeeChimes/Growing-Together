
export const colors = {
  // Primary brand colors
  green: '#22c55e',
  greenDark: '#16a34a',
  greenLight: '#4ade80',
  greenBg: '#f0fdf4',
  
  // Nature palette
  soil: '#6D4C41',
  sky: '#3b82f6',
  sunflower: '#FDD835',
  
  // System colors
  paper: '#FFFFFF',
  charcoal: '#1f2937',
  gray: '#6b7280',
  grayLight: '#f3f4f6',
  
  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

export const radii = { 
  sm: 8, 
  md: 12, 
  lg: 16, 
  xl: 20,
  full: 999 
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const typography = {
  family: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  sizes: { 
    h1: 28, 
    h2: 24, 
    h3: 20, 
    h4: 18,
    body: 16, 
    small: 14,
    xs: 12,
  },
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    loose: 1.75,
  },
};

// Touch targets (minimum 48dp as per spec)
export const touchTargets = {
  small: 44,
  medium: 48,
  large: 56,
};

// Shadows
export const shadows = {
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};
