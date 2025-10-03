import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { 
  Card, 
  Button,
  useTheme,
  ListItem,
  Avatar,
} from '../src/design';
// Conditional import for web compatibility (image picker)
let ImagePicker: any;
if (typeof window === 'undefined') {
  ImagePicker = require('expo-image-picker');
} else {
  ImagePicker = {
    MediaTypeOptions: { Images: 'Images' },
    requestMediaLibraryPermissionsAsync: async () => ({ status: 'granted' }),
    launchImageLibraryAsync: async () => ({ canceled: true }),
  };
}
import { supabase } from '../src/lib/supabase';
import { useNotificationPreferences, useNotificationPermissions } from '../src/hooks/useNotifications';
import { useAccessibilitySettings, useUserProfile, useUpdateProfile } from '../src/hooks/useSettings';
import { useAuthStore } from '../src/store/authStore';
import { AdminDashboard } from '../src/components/AdminDashboard';
import { QADashboard } from '../src/components/QADashboard';
import { DevOfflineHarness } from '../src/components/DevOfflineHarness';

export default function MoreScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, profile, signOut, refreshProfile } = useAuthStore();
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showAccessibilitySettings, setShowAccessibilitySettings] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showQADashboard, setShowQADashboard] = useState(false);
  const [showDevOffline, setShowDevOffline] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
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

  const {
    settings: accessibilitySettings,
    updateSettings: updateAccessibilitySettings,
  } = useAccessibilitySettings();

  const { data: userProfile } = useUserProfile();
  const updateProfileMutation = useUpdateProfile();
  const [editProfile, setEditProfile] = useState({
    full_name: userProfile?.full_name || profile?.full_name || '',
    plot_number: userProfile?.plot_number || profile?.plot_number || '',
    phone: userProfile?.phone || '',
    emergency_contact: userProfile?.emergency_contact || '',
  });
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [generatedAvatars, setGeneratedAvatars] = useState<string[]>([]);
  const [avatarIndex, setAvatarIndex] = useState<number>(-1); // -1 = no preview

  const applyLocalProfile = (partial: any) => {
    const current = useAuthStore.getState().profile as any;
    useAuthStore.setState({ profile: { ...current, ...partial } as any });
  };

  const handleUploadAvatarFromPicker = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync?.();
      if (perm && perm.status !== 'granted') {
        Alert.alert('Permission required', 'Please allow photo library access to choose an avatar.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: false,
      });
      if (result.canceled || !result.assets?.length) {
        Alert.alert('No photo selected', 'You can also paste an image URL below on web.');
        return;
      }
      const uri = result.assets[0].uri;
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `avatars/${user!.id}-${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('photos').getPublicUrl(uploadData.path);
      // Optimistic update and immediate navigate to Home
      applyLocalProfile({ avatar_url: urlData.publicUrl });
      setShowProfile(false);
      router.push('/home');
      updateProfileMutation.mutate({ avatar_url: urlData.publicUrl });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update avatar');
    }
  };

  const handleSaveAll = async () => {
    try {
      // Build payload from form + avatar selection priorities:
      // 1) If a URL is typed, use it
      // 2) Else if a generated preview is selected, use it
      // 3) Else leave avatar unchanged
      const urlFromInput = avatarUrlInput.trim();
      const previewUrl = avatarIndex >= 0 ? generatedAvatars[avatarIndex] : undefined;
      const payload: any = { ...editProfile };
      if (urlFromInput) payload.avatar_url = urlFromInput;
      else if (previewUrl) payload.avatar_url = previewUrl;

      // Optimistic local update and navigate immediately
      applyLocalProfile(payload);
      setAvatarUrlInput('');
      setShowProfile(false);
      router.push('/home');
      updateProfileMutation.mutate(payload);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update profile');
    }
  };

  const handleGenerateAvatar = async () => {
    // Generate a new random avatar preview and append to history
    const seed = Math.random().toString(36).slice(2);
    const styles = ['fun-emoji', 'adventurer', 'bottts', 'lorelei', 'thumbs'];
    const style = styles[Math.floor(Math.random() * styles.length)];
    const url = `https://api.dicebear.com/7.x/${style}/png?size=128&seed=${seed}`;
    setGeneratedAvatars((prev) => {
      const next = prev.slice(0, avatarIndex + 1).concat([url]);
      setAvatarIndex(next.length - 1);
      return next;
    });
  };

  const handleRemoveAvatar = async () => {
    try {
      await updateProfileMutation.mutateAsync({ avatar_url: null as any });
      applyLocalProfile({ avatar_url: null });
      Alert.alert('Avatar removed', 'Reverting to initials.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to remove avatar');
    }
  };

  const handleSaveCurrentPreview = async () => {
    const url = avatarIndex >= 0 ? generatedAvatars[avatarIndex] : '';
    if (!url) {
      Alert.alert('No selection', 'Generate an avatar first or paste an image URL.');
      return;
    }
    try {
      // Optimistic update and immediate navigate to Home
      applyLocalProfile({ avatar_url: url });
      setShowProfile(false);
      router.push('/home');
      updateProfileMutation.mutate({ avatar_url: url });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update avatar');
    }
  };

  const handlePrevPreview = () => {
    if (avatarIndex > 0) setAvatarIndex(avatarIndex - 1);
  };

  const handleNextPreview = () => {
    if (avatarIndex < generatedAvatars.length - 1) setAvatarIndex(avatarIndex + 1);
  };

  const handleClearPreview = () => {
    setAvatarIndex(-1);
    setGeneratedAvatars([]);
  };

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

  const renderAccessibilitySettings = () => {
    if (!showAccessibilitySettings) return null;

    return (
      <View style={styles.settingsSection}>
        <TouchableOpacity
          style={styles.backHeader}
          onPress={() => setShowAccessibilitySettings(false)}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.charcoal} />
          <Text style={[styles.backHeaderTitle, { color: theme.colors.charcoal }]}>
            Accessibility Settings
          </Text>
        </TouchableOpacity>

        <ScrollView style={styles.settingsContent}>
          {/* Theme Settings */}
          <Card style={styles.settingsCard}>
            <Text style={[styles.settingsTitle, { color: theme.colors.charcoal }]}>
              Appearance
            </Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.charcoal }]}>
                  Theme
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.gray }]}>
                  Currently: {accessibilitySettings.theme}
                </Text>
              </View>
              <View style={styles.themeButtons}>
                {['light', 'dark', 'system'].map((themeOption) => (
                  <TouchableOpacity
                    key={themeOption}
                    style={[
                      styles.themeButton,
                      {
                        backgroundColor: accessibilitySettings.theme === themeOption 
                          ? theme.colors.green + '20' 
                          : theme.colors.grayLight,
                        borderColor: accessibilitySettings.theme === themeOption 
                          ? theme.colors.green 
                          : theme.colors.grayLight,
                      }
                    ]}
                    onPress={() => updateAccessibilitySettings({ theme: themeOption as any })}
                  >
                    <Text style={[
                      styles.themeButtonText,
                      { color: accessibilitySettings.theme === themeOption ? theme.colors.green : theme.colors.gray }
                    ]}>
                      {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.charcoal }]}>
                  High Contrast
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.gray }]}>
                  Increase contrast for better visibility
                </Text>
              </View>
              <Switch
                value={accessibilitySettings.highContrast}
                onValueChange={(value) => updateAccessibilitySettings({ highContrast: value })}
                trackColor={{ false: theme.colors.grayLight, true: theme.colors.green + '40' }}
                thumbColor={accessibilitySettings.highContrast ? theme.colors.green : theme.colors.gray}
              />
            </View>
          </Card>

          {/* Text Settings */}
          <Card style={styles.settingsCard}>
            <Text style={[styles.settingsTitle, { color: theme.colors.charcoal }]}>
              Text & Reading
            </Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.charcoal }]}>
                  Text Size
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.gray }]}>
                  Currently: {accessibilitySettings.fontSize}
                </Text>
              </View>
              <View style={styles.fontSizeButtons}>
                {['small', 'normal', 'large', 'extra-large'].map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.fontSizeButton,
                      {
                        backgroundColor: accessibilitySettings.fontSize === size 
                          ? theme.colors.green + '20' 
                          : theme.colors.grayLight,
                        borderColor: accessibilitySettings.fontSize === size 
                          ? theme.colors.green 
                          : theme.colors.grayLight,
                      }
                    ]}
                    onPress={() => updateAccessibilitySettings({ fontSize: size as any })}
                  >
                    <Text style={[
                      styles.fontSizeButtonText,
                      { 
                        color: accessibilitySettings.fontSize === size ? theme.colors.green : theme.colors.gray,
                        fontSize: size === 'small' ? 12 : size === 'large' ? 18 : size === 'extra-large' ? 20 : 14,
                      }
                    ]}>
                      Aa
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>

          {/* Motion Settings */}
          <Card style={styles.settingsCard}>
            <Text style={[styles.settingsTitle, { color: theme.colors.charcoal }]}>
              Motion & Animation
            </Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.charcoal }]}>
                  Reduce Motion
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.gray }]}>
                  Minimize animations and transitions
                </Text>
              </View>
              <Switch
                value={accessibilitySettings.reduceMotion}
                onValueChange={(value) => updateAccessibilitySettings({ reduceMotion: value })}
                trackColor={{ false: theme.colors.grayLight, true: theme.colors.green + '40' }}
                thumbColor={accessibilitySettings.reduceMotion ? theme.colors.green : theme.colors.gray}
              />
            </View>
          </Card>
        </ScrollView>
      </View>
    );
  };

  const renderNotificationSettings = () => {
    if (!showNotificationSettings) return null;

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
                value={preferences?.eventReminders ?? false}
                onValueChange={(value) => updatePreferences({ eventReminders: value })}
                trackColor={{ false: theme.colors.grayLight, true: theme.colors.green + '40' }}
                thumbColor={(preferences?.eventReminders ?? false) ? theme.colors.green : theme.colors.gray}
              />
            </View>

            {preferences?.eventReminders && (
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
                    value={preferences?.eventReminder24h ?? false}
                    onValueChange={(value) => updatePreferences({ eventReminder24h: value })}
                    trackColor={{ false: theme.colors.grayLight, true: theme.colors.green + '40' }}
                    thumbColor={(preferences?.eventReminder24h ?? false) ? theme.colors.green : theme.colors.gray}
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
                    value={preferences?.eventReminder1h ?? false}
                    onValueChange={(value) => updatePreferences({ eventReminder1h: value })}
                    trackColor={{ false: theme.colors.grayLight, true: theme.colors.green + '40' }}
                    thumbColor={(preferences?.eventReminder1h ?? false) ? theme.colors.green : theme.colors.gray}
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
                value={preferences?.taskReminders ?? false}
                onValueChange={(value) => updatePreferences({ taskReminders: value })}
                trackColor={{ false: theme.colors.grayLight, true: theme.colors.green + '40' }}
                thumbColor={(preferences?.taskReminders ?? false) ? theme.colors.green : theme.colors.gray}
              />
            </View>

            {preferences?.taskReminders && (
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: theme.colors.charcoal }]}>
                    Reminder Time
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.gray }]}>
                    Currently set to {preferences?.taskReminderTime ?? '09:00'}
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
                    {preferences?.taskReminderTime ?? '09:00'}
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
                value={preferences?.announcementNotifications ?? false}
                onValueChange={(value) => updatePreferences({ announcementNotifications: value })}
                trackColor={{ false: theme.colors.grayLight, true: theme.colors.green + '40' }}
                thumbColor={(preferences?.announcementNotifications ?? false) ? theme.colors.green : theme.colors.gray}
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
                value={preferences?.communityNotifications ?? false}
                onValueChange={(value) => updatePreferences({ communityNotifications: value })}
                trackColor={{ false: theme.colors.grayLight, true: theme.colors.green + '40' }}
                thumbColor={(preferences?.communityNotifications ?? false) ? theme.colors.green : theme.colors.gray}
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
                value={preferences?.sound ?? true}
                onValueChange={(value) => updatePreferences({ sound: value })}
                trackColor={{ false: theme.colors.grayLight, true: theme.colors.green + '40' }}
                thumbColor={(preferences?.sound ?? true) ? theme.colors.green : theme.colors.gray}
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
                value={preferences?.vibration ?? true}
                onValueChange={(value) => updatePreferences({ vibration: value })}
                trackColor={{ false: theme.colors.grayLight, true: theme.colors.green + '40' }}
                thumbColor={(preferences?.vibration ?? true) ? theme.colors.green : theme.colors.gray}
              />
            </View>
          </Card>
        </ScrollView>
      </View>
    );
  };

  const renderProfile = () => {
    if (!showProfile) return null;
    return (
      <View style={styles.settingsSection}>
        <TouchableOpacity style={styles.backHeader} onPress={() => setShowProfile(false)}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.charcoal} />
          <Text style={[styles.backHeaderTitle, { color: theme.colors.charcoal }]}>Profile</Text>
        </TouchableOpacity>
        <ScrollView style={styles.settingsContent}>
          <Card style={styles.settingsCard}>
            <Text style={[styles.settingsTitle, { color: theme.colors.charcoal }]}>Account Details</Text>
            <View style={{ gap: 12 }}>
              {/* Avatar Builder */}
              <View style={{ alignItems: 'center', marginBottom: 8 }}>
                <Avatar
                  name={editProfile.full_name || profile?.full_name || user?.email || 'User'}
                  imageUri={(avatarIndex >= 0 ? generatedAvatars[avatarIndex] : ((userProfile as any)?.avatar_url || profile?.avatar_url)) as any}
                  size="large"
                />
                <Text style={{ color: theme.colors.gray, fontSize: 12, marginTop: 6 }}>Tap a method below to change your avatar</Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                <Button title="Upload Photo" onPress={handleUploadAvatarFromPicker} variant="secondary" />
                <Button title="Generate New" onPress={handleGenerateAvatar} variant="secondary" />
                <Button title="Prev" onPress={handlePrevPreview} variant="outline" />
                <Button title="Next" onPress={handleNextPreview} variant="outline" />
                <Button title="Clear" onPress={handleClearPreview} variant="ghost" />
                <Button title="Remove Avatar" onPress={handleRemoveAvatar} variant="outline" />
              </View>
              <View>
                <Text style={{ color: theme.colors.charcoal, marginTop: 8, marginBottom: 6 }}>Or paste image URL</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    value={avatarUrlInput}
                    onChangeText={setAvatarUrlInput}
                    placeholder="https://example.com/me.jpg"
                    placeholderTextColor={theme.colors.gray}
                    style={{ flex: 1, borderWidth: 1, borderColor: theme.colors.grayLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: theme.colors.charcoal }}
                  />
                  <Button title="Save" onPress={handleSaveAll} variant="primary" />
                </View>
              </View>

              {/* Role and Email (read-only for now, show for context) */}
              <View>
                <Text style={{ color: theme.colors.charcoal, marginBottom: 6 }}>Email (read-only)</Text>
                <TextInput
                  value={profile?.email || user?.email || ''}
                  editable={false}
                  placeholderTextColor={theme.colors.gray}
                  style={{ borderWidth: 1, borderColor: theme.colors.grayLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: theme.colors.gray }}
                />
              </View>
              <View>
                <Text style={{ color: theme.colors.charcoal, marginBottom: 6 }}>Role</Text>
                <TextInput
                  value={profile?.role || 'member'}
                  editable={false}
                  placeholderTextColor={theme.colors.gray}
                  style={{ borderWidth: 1, borderColor: theme.colors.grayLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: theme.colors.gray }}
                />
              </View>
              <View>
                <Text style={{ color: theme.colors.charcoal, marginBottom: 6 }}>Full Name</Text>
                <TextInput
                  value={editProfile.full_name}
                  onChangeText={(t) => setEditProfile((p) => ({ ...p, full_name: t }))}
                  placeholder="Your full name"
                  placeholderTextColor={theme.colors.gray}
                  style={{ borderWidth: 1, borderColor: theme.colors.grayLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: theme.colors.charcoal }}
                />
              </View>
              <View>
                <Text style={{ color: theme.colors.charcoal, marginBottom: 6 }}>Plot Number</Text>
                <TextInput
                  value={editProfile.plot_number || ''}
                  onChangeText={(t) => setEditProfile((p) => ({ ...p, plot_number: t }))}
                  placeholder="e.g., A12"
                  placeholderTextColor={theme.colors.gray}
                  style={{ borderWidth: 1, borderColor: theme.colors.grayLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: theme.colors.charcoal }}
                />
              </View>
              <View>
                <Text style={{ color: theme.colors.charcoal, marginBottom: 6 }}>Phone</Text>
                <TextInput
                  value={editProfile.phone}
                  onChangeText={(t) => setEditProfile((p) => ({ ...p, phone: t }))}
                  placeholder="Mobile number"
                  placeholderTextColor={theme.colors.gray}
                  keyboardType="phone-pad"
                  style={{ borderWidth: 1, borderColor: theme.colors.grayLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: theme.colors.charcoal }}
                />
              </View>
              <View>
                <Text style={{ color: theme.colors.charcoal, marginBottom: 6 }}>Emergency Contact</Text>
                <TextInput
                  value={editProfile.emergency_contact}
                  onChangeText={(t) => setEditProfile((p) => ({ ...p, emergency_contact: t }))}
                  placeholder="Name and phone"
                  placeholderTextColor={theme.colors.gray}
                  style={{ borderWidth: 1, borderColor: theme.colors.grayLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: theme.colors.charcoal }}
                />
              </View>
              <Button
                title={updateProfileMutation.isPending ? 'Saving…' : 'Save Changes'}
                onPress={handleSaveAll}
              />
            </View>
          </Card>
        </ScrollView>
      </View>
    );
  };

  const renderPrivacy = () => {
    if (!showPrivacy) return null;
    return (
      <View style={styles.settingsSection}>
        <TouchableOpacity style={styles.backHeader} onPress={() => setShowPrivacy(false)}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.charcoal} />
          <Text style={[styles.backHeaderTitle, { color: theme.colors.charcoal }]}>Privacy & Security</Text>
        </TouchableOpacity>
        <ScrollView style={styles.settingsContent}>
          <Card style={styles.settingsCard}>
            <Text style={[styles.settingsTitle, { color: theme.colors.charcoal }]}>Privacy</Text>
            <Text style={{ color: theme.colors.gray }}>Privacy controls will be available here.</Text>
          </Card>
        </ScrollView>
      </View>
    );
  };

  const renderHelp = () => {
    if (!showHelp) return null;
    return (
      <View style={styles.settingsSection}>
        <TouchableOpacity style={styles.backHeader} onPress={() => setShowHelp(false)}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.charcoal} />
          <Text style={[styles.backHeaderTitle, { color: theme.colors.charcoal }]}>Help & Support</Text>
        </TouchableOpacity>
        <ScrollView style={styles.settingsContent}>
          <Card style={styles.settingsCard}>
            <Text style={[styles.settingsTitle, { color: theme.colors.charcoal }]}>Support</Text>
            <Text style={{ color: theme.colors.gray }}>Help content will be available here.</Text>
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

  if (showAccessibilitySettings) {
    return (
      <SafeAreaView style={styles.container}>
        {renderAccessibilitySettings()}
      </SafeAreaView>
    );
  }

  if (showProfile) {
    return (
      <SafeAreaView style={styles.container}>
        {renderProfile()}
      </SafeAreaView>
    );
  }

  if (showPrivacy) {
    return (
      <SafeAreaView style={styles.container}>
        {renderPrivacy()}
      </SafeAreaView>
    );
  }

  if (showHelp) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHelp()}
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
                {profile?.full_name || 'Growing Together Member'}
              </Text>
              <Text style={[styles.profileEmail, { color: theme.colors.gray }]}>
                {profile?.email || user?.email}
              </Text>
              <Text style={[styles.profileRole, { color: theme.colors.green }]}>
                {profile?.role || 'member'} • Plot {profile?.plot_number || 'N/A'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Settings Sections */}
        <View style={styles.settingsContainer}>
          {/* Plot Inspections - Only show for admin users */}
          {user?.role === 'admin' && (
            <ListItem
              icon={<Ionicons name="clipboard" size={24} color={theme.colors.warning} />}
              title="Plot Inspections"
              subtitle="Manage plot inspections and assessments"
              onPress={() => router.push('/inspections')}
              showChevron
              style={{ marginBottom: 8, backgroundColor: theme.colors.warning + '10' }}
            />
          )}

          {/* Rules for all users */}
          <ListItem
            icon={<Ionicons name="document-text" size={24} color={theme.colors.info} />}
            title="Community Rules"
            subtitle="View and acknowledge community rules"
            onPress={() => router.push('/rules')}
            showChevron
            style={{ marginBottom: 8 }}
          />

          {/* My Documents for all users */}
          <ListItem
            icon={<Ionicons name="folder" size={24} color={theme.colors.success} />}
            title="My Documents"
            subtitle="Upload and manage your documents"
            onPress={() => router.push('/documents')}
            showChevron
            style={{ marginBottom: 16 }}
          />

          {/* Admin Dashboard - Only show for admin users */}
          {user?.role === 'admin' && (
            <ListItem
              icon={<Ionicons name="shield-checkmark" size={24} color={theme.colors.error} />}
              title="Admin Dashboard"
              subtitle="Manage members, join codes, and content"
              onPress={() => setShowAdminDashboard(true)}
              showChevron
              style={{ marginBottom: 16, backgroundColor: theme.colors.error + '10' }}
            />
          )}

          <ListItem
            icon={<Ionicons name="notifications" size={24} color={theme.colors.sky} />}
            title="Notifications"
            subtitle="Manage reminders and alerts"
            onPress={() => setShowNotificationSettings(true)}
            showChevron
          />

          <ListItem
            icon={<Ionicons name="accessibility" size={24} color={theme.colors.success} />}
            title="Accessibility"
            subtitle="Theme, text size, and display options"
            onPress={() => setShowAccessibilitySettings(true)}
            showChevron
          />

          <ListItem
            icon={<Ionicons name="person" size={24} color={theme.colors.green} />}
            title="Profile"
            subtitle="Edit your profile information"
            onPress={() => setShowProfile(true)}
            showChevron
          />

          <ListItem
            icon={<Ionicons name="shield-checkmark" size={24} color={theme.colors.warning} />}
            title="Privacy & Security"
            subtitle="Control your privacy settings"
            onPress={() => setShowPrivacy(true)}
            showChevron
          />

          <ListItem
            icon={<Ionicons name="help-circle" size={24} color={theme.colors.info} />}
            title="Help & Support"
            subtitle="Get help and contact support"
            onPress={() => setShowHelp(true)}
            showChevron
          />

          <ListItem
            icon={<Ionicons name="information-circle" size={24} color={theme.colors.gray} />}
            title="About"
            subtitle="App version and information"
            onPress={() => Alert.alert('About', 'Growing Together v1.0.0\n\nBuilt with love for allotment communities.')}
            showChevron
          />

          {/* QA Dashboard - Only show in development or for admin users */}
          {(__DEV__ || user?.role === 'admin') && (
            <ListItem
              icon={<Ionicons name="bug" size={24} color={theme.colors.warning} />}
              title="QA Dashboard"
              subtitle="Testing, performance, and quality assurance"
              onPress={() => setShowQADashboard(true)}
              showChevron
              style={{ marginTop: 16, backgroundColor: theme.colors.warning + '10' }}
            />
          )}

          {(__DEV__ || user?.role === 'admin') && (
            <ListItem
              icon={<Ionicons name="cloud-offline" size={24} color={theme.colors.info} />}
              title="Offline Dev Harness"
              subtitle="Enqueue and process offline mutations"
              onPress={() => setShowDevOffline(true)}
              showChevron
              style={{ marginTop: 8, backgroundColor: theme.colors.info + '10' }}
            />
          )}

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

      {/* Admin Dashboard Modal */}
      <AdminDashboard
        visible={showAdminDashboard}
        onClose={() => setShowAdminDashboard(false)}
      />

      {/* QA Dashboard Modal */}
      <QADashboard
        visible={showQADashboard}
        onClose={() => setShowQADashboard(false)}
      />

      <DevOfflineHarness
        visible={showDevOffline}
        onClose={() => setShowDevOffline(false)}
      />
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
  // Accessibility Settings Styles
  themeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  themeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  fontSizeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  fontSizeButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontSizeButtonText: {
    fontWeight: '600',
  },
});