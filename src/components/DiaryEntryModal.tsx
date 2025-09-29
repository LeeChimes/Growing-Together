import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
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
import { ImageCompressionService } from '../lib/imageCompression';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Card, FormField, Tag, useTheme } from '../design';
import { useCreateDiaryEntry, useUpdateDiaryEntry } from '../hooks/useDiary';
import { Database } from '../lib/database.types';

type DiaryEntry = Database['public']['Tables']['diary_entries']['Row'];
type TemplateType = 'sowing' | 'watering' | 'harvesting' | 'maintenance' | 'general';

const diarySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  template_type: z.enum(['sowing', 'watering', 'harvesting', 'maintenance', 'general']),
  weather: z.string().optional(),
  temperature: z.number().optional(),
});

type DiaryFormData = z.infer<typeof diarySchema>;

interface DiaryEntryModalProps {
  visible: boolean;
  onClose: () => void;
  entry?: DiaryEntry;
  defaultTemplate?: TemplateType;
}

const templates = [
  {
    id: 'sowing' as const,
    name: 'Sowing',
    icon: 'leaf',
    color: '#22c55e',
    prompts: [
      'What did you plant today?',
      'Which variety did you choose?',
      'How deep did you sow the seeds?',
      'What spacing did you use?',
    ],
  },
  {
    id: 'watering' as const,
    name: 'Watering',
    icon: 'water',
    color: '#3b82f6',
    prompts: [
      'Which areas did you water?',
      'How long did you water for?',
      'What was the soil condition?',
      'Any signs of over/under watering?',
    ],
  },
  {
    id: 'harvesting' as const,
    name: 'Harvesting',
    icon: 'basket',
    color: '#f59e0b',
    prompts: [
      'What did you harvest today?',
      'How much did you collect?',
      'Quality of the produce?',
      'Storage plans?',
    ],
  },
  {
    id: 'maintenance' as const,
    name: 'Maintenance',
    icon: 'build',
    color: '#8b5cf6',
    prompts: [
      'What maintenance did you do?',
      'Any repairs needed?',
      'Tools used?',
      'Future maintenance plans?',
    ],
  },
  {
    id: 'general' as const,
    name: 'General',
    icon: 'document-text',
    color: '#6b7280',
    prompts: [
      'What did you observe today?',
      'Any changes since last visit?',
      'Plans for next visit?',
      'Notes for the future?',
    ],
  },
];

