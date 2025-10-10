// components/tasks/TaskPanel.tsx
import { useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, Image, Modal, Button } from 'react-native';
import { Link } from 'expo-router';
import {
  useAllTasks,
  useAvailableTasks,
  useMyAssignedTasks,
  useComprehensiveTaskStats,
} from '../../hooks/useTasks';
import { supabase } from '../../lib/supabase';
import TaskForm from './TaskForm';

type Filter = 'available' | 'mine' | 'all';

function Chip({ label, active, onPress, count }: { label: string; active: boolean; onPress: () => void; count?: number }) {
  return (
    <Pressable onPress={onPress} style={{
      paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999,
      backgroundColor: active ? '#10b981' : '#e5e7eb'
    }}>
      <Text style={{ color: active ? 'white' : '#111827', fontWeight: '600' }}>
        {label}{typeof count === 'number' ? ` (${count})` : ''}
      </Text>
    </Pressable>
  );
}

export default function TaskPanel() {
  const [filter, setFilter] = useState<Filter>('available');
  const [createOpen, setCreateOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const stats = useComprehensiveTaskStats();
  const all = useAllTasks();
  const available = useAvailableTasks();
  const mine = useMyAssignedTasks(userId);

  const list = filter === 'mine' ? mine : filter === 'available' ? available : all;

  return (
    <View style={{ gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Tasks</Text>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Chip label="Available" active={filter==='available'} onPress={() => setFilter('available')}
              count={stats.data?.available}/>
        <Chip label="Mine" active={filter==='mine'} onPress={() => setFilter('mine')}
              count={mine.data?.length}/>
        <Chip label="All" active={filter==='all'} onPress={() => setFilter('all')}
              count={all.data?.length}/>
      </View>

      <Pressable onPress={() => setCreateOpen(true)} style={{
        backgroundColor: '#10b981', padding: 12, borderRadius: 10, alignSelf: 'flex-start'
      }}>
        <Text style={{ color: 'white', fontWeight: '700' }}>+ Create Task</Text>
      </Pressable>

      <FlatList
        data={list.data ?? []}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <Link href={`/tasks/${item.id}`} asChild>
            <Pressable style={{
              borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, flexDirection: 'row', gap: 12
            }}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={{ width: 72, height: 72, borderRadius: 8 }} />
              ) : (
                <View style={{ width:72, height:72, borderRadius:8, backgroundColor:'#f3f4f6', alignItems:'center', justifyContent:'center' }}>
                  <Text>🧰</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700' }}>{item.title}</Text>
                <Text numberOfLines={2} style={{ color: '#4b5563' }}>{item.description ?? ''}</Text>
                <Text style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>
                  {item.status?.replace('_',' ') ?? 'available'}
                </Text>
              </View>
            </Pressable>
          </Link>
        )}
      />

      <Modal visible={createOpen} animationType="slide" onRequestClose={() => setCreateOpen(false)}>
        <View style={{ flex: 1, padding: 16, gap: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: '700' }}>Create Task</Text>
          <TaskForm onCreated={() => setCreateOpen(false)} onCancel={() => setCreateOpen(false)} />
          <Button title="Close" onPress={() => setCreateOpen(false)} />
        </View>
      </Modal>
    </View>
  );
}

