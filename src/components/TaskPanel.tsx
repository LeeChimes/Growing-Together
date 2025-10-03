import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../design/Button';
import { Card } from '../design/Card';
import { Tag } from '../design/Tag';
import { tokens } from '../design/tokens';
import { useAuthStore } from '../store/authStore';
import { 
  useAvailableTasks, 
  useMyAssignedTasks, 
  useOverdueTasks,
  useAcceptTask,
  useStartTask,
  useCompleteTaskWithNotes,
  useComprehensiveTaskStats
} from '../hooks/useTasks';
import { 
  TaskWithAssignment, 
  getTaskStatus,
  formatTaskDueDate,
  getTaskUrgency,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_PRIORITY_COLORS,
  TASK_CATEGORY_LABELS,
  TASK_CATEGORY_ICONS,
  canAcceptTask,
  canCompleteTask
} from '../types/tasks';
import { CreateTaskModal } from './CreateTaskModal';

interface TaskPanelProps {
  onTaskPress?: (task: TaskWithAssignment) => void;
}

export function TaskPanel({ onTaskPress }: TaskPanelProps) {
  const { user } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithAssignment | null>(null);

  const isAdmin = user?.role === 'admin';
  
  const { data: availableTasks = [], isLoading: loadingAvailable } = useAvailableTasks();
  const { data: myTasks = [], isLoading: loadingMy } = useMyAssignedTasks();
  const { data: overdueTasks = [], isLoading: loadingOverdue } = useOverdueTasks();
  const { data: stats } = useComprehensiveTaskStats();

  const acceptTaskMutation = useAcceptTask();
  const startTaskMutation = useStartTask();
  const completeTaskMutation = useCompleteTaskWithNotes();

  const handleTaskPress = (task: TaskWithAssignment) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
    onTaskPress?.(task);
  };

  const handleAcceptTask = async (task: TaskWithAssignment) => {
    try {
      await acceptTaskMutation.mutateAsync(task.id);
      Alert.alert('Success', 'Task accepted! You can now start working on it.');
    } catch (error) {
      console.error('Error accepting task:', error);
      Alert.alert('Error', 'Failed to accept task. Please try again.');
    }
  };

  const handleStartTask = async (task: TaskWithAssignment) => {
    try {
      await startTaskMutation.mutateAsync(task.id);
      Alert.alert('Started', 'Task marked as in progress!');
    } catch (error) {
      console.error('Error starting task:', error);
      Alert.alert('Error', 'Failed to start task. Please try again.');
    }
  };

  const handleCompleteTask = async (task: TaskWithAssignment) => {
    Alert.prompt(
      'Complete Task',
      'Add any notes about the completed task (optional):',
      async (notes) => {
        try {
          await completeTaskMutation.mutateAsync({ taskId: task.id, notes });
          Alert.alert('Completed', 'Task marked as completed! Great work!');
        } catch (error) {
          console.error('Error completing task:', error);
          Alert.alert('Error', 'Failed to complete task. Please try again.');
        }
      }
    );
  };

  const getTaskStatusColor = (task: TaskWithAssignment) => {
    const status = getTaskStatus(task);
    return TASK_STATUS_COLORS[status];
  };

  const getTaskUrgencyColor = (task: TaskWithAssignment) => {
    const urgency = getTaskUrgency(task);
    switch (urgency) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      default: return '#4CAF50';
    }
  };

  const TaskCard = ({ task }: { task: TaskWithAssignment }) => {
    const status = getTaskStatus(task);
    const urgency = getTaskUrgency(task);
    const isAssignedToMe = task.assigned_to === user?.id;

    return (
      <TouchableOpacity onPress={() => handleTaskPress(task)}>
        <Card style={[styles.taskCard, { borderLeftColor: getTaskUrgencyColor(task) }]}>
          <View style={styles.taskHeader}>
            <Text style={styles.taskTitle} numberOfLines={1}>
              {task.title}
            </Text>
            <Tag 
              text={TASK_STATUS_LABELS[status]} 
              color={getTaskStatusColor(task)} 
              size="small" 
            />
          </View>

          <Text style={styles.taskDescription} numberOfLines={2}>
            {task.description}
          </Text>

          <View style={styles.taskMeta}>
            <View style={styles.taskMetaRow}>
              <Ionicons name="calendar-outline" size={14} color={tokens.colors.text.secondary} />
              <Text style={styles.taskMetaText}>
                Due: {formatTaskDueDate(task.due_date)}
              </Text>
            </View>
            
            <View style={styles.taskMetaRow}>
              <Ionicons name={TASK_CATEGORY_ICONS[task.category] as any} size={14} color={tokens.colors.text.secondary} />
              <Text style={styles.taskMetaText}>
                {TASK_CATEGORY_LABELS[task.category]}
              </Text>
            </View>

            {task.location && (
              <View style={styles.taskMetaRow}>
                <Ionicons name="location-outline" size={14} color={tokens.colors.text.secondary} />
                <Text style={styles.taskMetaText}>
                  {task.location}
                </Text>
              </View>
            )}
          </View>

          {isAssignedToMe && (
            <View style={styles.assignedToMe}>
              <Ionicons name="person" size={16} color={tokens.colors.primary} />
              <Text style={styles.assignedToMeText}>Assigned to you</Text>
            </View>
          )}

          <View style={styles.taskActions}>
            {canAcceptTask(task, user?.id || '') && (
              <Button
                title="Accept"
                onPress={() => handleAcceptTask(task)}
                style={styles.actionButton}
                size="small"
                loading={acceptTaskMutation.isPending}
              />
            )}

            {isAssignedToMe && status === 'accepted' && (
              <Button
                title="Start"
                onPress={() => handleStartTask(task)}
                style={styles.actionButton}
                size="small"
                loading={startTaskMutation.isPending}
              />
            )}

            {canCompleteTask(task, user?.id || '') && (
              <Button
                title="Complete"
                onPress={() => handleCompleteTask(task)}
                style={[styles.actionButton, styles.completeButton]}
                size="small"
                loading={completeTaskMutation.isPending}
              />
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const StatsCard = ({ title, value, color, icon }: { 
    title: string; 
    value: number; 
    color: string; 
    icon: string; 
  }) => (
    <Card style={[styles.statsCard, { borderLeftColor: color }]}>
      <View style={styles.statsContent}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={styles.statsValue}>{value}</Text>
        <Text style={styles.statsLabel}>{title}</Text>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="list" size={24} color={tokens.colors.primary} />
          <Text style={styles.headerTitle}>Tasks</Text>
        </View>
        
        {isAdmin && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {stats && (
        <View style={styles.statsContainer}>
          <StatsCard title="Available" value={stats.available} color="#2196F3" icon="clipboard-outline" />
          <StatsCard title="In Progress" value={stats.inProgress} color="#9C27B0" icon="play-circle-outline" />
          <StatsCard title="Completed" value={stats.completed} color="#4CAF50" icon="checkmark-circle-outline" />
          <StatsCard title="Overdue" value={stats.overdue} color="#F44336" icon="alert-circle-outline" />
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {overdueTasks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="alert-circle" size={16} color="#F44336" /> Overdue Tasks
            </Text>
            {overdueTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </View>
        )}

        {myTasks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="person" size={16} color={tokens.colors.primary} /> My Tasks
            </Text>
            {myTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </View>
        )}

        {availableTasks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="clipboard-outline" size={16} color="#2196F3" /> Available Tasks
            </Text>
            {availableTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </View>
        )}

        {availableTasks.length === 0 && myTasks.length === 0 && overdueTasks.length === 0 && (
          <Card style={styles.emptyState}>
            <Ionicons name="clipboard-outline" size={48} color={tokens.colors.text.secondary} />
            <Text style={styles.emptyStateTitle}>No Tasks Available</Text>
            <Text style={styles.emptyStateDescription}>
              {isAdmin 
                ? "Create your first task to get started managing the allotment."
                : "There are currently no tasks available. Check back later!"}
            </Text>
            {isAdmin && (
              <Button
                title="Create Task"
                onPress={() => setShowCreateModal(true)}
                style={styles.emptyStateButton}
              />
            )}
          </Card>
        )}
      </ScrollView>

      <CreateTaskModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </View>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.primary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: tokens.colors.text.primary,
  },
  createButton: {
    backgroundColor: tokens.colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    borderLeftWidth: 4,
  },
  statsContent: {
    alignItems: 'center',
    gap: 4,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: tokens.colors.text.primary,
  },
  statsLabel: {
    fontSize: 12,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: tokens.colors.text.primary,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskCard: {
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: tokens.colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  taskDescription: {
    fontSize: 14,
    color: tokens.colors.text.secondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  taskMeta: {
    gap: 6,
    marginBottom: 12,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskMetaText: {
    fontSize: 12,
    color: tokens.colors.text.secondary,
  },
  assignedToMe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: tokens.colors.primary + '20',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  assignedToMeText: {
    fontSize: 12,
    color: tokens.colors.primary,
    fontWeight: '500',
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: tokens.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyStateButton: {
    paddingHorizontal: 24,
  },
});
