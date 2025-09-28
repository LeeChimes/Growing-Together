import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, FormField, Tag, useTheme } from '../design';
import { useCreateTask } from '../hooks/useTasks';
import { Database } from '../lib/database.types';
import { useAuthStore } from '../store/authStore';

type Task = Database['public']['Tables']['tasks']['Row'];

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['personal', 'site']),
  due_date: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  task?: Task;
  defaultType?: 'personal' | 'site';
}

const taskTemplates = [
  {
    id: 'watering',
    title: 'Watering',
    type: 'personal' as const,
    emoji: '💧',
    template: {
      title: 'Water plants',
      description: 'Check soil moisture and water as needed',
    },
  },
  {
    id: 'weeding',
    title: 'Weeding',
    type: 'personal' as const,
    emoji: '🌿',
    template: {
      title: 'Weed plot',
      description: 'Remove weeds from beds and pathways',
    },
  },
  {
    id: 'harvesting',
    title: 'Harvesting',
    type: 'personal' as const,
    emoji: '🥕',
    template: {
      title: 'Harvest vegetables',
      description: 'Pick ripe vegetables and fruits',
    },
  },
  {
    id: 'maintenance',
    title: 'Plot Maintenance',
    type: 'personal' as const,
    emoji: '🔧',
    template: {
      title: 'General maintenance',
      description: 'Repair structures, check fencing, tidy plot',
    },
  },
  {
    id: 'communal',
    title: 'Communal Area',
    type: 'site' as const,
    emoji: '🏡',
    template: {
      title: 'Maintain communal area',
      description: 'Work on shared spaces and facilities',
    },
  },
  {
    id: 'compost',
    title: 'Compost Management',
    type: 'site' as const,
    emoji: '♻️',
    template: {
      title: 'Manage compost bins',
      description: 'Turn compost, add materials, maintain bins',
    },
  },
];

