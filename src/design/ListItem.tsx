import React, { ReactNode } from 'react';
import { 
  TouchableOpacity, 
  View, 
  Text, 
  StyleSheet, 
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from './ThemeProvider';

interface ListItemProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  style?: ViewStyle;
  disabled?: boolean;
}

export function ListItem({
  title,
  subtitle,
  onPress,
  leftContent,
  rightContent,
  style,
  disabled = false,
}: ListItemProps) {
  const theme = useTheme();

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    minHeight: theme.touchTargets.medium,
    backgroundColor: theme.colors.paper,
  };

  const contentStyle: ViewStyle = {
    flex: 1,
    marginLeft: leftContent ? theme.spacing.md : 0,
    marginRight: rightContent ? theme.spacing.md : 0,
  };

  const titleStyle: TextStyle = {
    fontSize: theme.typography.sizes.body,
    fontWeight: '500',
    color: disabled ? theme.colors.gray : theme.colors.charcoal,
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.body,
  };

  const subtitleStyle: TextStyle = {
    fontSize: theme.typography.sizes.small,
    color: theme.colors.gray,
    marginTop: 2,
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.small,
  };

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[containerStyle, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {leftContent}
      
      <View style={contentStyle}>
        <Text style={titleStyle}>{title}</Text>
        {subtitle && <Text style={subtitleStyle}>{subtitle}</Text>}
      </View>
      
      {rightContent}
    </Container>
  );
}