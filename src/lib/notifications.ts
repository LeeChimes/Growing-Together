// Conditional imports for web compatibility
let Notifications: any;
let Device: any;

if (typeof window === 'undefined') {
  // Native platform
  Notifications = require('expo-notifications');
  Device = require('expo-device');
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
  Device = {
    isDevice: true,
    brand: 'Web',
    modelName: 'Browser',
    osName: 'Web',
    osVersion: '1.0.0',
  };
}
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationPreferences {
  eventReminders: boolean;
  eventReminder24h: boolean;
  eventReminder1h: boolean;
  taskReminders: boolean;
  taskReminderTime: string; // "09:00" format
  taskReminderDays: string[]; // ["monday", "tuesday", etc.]
  announcementNotifications: boolean;
  communityNotifications: boolean;
  sound: boolean;
  vibration: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  eventReminders: true,
  eventReminder24h: true,
  eventReminder1h: true,
  taskReminders: true,
  taskReminderTime: '09:00',
  taskReminderDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  announcementNotifications: true,
  communityNotifications: true,
  sound: true,
  vibration: true,
};

const STORAGE_KEY = 'notification_preferences';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    // @ts-ignore - platform variations
    shouldShowBanner: true,
    // @ts-ignore - platform variations
    shouldShowList: true,
  } as any),
} as any);

