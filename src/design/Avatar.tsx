import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from './ThemeProvider';

interface AvatarProps {
  name?: string;
  imageUri?: string;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export function Avatar({ 
  name, 
  imageUri, 
  size = 'medium',
  style 
}: AvatarProps) {
  const theme = useTheme();

  const getAvatarSize = () => {
    const sizes = {
      small: 32,
      medium: 40,
      large: 56,
    };
    return sizes[size];
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarSize = getAvatarSize();

  const containerStyle: ViewStyle = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    backgroundColor: theme.colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  const textStyle: TextStyle = {
    color: theme.colors.paper,
    fontSize: size === 'small' ? 12 : size === 'medium' ? 14 : 18,
    fontWeight: '600',
  };

  const imageStyle = {
    width: avatarSize,
    height: avatarSize,
  };

  return (
    <View style={[containerStyle, style]}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={imageStyle} />
      ) : (
        <Text style={textStyle}>
          {name ? getInitials(name) : '?'}
        </Text>
      )}
    </View>
  );
}