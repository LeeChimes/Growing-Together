
import React, { ReactNode, createContext, useContext, useMemo } from 'react';
import { colors as baseColors, spacing, typography as baseTypography, radii, shadows, touchTargets } from './tokens';
import { useAccessibilitySettings } from '../hooks/useSettings';

interface Theme {
  colors: typeof baseColors;
  spacing: typeof spacing;
  typography: typeof baseTypography;
  radii: typeof radii;
  shadows: typeof shadows;
  touchTargets: typeof touchTargets;
}

const lightColors = {
  ...baseColors,
  paper: '#FFFFFF',
  charcoal: '#1f2937',
  background: '#f0fdf4',
};

const darkColors = {
  ...baseColors,
  paper: '#1e293b',
  charcoal: '#f8fafc',
  background: '#0f172a',
  grayLight: '#334155',
};

const ThemeContext = createContext<Theme>({
  colors: lightColors as any,
  spacing,
  typography: baseTypography,
  radii,
  shadows,
  touchTargets,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings } = useAccessibilitySettings();

  const theme = useMemo<Theme>(() => {
    const isDark = settings.theme === 'dark';
    const selectedColors = isDark ? darkColors : lightColors;
    const multiplier = settings.fontSize === 'small' ? 0.9 : settings.fontSize === 'large' ? 1.1 : settings.fontSize === 'extra-large' ? 1.25 : 1.0;
    const typography = {
      ...baseTypography,
      sizes: {
        ...baseTypography.sizes,
        xl: Math.round(baseTypography.sizes.xl * multiplier),
        lg: Math.round(baseTypography.sizes.lg * multiplier),
        h1: Math.round(baseTypography.sizes.h1 * multiplier),
        h2: Math.round(baseTypography.sizes.h2 * multiplier),
        h3: Math.round(baseTypography.sizes.h3 * multiplier),
        h4: Math.round(baseTypography.sizes.h4 * multiplier),
        body: Math.round(baseTypography.sizes.body * multiplier),
        small: Math.round(baseTypography.sizes.small * multiplier),
        xs: Math.round(baseTypography.sizes.xs * multiplier),
      },
    } as typeof baseTypography;

    return {
      colors: selectedColors as any,
      spacing,
      typography,
      radii,
      shadows,
      touchTargets,
    };
  }, [settings.theme, settings.fontSize]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