class NotificationService {
  private static instance: NotificationService;
  private preferences: NotificationPreferences = DEFAULT_PREFERENCES;
  private isInitialized = false;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Load preferences
      await this.loadPreferences();

      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Notification permissions not granted');
        return false;
      }

      // Set up notification categories
      await this.setupNotificationCategories();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn('Notifications not supported on simulator');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    // Set up notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Growing Together',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#22c55e',
        sound: 'default',
      });
    }

    return true;
  }

  private async setupNotificationCategories(): Promise<void> {
    await Notifications.setNotificationCategoryAsync('event', [
      {
        identifier: 'view_event',
        buttonTitle: 'View Event',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'rsvp_going',
        buttonTitle: 'RSVP Going',
        options: { opensAppToForeground: false },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('task', [
      {
        identifier: 'view_tasks',
        buttonTitle: 'View Tasks',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'mark_done',
        buttonTitle: 'Mark Done',
        options: { opensAppToForeground: false },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('announcement', [
      {
        identifier: 'view_announcement',
        buttonTitle: 'View',
        options: { opensAppToForeground: true },
      },
    ]);
  }

  // Preferences Management
  async getPreferences(): Promise<NotificationPreferences> {
    return this.preferences;
  }

  async updatePreferences(newPreferences: Partial<NotificationPreferences>): Promise<void> {
    this.preferences = { ...this.preferences, ...newPreferences };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences));
    
    // Reschedule all notifications with new preferences
    await this.rescheduleAll();
  }

  private async loadPreferences(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  }

  // Event Notifications
  async scheduleEventReminder(event: {
    id: string;
    title: string;
    description: string;
    start_date: string;
    location: string;
  }): Promise<void> {
    if (!this.preferences.eventReminders) return;

    const eventDate = new Date(event.start_date);
    const now = new Date();

    // Cancel existing notifications for this event
    await this.cancelEventNotifications(event.id);

    // Schedule 24h reminder
    if (this.preferences.eventReminder24h) {
      const reminder24h = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
      if (reminder24h > now) {
        await Notifications.scheduleNotificationAsync({
          identifier: `event_24h_${event.id}`,
          content: {
            title: 'Event Tomorrow',
            body: `${event.title} is tomorrow at ${event.location}`,
            data: { 
              type: 'event_reminder', 
              eventId: event.id, 
              reminderType: '24h' 
            },
            categoryIdentifier: 'event',
            sound: this.preferences.sound ? 'default' : undefined,
          },
          // @ts-ignore - relax trigger typing
          trigger: { type: 'date', date: reminder24h } as any,
        } as any);
      }
    }

    // Schedule 1h reminder
    if (this.preferences.eventReminder1h) {
      const reminder1h = new Date(eventDate.getTime() - 60 * 60 * 1000);
      if (reminder1h > now) {
        await Notifications.scheduleNotificationAsync({
          identifier: `event_1h_${event.id}`,
          content: {
            title: 'Event Starting Soon',
            body: `${event.title} starts in 1 hour at ${event.location}`,
            data: { 
              type: 'event_reminder', 
              eventId: event.id, 
              reminderType: '1h' 
            },
            categoryIdentifier: 'event',
            sound: this.preferences.sound ? 'default' : undefined,
          },
          // @ts-ignore
          trigger: { type: 'date', date: reminder1h } as any,
        } as any);
      }
    }
  }

  async cancelEventNotifications(eventId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(`event_24h_${eventId}`);
    await Notifications.cancelScheduledNotificationAsync(`event_1h_${eventId}`);
  }

  // Task Notifications
  async scheduleDailyTaskReminder(): Promise<void> {
    if (!this.preferences.taskReminders) return;

    // Cancel existing task reminders
    await Notifications.cancelScheduledNotificationAsync('daily_task_reminder');

    const [hours, minutes] = this.preferences.taskReminderTime.split(':').map(Number);
    
    // Schedule for each selected day
    for (const day of this.preferences.taskReminderDays) {
      const weekday = this.getWeekdayNumber(day);
      
      await Notifications.scheduleNotificationAsync({
        identifier: `daily_task_reminder_${day}`,
        content: {
          title: 'Daily Tasks',
          body: 'Check your tasks for today and keep your garden growing!',
          data: { 
            type: 'task_reminder',
            reminderType: 'daily'
          },
          categoryIdentifier: 'task',
          sound: this.preferences.sound ? 'default' : undefined,
        },
        // @ts-ignore
        trigger: { type: 'calendar', weekday, hour: hours, minute: minutes, repeats: true } as any,
      } as any);
    }
  }

  private getWeekdayNumber(day: string): number {
    const days = {
      sunday: 1,
      monday: 2,
      tuesday: 3,
      wednesday: 4,
      thursday: 5,
      friday: 6,
      saturday: 7,
    };
    return days[day.toLowerCase() as keyof typeof days] || 1;
  }

  // Task-specific notifications
  async scheduleTaskDueReminder(task: {
    id: string;
    title: string;
    description?: string | null;
    due_date?: string | null;
  }): Promise<void> {
    if (!this.preferences.taskReminders || !task.due_date) return;

    const dueDate = new Date(task.due_date);
    const now = new Date();

    // Schedule reminder 1 day before due date
    const reminderDate = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000);
    
    if (reminderDate > now) {
      await Notifications.scheduleNotificationAsync({
        identifier: `task_due_${task.id}`,
        content: {
          title: 'Task Due Tomorrow',
          body: `"${task.title}" is due tomorrow`,
          data: { 
            type: 'task_due_reminder', 
            taskId: task.id 
          },
          categoryIdentifier: 'task',
          sound: this.preferences.sound ? 'default' : undefined,
        },
        // @ts-ignore
        trigger: { type: 'date', date: reminderDate } as any,
      } as any);
    }
  }

  async cancelTaskNotifications(taskId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(`task_due_${taskId}`);
  }

  // Announcement Notifications
  async sendAnnouncementNotification(announcement: {
    id: string;
    title: string;
    content: string;
  }): Promise<void> {
    if (!this.preferences.announcementNotifications) return;

    await Notifications.scheduleNotificationAsync({
      identifier: `announcement_${announcement.id}`,
      content: {
        title: announcement.title,
        body: announcement.content,
        data: { 
          type: 'announcement', 
          announcementId: announcement.id 
        },
        categoryIdentifier: 'announcement',
        sound: this.preferences.sound ? 'default' : undefined,
      },
      trigger: null, // Send immediately
    });
  }

  // Community Notifications
  async sendCommunityNotification(notification: {
    id: string;
    title: string;
    body: string;
    type: 'post_reaction' | 'post_comment' | 'mention';
    relatedId: string;
  }): Promise<void> {
    if (!this.preferences.communityNotifications) return;

    await Notifications.scheduleNotificationAsync({
      identifier: `community_${notification.id}`,
      content: {
        title: notification.title,
        body: notification.body,
        data: { 
          type: 'community', 
          communityType: notification.type,
          relatedId: notification.relatedId
        },
        sound: this.preferences.sound ? 'default' : undefined,
      },
      trigger: null, // Send immediately
    });
  }

  // Utility methods
  async rescheduleAll(): Promise<void> {
    // Cancel all scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Reschedule daily task reminders
    await this.scheduleDailyTaskReminder();
    
    // Note: Event and individual task reminders will be rescheduled 
    // when events/tasks are created or updated
  }

  async getAllScheduledNotifications(): Promise<any[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Get notification permission status
  async getPermissionStatus(): Promise<string> {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }
}

export const notificationService = NotificationService.getInstance();

// Export utility functions for React hooks
export const useNotificationHandler = () => {
  const handleNotificationResponse = (response: any) => {
    const { notification } = response;
    const { type, eventId, taskId, announcementId } = notification.request.content.data as any;
    
    switch (type) {
      case 'event_reminder':
        // Navigate to event details
        console.log('Navigate to event:', eventId);
        break;
      case 'task_reminder':
      case 'task_due_reminder':
        // Navigate to tasks screen
        console.log('Navigate to tasks:', taskId);
        break;
      case 'announcement':
        // Navigate to announcement
        console.log('Navigate to announcement:', announcementId);
        break;
      case 'community':
        // Navigate to community
        console.log('Navigate to community');
        break;
    }
  };

  return { handleNotificationResponse };
};