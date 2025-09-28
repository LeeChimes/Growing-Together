
import React, { ReactNode, createContext, useContext } from 'react';
import { colors, spacing, typography, radii, shadows, touchTargets } from './tokens';

interface Theme {
  colors: typeof colors;
  spacing: typeof spacing;
  typography: typeof typography;
  radii: typeof radii;
  shadows: typeof shadows;
  touchTargets: typeof touchTargets;
}

const theme: Theme = {
  colors,
  spacing,
  typography,
  radii,
  shadows,
  touchTargets,
};

const ThemeContext = createContext<Theme>(theme);

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
