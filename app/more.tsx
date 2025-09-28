import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { 
  Card, 
  Button,
  useTheme,
  ListItem 
} from '../src/design';
import { useNotificationPreferences, useNotificationPermissions } from '../src/hooks/useNotifications';
import { useAccessibilitySettings, useUserProfile, useUpdateProfile } from '../src/hooks/useSettings';
import { useAuthStore } from '../src/store/authStore';
import { AdminDashboard } from '../src/components/AdminDashboard';

export default function MoreScreen() {
  const theme = useTheme();
  const { user, signOut } = useAuthStore();
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showAccessibilitySettings, setShowAccessibilitySettings] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  
  const { 
    preferences, 
    updatePreferences, 
    isLoading: preferencesLoading 
  } = useNotificationPreferences();
  
  const { 
    permissionStatus, 
    requestPermissions, 
    hasPermission 
  } = useNotificationPermissions();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const handleNotificationPermission = async () => {
    if (!hasPermission) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Notification permissions are required to receive reminders and updates. Please enable them in your device settings.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const renderNotificationSettings = () => {
    if (!showNotificationSettings || !preferences) return null;

    return (
      <View style={styles.settingsSection}>
        <TouchableOpacity
          style={styles.backHeader}
          onPress={() => setShowNotificationSettings(false)}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.charcoal} />
          <Text style={[styles.backHeaderTitle, { color: theme.colors.charcoal }]}>
            Notification Settings
          </Text>
        </TouchableOpacity>

        <ScrollView style={styles.settingsContent}>
          {/* Permission Status */}
          <Card style={styles.permissionCard}>
            <View style={styles.permissionStatus}>
              <Ionicons 
                name={hasPermission ? "checkmark-circle" : "alert-circle"} 
                size={24} 
                color={hasPermission ? theme.colors.success : theme.colors.warning} 
              />
              <View style={styles.permissionText}>
                <Text style={[styles.permissionTitle, { color: theme.colors.charcoal }]}>
                  Notification Permissions
                </Text>
                <Text style={[styles.permissionSubtitle, { color: theme.colors.gray }]}>
                  {hasPermission ? 'Enabled' : 'Disabled - Tap to enable'}
                </Text>
              </View>
              {!hasPermission && (
                <Button
                  title="Enable"
                  onPress={handleNotificationPermission}
                  size="small"
                />
              )}
            </View>
          </Card>

          {/* Event Reminders */}
          <Card style={styles.settingsCard}>
            <Text style={[styles.settingsTitle, { color: theme.colors.charcoal }]}>
              Event Reminders
            </Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.charcoal }]}>
                  Event Reminders
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.gray }]}>
                  Get notified about upcoming events
                </Text>
              </View>
              <Switch
                value={preferences.eventReminders}
                onValueChange={(value) => updatePreferences({ eventReminders: value })}
                trackColor={{ false: theme.colors.grayLight, true: theme.colors.green + '40' }}
                thumbColor={preferences.eventReminders ? theme.colors.green : theme.colors.gray}
              />
            </View>

            {preferences.eventReminders && (
              <>
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingLabel, { color: theme.colors.charcoal }]}>
                      24 Hour Reminder
                    </Text>
                    <Text style={[styles.settingDescription, { color: theme.colors.gray }]}>
                      Remind me 1 day before events
                    </Text>
                  </View>
                  <Switch
                    value={preferences.eventReminder24h}
                    onValueChange={(value) => updatePreferences({ eventReminder24h: value })}
                    trackColor={{ false: theme.colors.grayLight, true: theme.colors.green + '40' }}
                    thumbColor={preferences.eventReminder24h ? theme.colors.green : theme.colors.gray}
                  />
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingLabel, { color: theme.colors.charcoal }]}>
                      1 Hour Reminder
                    </Text>
                    <Text style={[styles.settingDescription, { color: theme.colors.gray }]}>
                      Remind me 1 hour before events
                    </Text>
                  </View>
                  <Switch
                    value={preferences.eventReminder1h}
                    onValueChange={(value) => updatePreferences({ eventReminder1h: value })}
                    trackColor={{ false: theme.colors.grayLight, true: theme.colors.green + '40' }}
                    thumbColor={preferences.eventReminder1h ? theme.colors.green : theme.colors.gray}
                  />
                </View>
              </>
            )}
          </Card>

          {/* Task Reminders */}
          <Card style={styles.settingsCard}>
            <Text style={[styles.settingsTitle, { color: theme.colors.charcoal }]}>
              Task Reminders
            </Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.charcoal }]}>
                  Daily Task Reminders
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.gray }]}>
                  Get reminded about today's tasks
                </Text>
              </View>
              <Switch
                value={preferences.taskReminders}
                onValueChange={(value) => updatePreferences({ taskReminders: value })}
                trackColor={{ false: theme.colors.grayLight, true: theme.colors.green + '40' }}
                thumbColor={preferences.taskReminders ? theme.colors.green : theme.colors.gray}
              />
            </View>

            {preferences.taskReminders && (
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: theme.colors.charcoal }]}>
                    Reminder Time
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.gray }]}>
                    Currently set to {preferences.taskReminderTime}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.timeButton, { borderColor: theme.colors.grayLight }]}
                  onPress={() => {
                    // TODO: Implement time picker
                    Alert.alert('Time Picker', 'Time picker will be implemented');
                  }}
                >
                  <Text style={[styles.timeButtonText, { color: theme.colors.charcoal }]}>
                    {preferences.taskReminderTime}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>

          {/* Other Notifications */}
          <Card style={styles.settingsCard}>
            <Text style={[styles.settingsTitle, { color: theme.colors.charcoal }]}>
              Other Notifications
            </Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.charcoal }]}>
                  Announcements
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.gray }]}>
                  Important community announcements
                </Text>
              </View>
              <Switch
                value={preferences.announcementNotifications}
                onValueChange={(value) => updatePreferences({ announcementNotifications: value })}
                trackColor={{ false: theme.colors.grayLight, true: theme.colors.green + '40' }}
                thumbColor={preferences.announcementNotifications ? theme.colors.green : theme.colors.gray}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.charcoal }]}>
                  Community Activity
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.gray }]}>
                  Reactions, comments, and mentions
                </Text>
              </View>
              <Switch
                value={preferences.communityNotifications}
                onValueChange={(value) => updatePreferences({ communityNotifications: value })}
                trackColor={{ false: theme.colors.grayLight, true: theme.colors.green + '40' }}
                thumbColor={preferences.communityNotifications ? theme.colors.green : theme.colors.gray}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.charcoal }]}>
                  Sound
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.gray }]}>
                  Play sound with notifications
                </Text>
              </View>
              <Switch
                value={preferences.sound}
                onValueChange={(value) => updatePreferences({ sound: value })}
                trackColor={{ false: theme.colors.grayLight, true: theme.colors.green + '40' }}
                thumbColor={preferences.sound ? theme.colors.green : theme.colors.gray}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.charcoal }]}>
                  Vibration
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.gray }]}>
                  Vibrate device for notifications
                </Text>
              </View>
              <Switch
                value={preferences.vibration}
                onValueChange={(value) => updatePreferences({ vibration: value })}
                trackColor={{ false: theme.colors.grayLight, true: theme.colors.green + '40' }}
                thumbColor={preferences.vibration ? theme.colors.green : theme.colors.gray}
              />
            </View>
          </Card>
        </ScrollView>
      </View>
    );
  };

  if (showNotificationSettings) {
    return (
      <SafeAreaView style={styles.container}>
        {renderNotificationSettings()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.charcoal }]}>
            More
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.gray }]}>
            Settings and account
          </Text>
        </View>

        {/* Profile Section */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.colors.charcoal }]}>
                {user?.full_name || 'Growing Together Member'}
              </Text>
              <Text style={[styles.profileEmail, { color: theme.colors.gray }]}>
                {user?.email}
              </Text>
              <Text style={[styles.profileRole, { color: theme.colors.green }]}>
                {user?.role || 'Member'} • Plot {user?.plot_number || 'N/A'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Settings Sections */}
        <View style={styles.settingsContainer}>
          <ListItem
            icon={<Ionicons name="notifications" size={24} color={theme.colors.sky} />}
            title="Notifications"
            subtitle="Manage reminders and alerts"
            onPress={() => setShowNotificationSettings(true)}
            showChevron
          />

          <ListItem
            icon={<Ionicons name="person" size={24} color={theme.colors.green} />}
            title="Profile"
            subtitle="Edit your profile information"
            onPress={() => Alert.alert('Profile', 'Profile editing coming soon')}
            showChevron
          />

          <ListItem
            icon={<Ionicons name="shield-checkmark" size={24} color={theme.colors.warning} />}
            title="Privacy & Security"
            subtitle="Control your privacy settings"
            onPress={() => Alert.alert('Privacy', 'Privacy settings coming soon')}
            showChevron
          />

          <ListItem
            icon={<Ionicons name="help-circle" size={24} color={theme.colors.info} />}
            title="Help & Support"
            subtitle="Get help and contact support"
            onPress={() => Alert.alert('Help', 'Help center coming soon')}
            showChevron
          />

          <ListItem
            icon={<Ionicons name="information-circle" size={24} color={theme.colors.gray} />}
            title="About"
            subtitle="App version and information"
            onPress={() => Alert.alert('About', 'Growing Together v1.0.0\n\nBuilt with love for allotment communities.')}
            showChevron
          />

          <ListItem
            icon={<Ionicons name="log-out" size={24} color={theme.colors.error} />}
            title="Sign Out"
            subtitle="Sign out of your account"
            onPress={handleSignOut}
            showChevron={false}
            style={{ marginTop: 20 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  profileCard: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingsContainer: {
    paddingHorizontal: 16,
  },
  // Notification Settings Styles
  settingsSection: {
    flex: 1,
  },
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 16,
  },
  backHeaderTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  settingsContent: {
    flex: 1,
    padding: 16,
  },
  permissionCard: {
    marginBottom: 16,
  },
  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  permissionText: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  permissionSubtitle: {
    fontSize: 14,
  },
  settingsCard: {
    marginBottom: 16,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  timeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});