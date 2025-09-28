
import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';

export default function EventsScreen() {
  return (
    <View style={ padding: 16, gap: 12 }>
      <Text style={ fontSize: 22, fontWeight: '700' }>Events</Text>
      <Text>Placeholder screen. Build per spec using the repair plan.</Text>
      <Link href="/more"><Pressable><Text style={ color: '#33663F' }>Go to More</Text></Pressable></Link>
    </View>
  );
}
