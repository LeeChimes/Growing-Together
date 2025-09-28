import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from './ThemeProvider';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const theme = useTheme();

  const containerStyle: ViewStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.xl,
  };

  const titleStyle = {
    fontSize: theme.typography.sizes.h3,
    fontWeight: '600' as const,
    color: theme.colors.charcoal,
    textAlign: 'center' as const,
    marginBottom: theme.spacing.sm,
  };

  const descriptionStyle = {
    fontSize: theme.typography.sizes.body,
    color: theme.colors.gray,
    textAlign: 'center' as const,
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.body,
    marginBottom: theme.spacing.xl,
  };

  const iconContainer: ViewStyle = {
    marginBottom: theme.spacing.lg,
    opacity: 0.6,
  };

  return (
    <View style={[containerStyle, style]}>
      {icon && (
        <View style={iconContainer}>
          {icon}
        </View>
      )}
      
      <Text style={titleStyle}>{title}</Text>
      
      {description && (
        <Text style={descriptionStyle}>{description}</Text>
      )}
      
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="outline"
        />
      )}
    </View>
  );
}