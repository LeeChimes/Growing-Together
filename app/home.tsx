// app/home.tsx
import { ScrollView, View } from 'react-native';
import TaskPanel from '../src/components/tasks/TaskPanel';

export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={{ gap: 24 }}>
        <TaskPanel />
            </View>
      </ScrollView>
  );
}
