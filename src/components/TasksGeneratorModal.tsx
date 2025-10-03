import React, { useMemo, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Button, Card, Tag } from '../design';
import { useCreateTask } from '../hooks/useTasks';
import { useMembers } from '../hooks/useAdmin';

interface TasksGeneratorModalProps {
  visible: boolean;
  onClose: () => void;
}

const seasonalTasks: Record<string, Array<{ title: string; description?: string }>> = {
  winter: [
    { title: 'Cover soil with mulch', description: 'Protect beds during frost' },
    { title: 'Service tools', description: 'Sharpen and oil garden tools' },
  ],
  spring: [
    { title: 'Sow lettuce', description: 'Ideal time for sowing salad greens' },
    { title: 'Weed communal paths', description: 'Keep shared areas tidy' },
  ],
  summer: [
    { title: 'Water communal beds', description: 'Prioritise mornings/evenings' },
    { title: 'Stake tall plants', description: 'Prevent wind damage' },
  ],
  autumn: [
    { title: 'Clear dead foliage', description: 'Reduce pests and disease' },
    { title: 'Compost collection', description: 'Organise a compost pile turn' },
  ],
};

function currentSeason(): keyof typeof seasonalTasks {
  const m = new Date().getMonth();
  if (m <= 1 || m === 11) return 'winter';
  if (m >= 2 && m <= 4) return 'spring';
  if (m >= 5 && m <= 7) return 'summer';
  return 'autumn';
}

export const TasksGeneratorModal: React.FC<TasksGeneratorModalProps> = ({ visible, onClose }) => {
  const theme = useTheme();
  const createTask = useCreateTask();
  const { data: members = [] } = useMembers();
  const season = useMemo(() => currentSeason(), []);
  const suggestions = seasonalTasks[season];
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assignMode, setAssignMode] = useState<'everyone' | 'member'>('everyone');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string>(''); // YYYY-MM-DD

  const toggle = (title: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title); else next.add(title);
      return next;
    });
  };

  const broadcastSelected = async () => {
    if (selected.size === 0) {
      Alert.alert('No tasks selected', 'Choose at least one task to broadcast.');
      return;
    }
    if (assignMode === 'member' && !assigneeId) {
      Alert.alert('Missing assignee', 'Please select a member to assign to.');
      return;
    }
    try {
      for (const s of suggestions) {
        if (!selected.has(s.title)) continue;
        await createTask.mutateAsync({
          id: undefined as any,
          title: s.title,
          description: s.description || null,
          type: assignMode === 'everyone' ? ('site' as any) : ('personal' as any),
          assigned_to: assignMode === 'member' ? assigneeId : null,
          due_date: dueDate ? (new Date(dueDate).toISOString().slice(0, 10) as any) : null,
          is_completed: false as any,
          proof_photos: [] as any,
          completed_at: null,
          created_by: undefined as any,
          created_at: undefined as any,
          updated_at: undefined as any,
        } as any);
      }
      onClose();
    } catch (e) {
      Alert.alert('Error', 'Failed to broadcast tasks');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.colors.paper }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.grayLight }}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.colors.charcoal} />
          </TouchableOpacity>
          <Text style={{ marginLeft: 12, fontSize: 18, fontWeight: '600', color: theme.colors.charcoal }}>Weekly Tasks Generator</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <Text style={{ color: theme.colors.gray }}>Season: {season[0].toUpperCase() + season.slice(1)}</Text>

          {/* Assignment Controls */}
          <Card style={{ padding: 12 }}>
            <Text style={{ color: theme.colors.charcoal, fontWeight: '600', marginBottom: 8 }}>Assign To</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={() => setAssignMode('everyone')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name={assignMode === 'everyone' ? 'radio-button-on' : 'radio-button-off'} size={18} color={theme.colors.green} />
                <Text style={{ color: theme.colors.charcoal }}>Everyone</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setAssignMode('member')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name={assignMode === 'member' ? 'radio-button-on' : 'radio-button-off'} size={18} color={theme.colors.green} />
                <Text style={{ color: theme.colors.charcoal }}>Specific member</Text>
              </TouchableOpacity>
            </View>
            {assignMode === 'member' && (
              <View style={{ marginTop: 12 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {members.map((m: any) => (
                    <TouchableOpacity key={m.id} onPress={() => setAssigneeId(m.id)} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1, borderColor: assigneeId === m.id ? theme.colors.green : theme.colors.grayLight, marginRight: 8 }}>
                      <Text style={{ color: assigneeId === m.id ? theme.colors.green : theme.colors.charcoal }}>{m.full_name || m.email}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </Card>

          {/* Due Date */}
          <Card style={{ padding: 12 }}>
            <Text style={{ color: theme.colors.charcoal, fontWeight: '600', marginBottom: 8 }}>Due Date (optional)</Text>
            <TextInput
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.gray}
              style={{ borderWidth: 1, borderColor: theme.colors.grayLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: theme.colors.charcoal }}
            />
          </Card>

          {suggestions.map((s) => (
            <Card key={s.title} style={{ padding: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.charcoal, fontWeight: '600' }}>{s.title}</Text>
                  {s.description ? (
                    <Text style={{ color: theme.colors.gray, marginTop: 4 }}>{s.description}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() => toggle(s.title)}
                  style={{ padding: 8, borderRadius: 16, backgroundColor: selected.has(s.title) ? theme.colors.green + '20' : theme.colors.grayLight }}
                >
                  <Ionicons name={selected.has(s.title) ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={selected.has(s.title) ? theme.colors.green : theme.colors.gray} />
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </ScrollView>

        <View style={{ padding: 16 }}>
          <Button title="Broadcast Selected Tasks" onPress={broadcastSelected} />
        </View>
      </View>
    </Modal>
  );
};


