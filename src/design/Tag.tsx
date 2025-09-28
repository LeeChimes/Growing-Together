import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from './ThemeProvider';

interface TagProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

export function Tag({ 
  label, 
  variant = 'default', 
  size = 'medium',
  style 
}: TagProps) {
  const theme = useTheme();

  const getTagStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.radii.full,
      alignSelf: 'flex-start',
      alignItems: 'center',
      justifyContent: 'center',
    };

    const sizeStyles = {
      small: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
      },
      medium: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
      },
    };

    const variantStyles = {
      default: {
        backgroundColor: theme.colors.grayLight,
      },
      success: {
        backgroundColor: `${theme.colors.success}20`,
      },
      warning: {
        backgroundColor: `${theme.colors.warning}20`,
      },
      error: {
        backgroundColor: `${theme.colors.error}20`,
      },
      info: {
        backgroundColor: `${theme.colors.info}20`,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getTextStyle = (): TextStyle => {
    const sizeStyles = {
      small: {
        fontSize: theme.typography.sizes.xs,
      },
      medium: {
        fontSize: theme.typography.sizes.small,
      },
    };

    const variantStyles = {
      default: {
        color: theme.colors.charcoal,
      },
      success: {
        color: theme.colors.success,
      },
      warning: {
        color: theme.colors.warning,
      },
      error: {
        color: theme.colors.error,
      },
      info: {
        color: theme.colors.info,
      },
    };

    return {
      fontWeight: '500',
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  return (
    <View style={[getTagStyle(), style]}>
      <Text style={getTextStyle()}>{label}</Text>
    </View>
  );
}