export function DiaryEntryModal({ visible, onClose, entry, defaultTemplate }: DiaryEntryModalProps) {
  const theme = useTheme();
  const [photos, setPhotos] = useState<string[]>(entry?.photos || []);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>(
    entry?.template_type || defaultTemplate || 'general'
  );

  const createMutation = useCreateDiaryEntry();
  const updateMutation = useUpdateDiaryEntry();

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<DiaryFormData>({
    resolver: zodResolver(diarySchema),
    defaultValues: {
      title: entry?.title || '',
      content: entry?.content || '',
      template_type: selectedTemplate,
      weather: entry?.weather || '',
      temperature: entry?.temperature || undefined,
    },
  });

  const template = templates.find(t => t.id === selectedTemplate)!;

  const handleClose = () => {
    reset();
    setPhotos([]);
    setSelectedTemplate(defaultTemplate || 'general');
    onClose();
  };

  const onSubmit = async (data: DiaryFormData) => {
    try {
      const entryData = {
        ...data,
        photos,
        template_type: selectedTemplate,
      } as any;

      if (entry) {
        await updateMutation.mutateAsync({ id: entry.id, updates: entryData });
      } else {
        await createMutation.mutateAsync(entryData);
      }

      handleClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save diary entry');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled) {
        const newPhotos = result.assets.map(asset => asset.uri);
        const compressed = await ImageCompressionService.compressImages(newPhotos, { maxWidth: 1600, maxHeight: 1600, quality: 0.8 });
        setPhotos(prev => [...prev, ...compressed]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const insertPrompt = (prompt: string) => {
    const currentContent = watch('content') || '';
    const newContent = currentContent + (currentContent ? '\n\n' : '') + prompt + '\n';
    setValue('content', newContent);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: theme.colors.grayLight }]}>
          <TouchableOpacity onPress={handleClose} accessibilityRole="button" accessibilityLabel="Close diary entry">
            <Ionicons name="close" size={24} color={theme.colors.charcoal} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.charcoal }]}>
            {entry ? 'Edit Entry' : 'New Diary Entry'}
          </Text>
          <Button
            title="Save"
            onPress={handleSubmit(onSubmit)}
            loading={createMutation.isPending || updateMutation.isPending}
            size="small"
          />
        </View>

        <ScrollView style={styles.content}>
          {/* Template Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.charcoal }]}>
              Template
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
              {templates.map((tmpl) => (
                <TouchableOpacity
                  key={tmpl.id}
                  style={[
                    styles.templateButton,
                    {
                      backgroundColor: selectedTemplate === tmpl.id ? tmpl.color + '20' : theme.colors.grayLight,
                      borderColor: selectedTemplate === tmpl.id ? tmpl.color : 'transparent',
                    }
                  ]}
                  onPress={() => {
                    setSelectedTemplate(tmpl.id);
                    setValue('template_type', tmpl.id);
                  }}
                >
                  <Ionicons 
                    name={tmpl.icon as any} 
                    size={20} 
                    color={selectedTemplate === tmpl.id ? tmpl.color : theme.colors.gray} 
                  />
                  <Text 
                    style={[
                      styles.templateName,
                      { color: selectedTemplate === tmpl.id ? tmpl.color : theme.colors.gray }
                    ]}
                  >
                    {tmpl.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, value } }) => (
                <FormField
                  label="Title"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Enter a title for your entry"
                  error={errors.title?.message}
                  required
                />
              )}
            />
          </View>

          {/* Writing Prompts */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.charcoal }]}>
              Writing Prompts
            </Text>
            <View style={styles.prompts}>
              {template.prompts.map((prompt, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.prompt, { borderColor: theme.colors.grayLight }]}
                  onPress={() => insertPrompt(prompt)}
                >
                  <Text style={[styles.promptText, { color: theme.colors.charcoal }]}>
                    {prompt}
                  </Text>
                  <Ionicons name="add" size={16} color={theme.colors.green} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Content */}
          <View style={styles.section}>
            <Controller
              control={control}
              name="content"
              render={({ field: { onChange, value } }) => (
                <View>
                  <Text style={[styles.label, { color: theme.colors.charcoal }]}>
                    Content *
                  </Text>
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
                    placeholder="Write about your allotment activities..."
                    placeholderTextColor={theme.colors.gray}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                  {errors.content && (
                    <Text style={[styles.error, { color: theme.colors.error }]}>
                      {errors.content.message}
                    </Text>
                  )}
                </View>
              )}
            />
          </View>

          {/* Weather & Temperature */}
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Controller
                control={control}
                name="weather"
                render={({ field: { onChange, value } }) => (
                  <FormField
                    label="Weather"
                    value={value || ''}
                    onChangeText={onChange}
                    placeholder="Sunny, rainy, etc."
                  />
                )}
              />
            </View>
            <View style={styles.halfWidth}>
              <Controller
                control={control}
                name="temperature"
                render={({ field: { onChange, value } }) => (
                  <FormField
                    label="Temperature (°C)"
                    value={value?.toString() || ''}
                    onChangeText={(text) => onChange(text ? parseFloat(text) : undefined)}
                    placeholder="15"
                    keyboardType="numeric"
                  />
                )}
              />
            </View>
          </View>

          {/* Photos */}
          <View style={styles.section}>
            <View style={styles.photoHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.charcoal }]}>
                Photos
              </Text>
              <TouchableOpacity onPress={pickImage} accessibilityRole="button" accessibilityLabel="Add photos from camera or library">
                <Ionicons name="camera" size={24} color={theme.colors.green} />
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
                      accessibilityRole="button"
                      accessibilityLabel={`Remove photo ${index + 1}`}
                    >
                      <Ionicons name="close" size={12} color={theme.colors.paper} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
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
  templateScroll: {
    flexDirection: 'row',
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    marginRight: 8,
  },
  templateName: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  prompts: {
    gap: 8,
  },
  prompt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  promptText: {
    flex: 1,
    fontSize: 14,
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
    minHeight: 120,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  halfWidth: {
    flex: 1,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoScroll: {
    flexDirection: 'row',
  },
  photoContainer: {
    position: 'relative',
    marginRight: 8,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhoto: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});