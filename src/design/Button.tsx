import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from './ThemeProvider';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const theme = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.radii.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    // Size styles
    const sizeStyles = {
      small: {
        height: theme.touchTargets.small,
        paddingHorizontal: theme.spacing.md,
      },
      medium: {
        height: theme.touchTargets.medium,
        paddingHorizontal: theme.spacing.lg,
      },
      large: {
        height: theme.touchTargets.large,
        paddingHorizontal: theme.spacing.xl,
      },
    };

    // Variant styles
    const variantStyles = {
      primary: {
        backgroundColor: disabled ? theme.colors.grayLight : theme.colors.green,
        ...theme.shadows.sm,
      },
      secondary: {
        backgroundColor: disabled ? theme.colors.grayLight : theme.colors.greenBg,
        borderWidth: 1,
        borderColor: theme.colors.green,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: disabled ? theme.colors.grayLight : theme.colors.green,
      },
      ghost: {
        backgroundColor: 'transparent',
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
        fontSize: theme.typography.sizes.small,
      },
      medium: {
        fontSize: theme.typography.sizes.body,
      },
      large: {
        fontSize: theme.typography.sizes.h4,
      },
    };

    const variantStyles = {
      primary: {
        color: disabled ? theme.colors.gray : theme.colors.paper,
        fontWeight: '600' as const,
      },
      secondary: {
        color: disabled ? theme.colors.gray : theme.colors.green,
        fontWeight: '600' as const,
      },
      outline: {
        color: disabled ? theme.colors.gray : theme.colors.green,
        fontWeight: '500' as const,
      },
      ghost: {
        color: disabled ? theme.colors.gray : theme.colors.green,
        fontWeight: '500' as const,
      },
    };

    return {
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? theme.colors.paper : theme.colors.green} 
          size="small"
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}