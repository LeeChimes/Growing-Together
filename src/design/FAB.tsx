import React, { ReactNode } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from './ThemeProvider';

interface FABProps {
  onPress: () => void;
  icon: ReactNode;
  style?: ViewStyle;
  size?: 'default' | 'small';
}

export function FAB({ 
  onPress, 
  icon, 
  style,
  size = 'default'
}: FABProps) {
  const theme = useTheme();

  const fabSize = size === 'small' ? 48 : 56;

  const fabStyle: ViewStyle = {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.xl,
    width: fabSize,
    height: fabSize,
    borderRadius: fabSize / 2,
    backgroundColor: theme.colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
  };

  return (
    <TouchableOpacity
      style={[fabStyle, style]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={typeof icon === 'string' ? icon : 'Floating action button'}
    >
      {icon}
    </TouchableOpacity>
  );
}