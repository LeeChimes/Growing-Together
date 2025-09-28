import React, { ReactNode } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ViewStyle, 
  TextStyle,
  TextInputProps,
} from 'react-native';
import { useTheme } from './ThemeProvider';

interface FormFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerStyle?: ViewStyle;
  required?: boolean;
}

export function FormField({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  required = false,
  style,
  ...textInputProps
}: FormFieldProps) {
  const theme = useTheme();

  const labelStyle: TextStyle = {
    fontSize: theme.typography.sizes.small,
    fontWeight: '500',
    color: theme.colors.charcoal,
    marginBottom: theme.spacing.xs,
  };

  const inputContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: error ? theme.colors.error : theme.colors.grayLight,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.paper,
    minHeight: theme.touchTargets.medium,
  };

  const inputStyle: TextStyle = {
    flex: 1,
    fontSize: theme.typography.sizes.body,
    color: theme.colors.charcoal,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  };

  const iconContainerStyle: ViewStyle = {
    paddingHorizontal: theme.spacing.sm,
  };

  const errorStyle: TextStyle = {
    fontSize: theme.typography.sizes.small,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  };

  return (
    <View style={containerStyle}>
      {label && (
        <Text style={labelStyle}>
          {label}
          {required && <Text style={{ color: theme.colors.error }}> *</Text>}
        </Text>
      )}
      
      <View style={inputContainerStyle}>
        {leftIcon && (
          <View style={iconContainerStyle}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={[inputStyle, style]}
          placeholderTextColor={theme.colors.gray}
          {...textInputProps}
        />
        
        {rightIcon && (
          <View style={iconContainerStyle}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {error && <Text style={errorStyle}>{error}</Text>}
    </View>
  );
}