export function CreateTaskModal({ visible, onClose, task, defaultType }: CreateTaskModalProps) {
  const theme = useTheme();
  const { profile } = useAuthStore();
  const [selectedType, setSelectedType] = useState<'personal' | 'site'>(
    task?.type || defaultType || 'personal'
  );

  const createMutation = useCreateTask();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      type: selectedType,
      due_date: task?.due_date || '',
    },
  });

  const handleClose = () => {
    reset();
    setSelectedType(defaultType || 'personal');
    onClose();
  };

  const onSubmit = async (data: TaskFormData) => {
    try {
      const taskData = {
        ...data,
        type: selectedType,
        assigned_to: selectedType === 'personal' ? profile?.id : null,
        due_date: data.due_date || null,
      };

      await createMutation.mutateAsync(taskData);
      handleClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to create task');
    }
  };

  const applyTemplate = (template: { title: string; description: string }) => {
    setValue('title', template.title);
    setValue('description', template.description);
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  const handleDateChange = (dateStr: string) => {
    if (dateStr) {
      // Convert to ISO string for storage
      const date = new Date(dateStr + 'T00:00:00');
      setValue('due_date', date.toISOString());
    } else {
      setValue('due_date', '');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: theme.colors.grayLight }]}>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color={theme.colors.charcoal} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.charcoal }]}>
            {task ? 'Edit Task' : 'Create Task'}
          </Text>
          <Button
            title="Save"
            onPress={handleSubmit(onSubmit)}
            loading={createMutation.isPending}
            size="small"
          />
        </View>

        <ScrollView style={styles.content}>
          {/* Task Type Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.charcoal }]}>
              Task Type
            </Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: selectedType === 'personal' ? theme.colors.green + '20' : theme.colors.grayLight,
                    borderColor: selectedType === 'personal' ? theme.colors.green : 'transparent',
                  }
                ]}
                onPress={() => {
                  setSelectedType('personal');
                  setValue('type', 'personal');
                }}
              >
                <Ionicons 
                  name="person" 
                  size={20} 
                  color={selectedType === 'personal' ? theme.colors.green : theme.colors.gray} 
                />
                <Text 
                  style={[
                    styles.typeText,
                    { color: selectedType === 'personal' ? theme.colors.green : theme.colors.gray }
                  ]}
                >
                  Personal Plot
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: selectedType === 'site' ? theme.colors.sky + '20' : theme.colors.grayLight,
                    borderColor: selectedType === 'site' ? theme.colors.sky : 'transparent',
                  }
                ]}
                onPress={() => {
                  setSelectedType('site');
                  setValue('type', 'site');
                }}
              >
                <Ionicons 
                  name="home" 
                  size={20} 
                  color={selectedType === 'site' ? theme.colors.sky : theme.colors.gray} 
                />
                <Text 
                  style={[
                    styles.typeText,
                    { color: selectedType === 'site' ? theme.colors.sky : theme.colors.gray }
                  ]}
                >
                  Site/Communal
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Task Templates */}
          {!task && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.charcoal }]}>
                Quick Templates
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesScroll}>
                {taskTemplates
                  .filter(template => template.type === selectedType)
                  .map((template) => (
                    <TouchableOpacity
                      key={template.id}
                      style={[styles.templateButton, { borderColor: theme.colors.grayLight }]}
                      onPress={() => applyTemplate(template.template)}
                    >
                      <Text style={styles.templateEmoji}>{template.emoji}</Text>
                      <Text style={[styles.templateTitle, { color: theme.colors.charcoal }]}>
                        {template.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>
          )}

          {/* Basic Information */}
          <View style={styles.section}>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, value } }) => (
                <FormField
                  label="Task Title"
                  value={value}
                  onChangeText={onChange}
                  placeholder="What needs to be done?"
                  error={errors.title?.message}
                  required
                />
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <View>
                  <Text style={[styles.label, { color: theme.colors.charcoal }]}>
                    Description (Optional)
                  </Text>
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        borderColor: theme.colors.grayLight,
                        color: theme.colors.charcoal,
                      }
                    ]}
                    value={value || ''}
                    onChangeText={onChange}
                    placeholder="Add more details about this task..."
                    placeholderTextColor={theme.colors.gray}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              )}
            />
          </View>

          {/* Due Date */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.charcoal }]}>
              Due Date
            </Text>
            <Controller
              control={control}
              name="due_date"
              render={({ field: { value } }) => (
                <TextInput
                  style={[
                    styles.dateInput,
                    { borderColor: theme.colors.grayLight, color: theme.colors.charcoal }
                  ]}
                  value={formatDateForInput(value || '')}
                  onChangeText={handleDateChange}
                  placeholder="YYYY-MM-DD (optional)"
                  placeholderTextColor={theme.colors.gray}
                />
              )}
            />
          </View>

          {/* Task Type Info */}
          <View style={[styles.infoBox, { backgroundColor: selectedType === 'personal' ? theme.colors.green + '10' : theme.colors.sky + '10' }]}>
            <View style={styles.infoHeader}>
              <Ionicons 
                name="information-circle" 
                size={20} 
                color={selectedType === 'personal' ? theme.colors.green : theme.colors.sky} 
              />
              <Text style={[styles.infoTitle, { color: selectedType === 'personal' ? theme.colors.green : theme.colors.sky }]}>
                {selectedType === 'personal' ? 'Personal Plot Task' : 'Site/Communal Task'}
              </Text>
            </View>
            <Text style={[styles.infoText, { color: theme.colors.charcoal }]}>
              {selectedType === 'personal' 
                ? 'This task will be assigned to you and relates to your individual plot maintenance.'
                : 'This task relates to communal areas and can be picked up by any community member.'
              }
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  templatesScroll: {
    marginHorizontal: -4,
  },
  templateButton: {
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: 'white',
    marginHorizontal: 4,
    minWidth: 90,
  },
  templateEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  templateTitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    minHeight: 80,
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  infoBox: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});