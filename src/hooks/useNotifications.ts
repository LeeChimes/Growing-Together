import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// Conditional import for web compatibility
let Notifications: any;

if (typeof window === 'undefined') {
  // Native platform
  Notifications = require('expo-notifications');
} else {
  // Web platform - use mocks
  Notifications = {
    requestPermissionsAsync: async () => ({ status: 'granted' }),
    getPermissionsAsync: async () => ({ status: 'granted', canAskAgain: true, granted: true }),
    scheduleNotificationAsync: async (notification: any) => 'mock-id',
    cancelAllScheduledNotificationsAsync: async () => {},
    cancelScheduledNotificationAsync: async (id: string) => {},
    setNotificationHandler: (handler: any) => {},
    setNotificationCategoryAsync: async (identifier: string, actions: any[], options: any) => {},
    getNotificationCategoriesAsync: async () => [],
    deleteNotificationCategoryAsync: async (identifier: string) => {},
    addNotificationReceivedListener: (listener: any) => ({ remove: () => {} }),
    addNotificationResponseReceivedListener: (listener: any) => ({ remove: () => {} }),
    removeNotificationSubscription: (subscription: any) => {},
    dismissAllNotificationsAsync: async () => {},
    dismissNotificationAsync: async (id: string) => {},
    getPresentedNotificationsAsync: async () => [],
    setBadgeCountAsync: async (count: number) => {},
    getBadgeCountAsync: async () => 0,
  };
}
import { notificationService, NotificationPreferences } from '../lib/notifications';
import { useEvents } from './useEvents';
import { useTasks } from './useTasks';

export const useNotifications = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();

  // Initialize notification service
  useEffect(() => {
    const initNotifications = async () => {
      const success = await notificationService.initialize();
      setIsInitialized(success);
      
      if (success) {
        // Schedule daily task reminder
        await notificationService.scheduleDailyTaskReminder();
      }
    };

    initNotifications();
  }, []);

  // Set up notification response handler
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const { notification } = response;
        const { type, eventId, taskId, announcementId, relatedId } = notification.request.content.data as any;
        
        // Handle different notification types
        switch (type) {
          case 'event_reminder':
            // Could navigate to event details if needed
            queryClient.invalidateQueries({ queryKey: ['events'] });
            break;
          case 'task_reminder':
          case 'task_due_reminder':
            // Could navigate to tasks if needed
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            break;
          case 'announcement':
            // Handle announcement navigation
            break;
          case 'community':
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            break;
        }
      }
    );

    return () => subscription.remove();
  }, [queryClient]);

  return {
    isInitialized,
  };
};

export const useNotificationPreferences = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      return await notificationService.getPreferences();
    },
    enabled: true,
  });

  const updateMutation = useMutation({
    mutationFn: async (newPreferences: Partial<NotificationPreferences>) => {
      await notificationService.updatePreferences(newPreferences);
      return await notificationService.getPreferences();
    },
    onSuccess: (updatedPreferences) => {
      setPreferences(updatedPreferences);
    },
  });

  useEffect(() => {
    if (data) {
      setPreferences(data);
    }
  }, [data]);

  return {
    preferences: data,
    isLoading,
    error,
    updatePreferences: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
};

export const useEventNotifications = () => {
  const eventsQuery = useEvents();

  const scheduleEventNotification = useMutation({
    mutationFn: async (event: {
      id: string;
      title: string;
      description: string;
      start_date: string;
      location: string;
    }) => {
      await notificationService.scheduleEventReminder(event);
    },
  });

  const cancelEventNotification = useMutation({
    mutationFn: async (eventId: string) => {
      await notificationService.cancelEventNotifications(eventId);
    },
  });

  // Auto-schedule notifications for upcoming events
  useEffect(() => {
    if (eventsQuery.data) {
      const upcomingEvents = eventsQuery.data.filter(event => {
        const eventDate = new Date(event.start_date);
        const now = new Date();
        return eventDate > now;
      });

      upcomingEvents.forEach(event => {
        scheduleEventNotification.mutate({
          id: event.id,
          title: event.title,
          description: event.description,
          start_date: event.start_date,
          location: event.location,
        });
      });
    }
  }, [eventsQuery.data]);

  return {
    scheduleEventNotification: scheduleEventNotification.mutate,
    cancelEventNotification: cancelEventNotification.mutate,
    isScheduling: scheduleEventNotification.isPending,
  };
};

export const useTaskNotifications = () => {
  const tasksQuery = useTasks();

  const scheduleTaskNotification = useMutation({
    mutationFn: async (task: {
      id: string;
      title: string;
      description?: string | null;
      due_date?: string | null;
    }) => {
      await notificationService.scheduleTaskDueReminder(task);
    },
  });

  const cancelTaskNotification = useMutation({
    mutationFn: async (taskId: string) => {
      await notificationService.cancelTaskNotifications(taskId);
    },
  });

  // Auto-schedule notifications for tasks with due dates
  useEffect(() => {
    if (tasksQuery.data) {
      const tasksWithDueDates = tasksQuery.data.filter(task => 
        task.due_date && !task.is_completed
      );

      tasksWithDueDates.forEach(task => {
        scheduleTaskNotification.mutate({
          id: task.id,
          title: task.title,
          description: task.description,
          due_date: task.due_date,
        });
      });
    }
  }, [tasksQuery.data]);

  return {
    scheduleTaskNotification: scheduleTaskNotification.mutate,
    cancelTaskNotification: cancelTaskNotification.mutate,
    isScheduling: scheduleTaskNotification.isPending,
  };
};

export const useNotificationPermissions = () => {
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');

  const checkPermissions = async () => {
    const status = await notificationService.getPermissionStatus();
    setPermissionStatus(status);
    return status;
  };

  const requestPermissions = async () => {
    const granted = await notificationService.requestPermissions();
    const status = await notificationService.getPermissionStatus();
    setPermissionStatus(status);
    return granted;
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  return {
    permissionStatus,
    checkPermissions,
    requestPermissions,
    hasPermission: permissionStatus === 'granted',
  };
};