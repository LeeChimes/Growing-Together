// app/tasks/[id].tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, Image, Button, ScrollView } from 'react-native';
import { useAllTasks, useStartTask, useCompleteTaskWithNotes } from '../../src/hooks/useTasks';
import { useEffect, useState } from 'react';
import { supabase } from '../../src/lib/supabase';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useAllTasks();
  const task = (data ?? []).find(t => t.id === id);
  const start = useStartTask();
  const complete = useCompleteTaskWithNotes();
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null)); }, []);

  if (!task) {
    return <View style={{ padding: 16 }}><Text>Task not found.</Text></View>;
  }

  const canStart = (task.status ?? 'available') === 'available';
  const canFinish = (task.status === 'in_progress' || task.status === 'accepted') && (!!uid ? task.assigned_to === uid || true : false);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>{task.title}</Text>
      {task.image_url ? (
        <Image source={{ uri: task.image_url }} style={{ width: '100%', height: 240, borderRadius: 12 }} />
      ) : null}
      {task.description ? <Text style={{ color: '#374151' }}>{task.description}</Text> : null}
      <Text style={{ color: '#6b7280' }}>Status: {(task.status ?? 'available').replace('_',' ')}</Text>

      {canStart && (
        <Button
          title="Start Task"
          onPress={async () => { await start.mutateAsync(task.id); router.back(); }}
        />
      )}

      {!canStart && task.status !== 'completed' && (
        <Button
          title="Finish Task"
          onPress={async () => { await complete.mutateAsync({ taskId: task.id }); router.back(); }}
        />
      )}

      {task.status === 'completed' && <Text>✅ Completed</Text>}
    </ScrollView>
  );
}

