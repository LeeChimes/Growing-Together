
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeProvider';

interface LogoProps {
  width?: number;
}

// Vector/text-based logo to avoid white image backgrounds and scale cleanly
export function Logo({ width = 240 }: LogoProps) {
  const theme = useTheme();
  const height = width / 4; // maintain approximate aspect ratio
  const iconSize = Math.max(20, Math.floor(height * 0.7));
  const fontSize = Math.max(16, Math.floor(height * 0.55));

  return (
    <View
      accessibilityLabel="Growing Together logo"
      style={{
        width,
        height,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
      }}
    >
      <Ionicons name="leaf" size={iconSize} color={theme.colors.greenDark} style={{ marginRight: 8 }} />
      <Text
        style={{
          color: theme.colors.greenDark,
          fontSize,
          fontWeight: '800',
          letterSpacing: 0.5,
        }}
      >
        Growing Together
      </Text>
    </View>
  );
}
