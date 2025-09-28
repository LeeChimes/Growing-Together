
import { ReactNode } from 'react';
import { colors } from './tokens';

export function ThemeProvider({ children }: { children: ReactNode }) {
  // extend later; for now just render children
  return <>{children}</>;
}
