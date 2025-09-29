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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ImageCompressionService } from '../lib/imageCompression';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, useTheme } from '../design';
import { useCreatePost } from '../hooks/useCommunity';
import { useAuthStore } from '../store/authStore';
import { Database } from '../lib/database.types';

type Post = Database['public']['Tables']['posts']['Row'];

const postSchema = z.object({
  content: z.string().min(1, 'Content is required').max(2000, 'Content too long'),
});

type PostFormData = z.infer<typeof postSchema>;

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  post?: Post;
}

const postTemplates = [
  {
    id: 'update',
    title: 'Plot Update',
    emoji: '🌱',
    template: 'Quick update from my plot today:\n\n',
  },
  {
    id: 'question',
    title: 'Ask Community',
    emoji: '❓',
    template: 'I need your advice!\n\n',
  },
  {
    id: 'tip',
    title: 'Share Tip',
    emoji: '💡',
    template: 'Here\'s a gardening tip that worked for me:\n\n',
  },
  {
    id: 'harvest',
    title: 'Harvest Share',
    emoji: '🥕',
    template: 'Look what I harvested today! \n\n',
  },
  {
    id: 'problem',
    title: 'Need Help',
    emoji: '🆘',
    template: 'I\'m having trouble with... \n\n',
  },
];

export function CreatePostModal({ visible, onClose, post }: CreatePostModalProps) {
  const theme = useTheme();
  const [photos, setPhotos] = useState<string[]>(post?.photos || []);
  const [characterCount, setCharacterCount] = useState(0);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const { profile } = useAuthStore();

  const createMutation = useCreatePost();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: post?.content || '',
    },
  });

  const watchContent = watch('content');

  React.useEffect(() => {
    setCharacterCount(watchContent?.length || 0);
  }, [watchContent]);

  const handleClose = () => {
    reset();
    setPhotos([]);
    setCharacterCount(0);
    onClose();
  };

  const onSubmit = async (data: PostFormData) => {
    try {
      const postData = {
        ...data,
        photos,
        is_announcement: profile?.role === 'admin' ? isAnnouncement : false,
      } as any;

      await createMutation.mutateAsync(postData);
      handleClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to create post');
    }
  };

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5,
      });

      if (!result.canceled) {
        const newPhotos = result.assets.map(asset => asset.uri);
        const compressed = await ImageCompressionService.compressImages(newPhotos, { maxWidth: 1600, maxHeight: 1600, quality: 0.8 });
        setPhotos(prev => [...prev, ...compressed].slice(0, 5)); // Max 5 photos
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const applyTemplate = (template: string) => {
    setValue('content', template);
  };

  const getCharacterCountColor = () => {
    if (characterCount > 1800) return theme.colors.error;
    if (characterCount > 1500) return theme.colors.warning;
    return theme.colors.gray;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: theme.colors.grayLight }]}>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color={theme.colors.charcoal} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.charcoal }]}>
            {post ? 'Edit Post' : 'Create Post'}
          </Text>
          <Button
            title="Share"
            onPress={handleSubmit(onSubmit)}
            loading={createMutation.isPending}
            disabled={!watchContent?.trim()}
            size="small"
          />
        </View>

        <ScrollView style={styles.content}>
          {/* Post Templates */}
          {!post && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.charcoal }]}>
                Quick Start
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesScroll}>
                {postTemplates.map((template) => (
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

          {/* Content Input */}
          <View style={styles.section}>
            <Controller
              control={control}
              name="content"
              render={({ field: { onChange, value } }) => (
                <View>
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        borderColor: errors.content ? theme.colors.error : theme.colors.grayLight,
                        color: theme.colors.charcoal,
                      }
                    ]}
                    value={value}
                    onChangeText={onChange}
                    placeholder="What's growing in your allotment? Share updates, ask questions, or offer tips to the community..."
                    placeholderTextColor={theme.colors.gray}
                    multiline
                    numberOfLines={8}
                    textAlignVertical="top"
                    maxLength={2000}
                  />
                  
                  <View style={styles.inputFooter}>
                    {errors.content && (
                      <Text style={[styles.error, { color: theme.colors.error }]}>
                        {errors.content.message}
                      </Text>
                    )}
                    <Text style={[styles.characterCount, { color: getCharacterCountColor() }]}>
                      {characterCount}/2000
                    </Text>
                  </View>
                </View>
              )}
            />
          </View>

          {/* Announcement Toggle (Admins only) */}
          {profile?.role === 'admin' && (
            <View style={[styles.section, { flexDirection:'row', alignItems:'center', gap: 8 }]}> 
              <Switch value={isAnnouncement} onValueChange={setIsAnnouncement} />
              <Text style={{ color: theme.colors.charcoal }}>Show as announcement banner on Home</Text>
            </View>
          )}

          {/* Photos */}
          <View style={styles.section}>
            <View style={styles.photoHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.charcoal }]}>
                Photos ({photos.length}/5)
              </Text>
              <TouchableOpacity 
                onPress={pickImages}
                disabled={photos.length >= 5}
                style={[
                  styles.addPhotoButton,
                  { 
                    backgroundColor: photos.length >= 5 ? theme.colors.grayLight : theme.colors.green + '20',
                  }
                ]}
              >
                <Ionicons 
                  name="camera" 
                  size={20} 
                  color={photos.length >= 5 ? theme.colors.gray : theme.colors.green} 
                />
                <Text 
                  style={[
                    styles.addPhotoText, 
                    { color: photos.length >= 5 ? theme.colors.gray : theme.colors.green }
                  ]}
                >
                  Add Photos
                </Text>
              </TouchableOpacity>
            </View>
            
            {photos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                {photos.map((photo, index) => (
                  <View key={index} style={styles.photoContainer}>
                    <Image source={{ uri: photo }} style={styles.photo} />
                    <TouchableOpacity
                      style={[styles.removePhoto, { backgroundColor: theme.colors.error }]}
                      onPress={() => removePhoto(index)}
                    >
                      <Ionicons name="close" size={16} color={theme.colors.paper} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Post Guidelines */}
          <View style={[styles.guidelines, { backgroundColor: theme.colors.greenBg }]}>
            <View style={styles.guidelineHeader}>
              <Ionicons name="information-circle" size={20} color={theme.colors.green} />
              <Text style={[styles.guidelinesTitle, { color: theme.colors.green }]}>
                Community Guidelines
              </Text>
            </View>
            <Text style={[styles.guidelinesText, { color: theme.colors.charcoal }]}>
              • Be respectful and supportive of fellow gardeners{'\n'}
              • Share knowledge and experiences freely{'\n'}
              • Ask questions - everyone was a beginner once!{'\n'}
              • Keep posts relevant to gardening and allotment life{'\n'}
              • Use clear photos when seeking help with plant problems
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
    minWidth: 80,
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
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: 'white',
    minHeight: 200,
    textAlignVertical: 'top',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  error: {
    fontSize: 12,
  },
  characterCount: {
    fontSize: 12,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  photoScroll: {
    marginHorizontal: -4,
  },
  photoContainer: {
    position: 'relative',
    marginHorizontal: 4,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removePhoto: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guidelines: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
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