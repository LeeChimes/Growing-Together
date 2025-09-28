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
import { useAuthStore } from '../src/store/authStore';

export default function MoreScreen() {
  const theme = useTheme();
  const { user, signOut } = useAuthStore();
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    position: 'absolute',
    top: 45,
    left: 16,
  },
  globalAiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  globalAiButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filtersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterSection: {
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
  seasonalCard: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  seasonalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  seasonalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  seasonalPlant: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 100,
  },
  seasonalPlantName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  plantCard: {
    marginBottom: 12,
  },
  card: {
    // Card styling handled by Card component
  },
  plantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  plantInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  scientificName: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  aiButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  plantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  sunRequirement: {
    marginLeft: 'auto',
  },
  plantDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  sowingHarvest: {
    gap: 4,
  },
  monthsContainer: {
    flexDirection: 'row',
  },
  monthsLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Detail view styles
  detailContainer: {
    flex: 1,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 16,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
  },
  detailCard: {
    margin: 16,
  },
  detailMeta: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  detailDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  companionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});