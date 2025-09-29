import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// Conditional import for web compatibility
let ImagePicker: any;

if (typeof window === 'undefined') {
  // Native platform
  ImagePicker = require('expo-image-picker');
} else {
  // Web platform - use mocks
  ImagePicker = {
    MediaTypeOptions: { Images: 'Images' },
    requestMediaLibraryPermissionsAsync: async () => ({ status: 'granted' }),
    requestCameraPermissionsAsync: async () => ({ status: 'granted' }),
    launchImageLibraryAsync: async () => ({ canceled: true }),
    launchCameraAsync: async () => ({ canceled: true }),
  };
}
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, FormField, useTheme } from '../design';
import { useCreateAlbum } from '../hooks/useGallery';
import { Database } from '../lib/database.types';

type Album = Database['public']['Tables']['albums']['Row'];

const albumSchema = z.object({
  name: z.string().min(1, 'Album name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  is_private: z.boolean(),
});

type AlbumFormData = z.infer<typeof albumSchema>;

interface CreateAlbumModalProps {
  visible: boolean;
  onClose: () => void;
  album?: Album;
}

export function CreateAlbumModal({ visible, onClose, album }: CreateAlbumModalProps) {
  const theme = useTheme();
  const [coverPhoto, setCoverPhoto] = useState<string | null>(album?.cover_photo || null);

  const createMutation = useCreateAlbum();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<AlbumFormData>({
    resolver: zodResolver(albumSchema),
    defaultValues: {
      name: album?.name || '',
      description: album?.description || '',
      is_private: album?.is_private || false,
    },
  });

  const watchIsPrivate = watch('is_private');

  const handleClose = () => {
    reset();
    setCoverPhoto(null);
    onClose();
  };

  const onSubmit = async (data: AlbumFormData) => {
    try {
      const albumData = {
        ...data,
        cover_photo: coverPhoto,
      };

      await createMutation.mutateAsync(albumData);
      handleClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to create album');
    }
  };

  const pickCoverPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setCoverPhoto(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick cover photo');
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
            {album ? 'Edit Album' : 'Create Album'}
          </Text>
          <Button
            title="Save"
            onPress={handleSubmit(onSubmit)}
            loading={createMutation.isPending}
            size="small"
          />
        </View>

        <ScrollView style={styles.content}>
          {/* Cover Photo */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.charcoal }]}>
              Cover Photo
            </Text>
            <TouchableOpacity
              style={[styles.coverPhotoButton, { borderColor: theme.colors.grayLight }]}
              onPress={pickCoverPhoto}
            >
              {coverPhoto ? (
                <Image source={{ uri: coverPhoto }} style={styles.coverPhotoPreview} />
              ) : (
                <View style={styles.coverPhotoPlaceholder}>
                  <Ionicons name="image" size={48} color={theme.colors.gray} />
                  <Text style={[styles.coverPhotoText, { color: theme.colors.gray }]}>
                    Choose Cover Photo
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Album Details */}
          <View style={styles.section}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <FormField
                  label="Album Name"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Summer Harvest 2024"
                  error={errors.name?.message}
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
                    placeholder="Tell us about this album..."
                    placeholderTextColor={theme.colors.gray}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    maxLength={500}
                  />
                </View>
              )}
            />
          </View>

          {/* Privacy Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.charcoal }]}>
              Privacy Settings
            </Text>
            
            <Controller
              control={control}
              name="is_private"
              render={({ field: { onChange, value } }) => (
                <View>
                  <TouchableOpacity
                    style={[
                      styles.privacyOption,
                      {
                        backgroundColor: !value ? theme.colors.green + '20' : theme.colors.grayLight,
                        borderColor: !value ? theme.colors.green : theme.colors.grayLight,
                      }
                    ]}
                    onPress={() => onChange(false)}
                  >
                    <View style={styles.privacyOptionContent}>
                      <Ionicons 
                        name="people" 
                        size={24} 
                        color={!value ? theme.colors.green : theme.colors.gray} 
                      />
                      <View style={styles.privacyOptionText}>
                        <Text 
                          style={[
                            styles.privacyOptionTitle,
                            { color: !value ? theme.colors.green : theme.colors.charcoal }
                          ]}
                        >
                          Public Album
                        </Text>
                        <Text style={[styles.privacyOptionDesc, { color: theme.colors.gray }]}>
                          All community members can view this album
                        </Text>
                      </View>
                    </View>
                    {!value && (
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.green} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.privacyOption,
                      {
                        backgroundColor: value ? theme.colors.warning + '20' : theme.colors.grayLight,
                        borderColor: value ? theme.colors.warning : theme.colors.grayLight,
                      }
                    ]}
                    onPress={() => onChange(true)}
                  >
                    <View style={styles.privacyOptionContent}>
                      <Ionicons 
                        name="lock-closed" 
                        size={24} 
                        color={value ? theme.colors.warning : theme.colors.gray} 
                      />
                      <View style={styles.privacyOptionText}>
                        <Text 
                          style={[
                            styles.privacyOptionTitle,
                            { color: value ? theme.colors.warning : theme.colors.charcoal }
                          ]}
                        >
                          Private Album
                        </Text>
                        <Text style={[styles.privacyOptionDesc, { color: theme.colors.gray }]}>
                          Only you can view this album
                        </Text>
                      </View>
                    </View>
                    {value && (
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.warning} />
                    )}
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>

          {/* Album Guidelines */}
          <View style={[styles.guidelines, { backgroundColor: theme.colors.greenBg }]}>
            <View style={styles.guidelineHeader}>
              <Ionicons name="information-circle" size={20} color={theme.colors.green} />
              <Text style={[styles.guidelinesTitle, { color: theme.colors.green }]}>
                Album Guidelines
              </Text>
            </View>
            <Text style={[styles.guidelinesText, { color: theme.colors.charcoal }]}>
              • Share photos related to gardening and allotment life{'\n'}
              • Include captions to help others learn from your experiences{'\n'}
              • Respect others' privacy when taking photos of their plots{'\n'}
              • Use descriptive album names to help others find relevant content{'\n'}
              • Consider making educational albums public to benefit the community
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
  coverPhotoButton: {
    height: 200,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    overflow: 'hidden',
  },
  coverPhotoPreview: {
    width: '100%',
    height: '100%',
  },
  coverPhotoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  coverPhotoText: {
    fontSize: 16,
    fontWeight: '500',
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
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 2,
    borderRadius: 12,
    marginBottom: 8,
  },
  privacyOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  privacyOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  privacyOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  privacyOptionDesc: {
    fontSize: 14,
  },
  guidelines: {
    padding: 16,
    borderRadius: 12,
  },
  guidelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  guidelinesText: {
    fontSize: 14,
    lineHeight: 20,
  },
});