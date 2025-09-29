import React from 'react';
import { 
  TouchableOpacity, 
  Image, 
  View, 
  StyleSheet, 
  ViewStyle,
  ImageStyle,
} from 'react-native';
import { useTheme } from './ThemeProvider';

interface ImageTileProps {
  imageUri: string;
  onPress?: () => void;
  size?: number;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  aspectRatio?: number;
}

export function ImageTile({
  imageUri,
  onPress,
  size = 120,
  style,
  imageStyle,
  aspectRatio = 1,
}: ImageTileProps) {
  const theme = useTheme();

  const containerStyle: ViewStyle = {
    width: size,
    height: size / aspectRatio,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.grayLight,
    ...theme.shadows.sm,
  };

  const defaultImageStyle: ImageStyle = {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  };

  const Container: any = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[containerStyle, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      <Image
        source={{ uri: imageUri }}
        style={[defaultImageStyle, imageStyle]}
      />
    </Container>
  );
}