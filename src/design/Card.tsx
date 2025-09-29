import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import type { StyleProp } from 'react-native';
import { useTheme } from './ThemeProvider';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: keyof typeof import('./tokens').spacing;
}

export function Card({ 
  children, 
  style, 
  variant = 'default',
  padding = 'lg'
}: CardProps) {
  const theme = useTheme();

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: theme.colors.paper,
      borderRadius: theme.radii.lg,
      padding: theme.spacing[padding],
    };

    const variantStyles = {
      default: {
        ...theme.shadows.sm,
      },
      elevated: {
        ...theme.shadows.lg,
      },
      outlined: {
        borderWidth: 1,
        borderColor: theme.colors.grayLight,
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
    };
  };

  return (
    <View style={[getCardStyle(), style]}>
      {children}
    </View>
  );
}