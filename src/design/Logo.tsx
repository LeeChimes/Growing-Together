
import { Image } from 'react-native';

export function Logo({ width = 240 }) {
  return (
    <Image
      source={require('../../assets/logos/growing-logo-800x200.png')}
      style={{ width, height: width/4, resizeMode: 'contain' }}
      accessibilityLabel="Growing Together logo"
    />
  );
}
