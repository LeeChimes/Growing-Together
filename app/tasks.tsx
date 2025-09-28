import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  Card,
  Avatar,
  Tag,
  Button,
  FAB,
  EmptyState,
  useTheme,
} from '../src/design';
import { 
  useTasks, 
  useCompleteTask, 
  useDeleteTask, 
  useTaskStats 
} from '../src/hooks/useTasks';
import { CreateTaskModal } from '../src/components/CreateTaskModal';
import { useAuthStore } from '../src/store/authStore';
import { Database } from '../src/lib/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];

export default function TasksScreen() {
  const theme = useTheme();
  const { user, profile } = useAuthStore();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [filter, setFilter] = useState<'all' | 'personal' | 'site' | 'completed'>('all');
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [proofPhotos, setProofPhotos] = useState<string[]>([]);

  const getTaskFilters = () => {
    switch (filter) {
      case 'personal':
        return { type: 'personal' as const, completed: false };
      case 'site':
        return { type: 'site' as const, completed: false };
      case 'completed':
        return { completed: true };
      default:
        return { completed: false };
    }
  };

  const { data: tasks = [], isLoading, refetch } = useTasks(getTaskFilters());
  const { data: stats } = useTaskStats();
  const completeTaskMutation = useCompleteTask();
  const deleteTaskMutation = useDeleteTask();

  const myTasks = tasks.filter(task => 
    task.assigned_to === user?.id || task.created_by === user?.id
  );

  const availableSiteTasks = tasks.filter(task => 
    task.type === 'site' && !task.assigned_to && !task.is_completed
  );

  const handleCompleteTask = async (taskId: string, requiresProof: boolean = false) => {
    if (requiresProof) {
      setCompletingTask(taskId);
      return;
    }

    try {
      await completeTaskMutation.mutateAsync({ taskId });
    } catch (error) {
      Alert.alert('Error', 'Failed to complete task');
    }
  };

  const handleCompleteWithProof = async () => {
    if (!completingTask) return;

    try {
      await completeTaskMutation.mutateAsync({ 
        taskId: completingTask, 
        proofPhotos 
      });
      setCompletingTask(null);
      setProofPhotos([]);
    } catch (error) {
      Alert.alert('Error', 'Failed to complete task');
    }
  };

  const pickProofPhotos = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 3,
      });

      if (!result.canceled) {
        const newPhotos = result.assets.map(asset => asset.uri);
        setProofPhotos(prev => [...prev, ...newPhotos].slice(0, 3));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const handleDeleteTask = (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTaskMutation.mutate(taskId),
        },
      ]
    );
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays <= 7) return `Due in ${diffDays} days`;
    return date.toLocaleDateString('en-GB');
  };

  const getDueDateColor = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return theme.colors.error;
    if (diffDays === 0) return theme.colors.warning;
    if (diffDays <= 3) return theme.colors.warning;
    return theme.colors.success;
  };

  const renderTask = ({ item: task }: { item: any }) => {
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !task.is_completed;
    const isOwner = task.created_by === user?.id;
    const isAssignedToMe = task.assigned_to === user?.id;
    const canComplete = isAssignedToMe || (task.type === 'site' && !task.assigned_to);

    return (
      <Card style={[styles.taskCard, isOverdue && styles.overdueTask]}>
        <View style={styles.taskHeader}>
          <View style={styles.taskInfo}>
            <View style={styles.taskTitleRow}>
              <Text style={[styles.taskTitle, { color: theme.colors.charcoal }]}>
                {task.title}
              </Text>
              <View style={styles.taskMeta}>
                <Tag
                  label={task.type}
                  variant="default"
                  size="small"
                  style={{ 
                    backgroundColor: task.type === 'personal' ? theme.colors.green + '20' : theme.colors.sky + '20' 
                  }}
                />
                {task.is_completed && (
                  <Tag label="Completed" variant="success" size="small" />
                )}
              </View>
            </View>

            {task.description && (
              <Text style={[styles.taskDescription, { color: theme.colors.gray }]}>
                {task.description}
              </Text>
            )}

            <View style={styles.taskDetails}>
              {task.due_date && (
                <View style={styles.taskDetail}>
                  <Ionicons name="time" size={14} color={getDueDateColor(task.due_date)} />
                  <Text style={[styles.taskDetailText, { color: getDueDateColor(task.due_date) }]}>
                    {formatDueDate(task.due_date)}
                  </Text>
                </View>
              )}

              {task.assignee && (
                <View style={styles.taskDetail}>
                  <Avatar name={task.assignee.full_name} size="small" />
                  <Text style={[styles.taskDetailText, { color: theme.colors.gray }]}>
                    {task.assignee.full_name}
                  </Text>
                </View>
              )}

              {task.creator && (
                <View style={styles.taskDetail}>
                  <Ionicons name="person" size={14} color={theme.colors.gray} />
                  <Text style={[styles.taskDetailText, { color: theme.colors.gray }]}>
                    Created by {task.creator.full_name}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.taskActions}>
            {!task.is_completed && canComplete && (
              <TouchableOpacity
                style={[styles.completeButton, { backgroundColor: theme.colors.success }]}
                onPress={() => handleCompleteTask(task.id, task.type === 'site')}
              >
                <Ionicons name="checkmark" size={20} color={theme.colors.paper} />
              </TouchableOpacity>
            )}

            {isOwner && (
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: theme.colors.error + '20' }]}
                onPress={() => handleDeleteTask(task.id)}
              >
                <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Proof Photos */}
        {task.proof_photos && task.proof_photos.length > 0 && (
          <View style={styles.proofPhotos}>
            <Text style={[styles.proofTitle, { color: theme.colors.charcoal }]}>
              Completion Proof:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {task.proof_photos.map((photo: string, index: number) => (
                <Image key={index} source={{ uri: photo }} style={styles.proofPhoto} />
              ))}
            </ScrollView>
          </View>
        )}
      </Card>
    );
  };

  const renderStats = () => {
    if (!stats) return null;

    return (
      <Card style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <Ionicons name="analytics" size={20} color={theme.colors.green} />
          <Text style={[styles.statsTitle, { color: theme.colors.charcoal }]}>
            Your Task Stats
          </Text>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.green }]}>
              {stats.completed}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.gray }]}>
              Completed
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.warning }]}>
              {stats.pending}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.gray }]}>
              Pending
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.error }]}>
              {stats.overdue}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.gray }]}>
              Overdue
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.sky }]}>
              {stats.completionRate}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.gray }]}>
              Completion
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.paper }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.charcoal }]}>
            Tasks & Maintenance
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.gray }]}>
            {myTasks.length} my tasks • {availableSiteTasks.length} site tasks available
          </Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {[
              { id: 'all', label: 'All Tasks', icon: 'list' },
              { id: 'personal', label: 'My Plot', icon: 'person' },
              { id: 'site', label: 'Site Tasks', icon: 'home' },
              { id: 'completed', label: 'Completed', icon: 'checkmark-circle' },
            ].map((filterOption) => (
              <TouchableOpacity
                key={filterOption.id}
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: filter === filterOption.id ? theme.colors.green + '20' : theme.colors.grayLight,
                    borderColor: filter === filterOption.id ? theme.colors.green : 'transparent',
                  }
                ]}
                onPress={() => setFilter(filterOption.id as any)}
              >
                <Ionicons 
                  name={filterOption.icon as any} 
                  size={16} 
                  color={filter === filterOption.id ? theme.colors.green : theme.colors.gray} 
                />
                <Text 
                  style={[
                    styles.filterText,
                    { color: filter === filterOption.id ? theme.colors.green : theme.colors.gray }
                  ]}
                >
                  {filterOption.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListHeaderComponent={filter === 'all' ? renderStats() : null}
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name="checkmark-circle" size={48} color={theme.colors.gray} />}
            title="No tasks found"
            description={
              filter === 'completed' 
                ? 'No completed tasks yet'
                : filter === 'personal'
                ? 'No personal plot tasks'
                : filter === 'site'
                ? 'No site tasks available'
                : 'Create your first task!'
            }
            actionLabel={filter !== 'completed' ? 'Create Task' : undefined}
            onAction={filter !== 'completed' ? () => setCreateModalVisible(true) : undefined}
          />
        }
      />

      {/* Completion Modal */}
      {completingTask && (
        <View style={styles.completionModal}>
          <Card style={styles.completionCard}>
            <Text style={[styles.completionTitle, { color: theme.colors.charcoal }]}>
              Complete Task
            </Text>
            <Text style={[styles.completionSubtitle, { color: theme.colors.gray }]}>
              Add proof photos (optional for site tasks)
            </Text>
            
            <View style={styles.proofSection}>
              <TouchableOpacity
                style={[styles.addProofButton, { borderColor: theme.colors.green }]}
                onPress={pickProofPhotos}
              >
                <Ionicons name="camera" size={24} color={theme.colors.green} />
                <Text style={[styles.addProofText, { color: theme.colors.green }]}>
                  Add Photos ({proofPhotos.length}/3)
                </Text>
              </TouchableOpacity>
              
              {proofPhotos.length > 0 && (
                <ScrollView horizontal style={styles.proofPreview}>
                  {proofPhotos.map((photo, index) => (
                    <Image key={index} source={{ uri: photo }} style={styles.previewPhoto} />
                  ))}
                </ScrollView>
              )}
            </View>
            
            <View style={styles.completionActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setCompletingTask(null);
                  setProofPhotos([]);
                }}
                style={styles.cancelButton}
              />
              <Button
                title="Complete Task"
                onPress={handleCompleteWithProof}
                loading={completeTaskMutation.isPending}
                style={styles.completeTaskButton}
              />
            </View>
          </Card>
        </View>
      )}

      {/* FAB */}
      <FAB
        onPress={() => setCreateModalVisible(true)}
        icon={<Ionicons name="add" size={24} color="white" />}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  filtersContainer: {
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  statsCard: {
    marginBottom: 16,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  taskCard: {
    marginBottom: 12,
  },
  overdueTask: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 4,
  },
  taskDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  taskDetails: {
    gap: 4,
  },
  taskDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskDetailText: {
    fontSize: 12,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  completeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofPhotos: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  proofTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  proofPhoto: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  // Completion modal styles
  completionModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  completionCard: {
    width: '100%',
    maxWidth: 400,
  },
  completionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  completionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  proofSection: {
    marginBottom: 20,
  },
  addProofButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    gap: 8,
  },
  addProofText: {
    fontSize: 14,
    fontWeight: '500',
  },
  proofPreview: {
    marginTop: 12,
  },
  previewPhoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  completionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  completeTaskButton: {
    flex: 1,
  },
});