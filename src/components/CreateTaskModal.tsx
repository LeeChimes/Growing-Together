import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '../design/Button';
import { Card } from '../design/Card';
import { tokens } from '../design/tokens';
import { useCreateTask } from '../hooks/useTasks';
import { 
  CreateTaskData, 
  TaskPriority, 
  TaskCategory, 
  TASK_PRIORITY_LABELS, 
  TASK_CATEGORY_LABELS,
  TASK_PRIORITY_COLORS,
  TASK_CATEGORY_ICONS
} from '../types/tasks';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateTaskModal({ visible, onClose }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'personal' | 'site'>('site');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState<TaskCategory>('general');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [location, setLocation] = useState('');

  const createTaskMutation = useCreateTask();

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a task description');
      return;
    }

    if (!dueDate) {
      Alert.alert('Error', 'Please select a due date');
      return;
    }

    if (!type) {
      Alert.alert('Error', 'Please select a task type');
      return;
    }

    const taskData: CreateTaskData = {
      title: title.trim(),
      description: description.trim(),
      type,
      due_date: dueDate ? dueDate.toISOString().split('T')[0] : '',
      priority,
      category,
      estimated_duration: estimatedDuration ? parseInt(estimatedDuration) : undefined,
      location: location.trim() || undefined,
    };

    try {
      console.log('Creating task with data:', taskData);
      await createTaskMutation.mutateAsync(taskData); // wait for resolution/rejection
      onClose(); // close modal on success
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to create task');
    }
    // Note: The loading state is managed by createTaskMutation.isPending
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setType('site');
    setDueDate(null);
    setShowDatePicker(false);
    setPriority('medium');
    setCategory('general');
    setEstimatedDuration('');
    setLocation('');
    onClose();
  };

  const formatDateUK = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const getDateInput = () => {
    if (Platform.OS === 'web') {
      // For web, use HTML date input which shows a calendar picker
      return (
        <input
          type="date"
          value={dueDate ? dueDate.toISOString().split('T')[0] : ''}
          onChange={(e) => {
            if (e.target.value) {
              setDueDate(new Date(e.target.value));
            }
          }}
          min={new Date().toISOString().split('T')[0]}
          style={{
            width: '100%',
            padding: '12px',
            border: `1px solid ${tokens.colors.border.primary}`,
            borderRadius: '8px',
            fontSize: '16px',
            backgroundColor: tokens.colors.background.primary,
            color: tokens.colors.text.primary,
          }}
        />
      );
    }

    // For native platforms, use the community date picker
    return (
      <>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateButtonText}>
            {dueDate ? formatDateUK(dueDate) : 'Select Date'}
          </Text>
          <Ionicons name="calendar-outline" size={20} color={tokens.colors.primary} />
        </TouchableOpacity>
        
        {showDatePicker && (
          <DateTimePicker
            value={dueDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}
      </>
    );
  };

  const PrioritySelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.label}>Priority</Text>
      <View style={styles.selectorRow}>
        {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.selectorOption,
              { backgroundColor: priority === p ? TASK_PRIORITY_COLORS[p] : tokens.colors.background.secondary },
            ]}
            onPress={() => setPriority(p)}
          >
            <Text style={[
              styles.selectorOptionText,
              { color: priority === p ? 'white' : tokens.colors.text.primary }
            ]}>
              {TASK_PRIORITY_LABELS[p]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const CategorySelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.label}>Category</Text>
      <View style={styles.selectorGrid}>
        {(['general', 'maintenance', 'planting', 'harvesting', 'cleaning', 'repair', 'inspection', 'community'] as TaskCategory[]).map((c) => (
          <TouchableOpacity
            key={c}
            style={[
              styles.categoryOption,
              { backgroundColor: category === c ? tokens.colors.primary : tokens.colors.background.secondary },
            ]}
            onPress={() => setCategory(c)}
          >
            <Ionicons
              name={TASK_CATEGORY_ICONS[c] as any}
              size={20}
              color={category === c ? 'white' : tokens.colors.text.primary}
            />
            <Text style={[
              styles.categoryOptionText,
              { color: category === c ? 'white' : tokens.colors.text.primary }
            ]}>
              {TASK_CATEGORY_LABELS[c]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color={tokens.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create New Task</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Card style={styles.card}>
            <Text style={styles.label}>Task Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter task title"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={tokens.colors.text.secondary}
            />
          </Card>

          <Card style={styles.card}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe what needs to be done"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={tokens.colors.text.secondary}
            />
          </Card>

          <Card style={styles.card}>
            <Text style={styles.label}>Task Type *</Text>
            <View style={styles.selectorRow}>
              <TouchableOpacity
                style={[
                  styles.selectorOption,
                  { backgroundColor: type === 'site' ? tokens.colors.primary : tokens.colors.background.secondary },
                ]}
                onPress={() => setType('site')}
              >
                <Text style={[
                  styles.selectorOptionText,
                  { color: type === 'site' ? 'white' : tokens.colors.text.primary }
                ]}>
                  Site-wide Task
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.selectorOption,
                  { backgroundColor: type === 'personal' ? tokens.colors.primary : tokens.colors.background.secondary },
                ]}
                onPress={() => setType('personal')}
              >
                <Text style={[
                  styles.selectorOptionText,
                  { color: type === 'personal' ? 'white' : tokens.colors.text.primary }
                ]}>
                  Personal Task
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.label}>Due Date *</Text>
            {getDateInput()}
          </Card>

          <Card style={styles.card}>
            <PrioritySelector />
          </Card>

          <Card style={styles.card}>
            <CategorySelector />
          </Card>

          <Card style={styles.card}>
            <Text style={styles.label}>Estimated Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 30"
              value={estimatedDuration}
              onChangeText={setEstimatedDuration}
              keyboardType="numeric"
              placeholderTextColor={tokens.colors.text.secondary}
            />
          </Card>

          <Card style={styles.card}>
            <Text style={styles.label}>Location (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Plot 15, Greenhouse, Main Path"
              value={location}
              onChangeText={setLocation}
              placeholderTextColor={tokens.colors.text.secondary}
            />
          </Card>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Cancel"
            onPress={handleClose}
            style={[styles.button, styles.cancelButton]}
            textStyle={styles.cancelButtonText}
          />
          <Button
            title="Create Task"
            onPress={handleSubmit}
            style={[styles.button, styles.submitButton]}
            loading={createTaskMutation.isPending}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: tokens.colors.text.primary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: tokens.colors.text.primary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: tokens.colors.border.primary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: tokens.colors.text.primary,
    backgroundColor: tokens.colors.background.primary,
  },
  textArea: {
    height: 100,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: tokens.colors.border.primary,
    borderRadius: 8,
    padding: 12,
    backgroundColor: tokens.colors.background.primary,
  },
  dateButtonText: {
    fontSize: 16,
    color: tokens.colors.text.primary,
  },
  selectorContainer: {
    marginBottom: 16,
  },
  selectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectorOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: tokens.colors.border.primary,
  },
  selectorOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: tokens.colors.border.primary,
    gap: 6,
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border.primary,
    gap: 12,
  },
  button: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: tokens.colors.background.secondary,
  },
  cancelButtonText: {
    color: tokens.colors.text.primary,
  },
  submitButton: {
    backgroundColor: tokens.colors.primary,
  },
});