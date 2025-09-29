import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { usePlots, useCreateInspection, scheduleReinspectNotification } from '../hooks/useInspections';
import { InspectionFormData, InspectionFormDataT, INSPECTION_ISSUES, INSPECTION_ISSUE_LABELS, calculateInspectionScore } from '../types/inspections';
import { Button } from '../design/Button';
import { FormField } from '../design/FormField';
import { Card } from '../design/Card';
import { Tag } from '../design/Tag';
import { tokens } from '../design/tokens';
import { Ionicons } from '@expo/vector-icons';

interface CreateInspectionModalProps {
  visible: boolean;
  onClose: () => void;
  plotId?: string; // Pre-select plot if provided
  mode?: 'single' | 'batch';
  initialPlotNumber?: number;
  onSave?: (draft: any) => Promise<void>;
  onSaveAndNext?: (draft: any) => Promise<void>;
}

export const CreateInspectionModal: React.FC<CreateInspectionModalProps> = ({
  visible,
  onClose,
  plotId,
  mode = 'single',
  initialPlotNumber,
  onSave,
  onSaveAndNext,
}) => {
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [showPlotPicker, setShowPlotPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: plots = [] } = usePlots();
  const createInspectionMutation = useCreateInspection();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InspectionFormDataT>({
    resolver: zodResolver(InspectionFormData) as any,
    defaultValues: {
      plot_id: plotId || '',
      use_status: 'active',
      upkeep: 'good',
      issues: [],
      notes: '',
      photos: [],
      action: 'none',
      reinspect_by: '',
    },
  });

  const selectedPlotId = watch('plot_id');
  const useStatus = watch('use_status');
  const upkeep = watch('upkeep');
  const selectedIssues = watch('issues');
  const selectedAction = watch('action');

  // Calculate score in real-time
  const currentScore = calculateInspectionScore(useStatus, upkeep);

  useEffect(() => {
    if (visible && plotId) {
      setValue('plot_id', plotId);
    }
  }, [visible, plotId, setValue]);

  const handleClose = () => {
    reset();
    setSelectedPhotos([]);
    setShowPlotPicker(false);
    onClose();
  };

  const handlePhotoSelection = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera roll access is required to add photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [16, 9],
      });

      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map(asset => asset.uri);
        const compressed = await ImageCompressionService.compressImages(newPhotos, { maxWidth: 1600, maxHeight: 1600, quality: 0.8 });
        setSelectedPhotos(prev => [...prev, ...compressed]);
        setValue('photos', [...selectedPhotos, ...compressed]);
      }
    } catch (error) {
      console.error('Photo selection error:', error);
      Alert.alert('Error', 'Failed to select photos. Please try again.');
    }
  };

  const handleCameraCapture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        aspect: [16, 9],
      });

      if (!result.canceled && result.assets?.[0]) {
        const newPhoto = result.assets[0].uri;
        const compressed = await ImageCompressionService.compressImage(newPhoto, { maxWidth: 1600, maxHeight: 1600, quality: 0.8 });
        setSelectedPhotos(prev => [...prev, compressed]);
        setValue('photos', [...selectedPhotos, compressed]);
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = selectedPhotos.filter((_, i) => i !== index);
    setSelectedPhotos(newPhotos);
    setValue('photos', newPhotos);
  };

  const toggleIssue = (issue: string) => {
    const newIssues = selectedIssues.includes(issue)
      ? selectedIssues.filter(i => i !== issue)
      : [...selectedIssues, issue];
    setValue('issues', newIssues);
  };

  const onSubmit = async (data: InspectionFormDataT) => {
    if (!data.plot_id) {
      Alert.alert('Error', 'Please select a plot to inspect.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (mode === 'batch' && (onSave || onSaveAndNext)) {
        const plot = plots.find(p => p.id === data.plot_id);
        const draft = {
          plotNumber: Number(plot?.number),
          useStatus: data.use_status,
          upkeep: data.upkeep,
          issues: data.issues,
          notes: data.notes,
          photos: selectedPhotos,
          action: data.action,
          reinspectBy: data.reinspect_by || undefined,
        };
        if (draft.reinspectBy && draft.plotNumber) {
          await scheduleReinspectNotification(draft.plotNumber, draft.reinspectBy).catch((e) => {
            console.warn('Failed to schedule reinspection notification:', e);
          });
        }
        if (onSaveAndNext) {
          await onSaveAndNext(draft);
        } else if (onSave) {
          await onSave(draft);
        }
      } else {
        await createInspectionMutation.mutateAsync({
          ...data,
          photos: selectedPhotos,
        });
        if (data.reinspect_by && selectedPlot?.number) {
          await scheduleReinspectNotification(Number(selectedPlot.number), data.reinspect_by).catch((e) => {
            console.warn('Failed to schedule reinspection notification:', e);
          });
        }
        Alert.alert('Success', 'Inspection created successfully!', [
          { text: 'OK', onPress: handleClose }
        ]);
      }
    } catch (error) {
      console.error('Create inspection error:', error);
      Alert.alert('Error', 'Failed to create inspection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPlot = plots.find(p => p.id === selectedPlotId);
  
  const photoOptions = [
    { title: 'Take Photo', icon: 'camera', onPress: handleCameraCapture },
    { title: 'Choose from Library', icon: 'images', onPress: handlePhotoSelection },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={tokens.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>New Inspection</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Plot Selection */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Plot Selection</Text>
            <TouchableOpacity
              style={styles.plotSelector}
              onPress={() => setShowPlotPicker(true)}
            >
              <View style={styles.plotSelectorContent}>
                <Ionicons name="location" size={20} color={tokens.colors.text.secondary} />
                <Text style={styles.plotSelectorText}>
                  {selectedPlot ? `Plot ${selectedPlot.number}` : 'Select a plot'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color={tokens.colors.text.secondary} />
            </TouchableOpacity>
            {errors.plot_id && (
              <Text style={styles.errorText}>{errors.plot_id.message}</Text>
            )}
          </Card>

          {/* Assessment */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Assessment</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Use Status</Text>
              <View style={styles.radioGroup}>
                {[
                  { value: 'active', label: 'Actively Used' },
                  { value: 'partial', label: 'Partially Used' },
                  { value: 'not_used', label: 'Not Used' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.radioOption,
                      useStatus === option.value && styles.radioOptionSelected
                    ]}
                    onPress={() => setValue('use_status', option.value as any)}
                  >
                    <Text style={[
                      styles.radioOptionText,
                      useStatus === option.value && styles.radioOptionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Upkeep Condition</Text>
              <View style={styles.radioGroup}>
                {[
                  { value: 'good', label: 'Good' },
                  { value: 'fair', label: 'Fair' },
                  { value: 'poor', label: 'Poor' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.radioOption,
                      upkeep === option.value && styles.radioOptionSelected
                    ]}
                    onPress={() => setValue('upkeep', option.value as any)}
                  >
                    <Text style={[
                      styles.radioOptionText,
                      upkeep === option.value && styles.radioOptionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Score Display */}
            <View style={styles.scoreDisplay}>
              <Text style={styles.scoreLabel}>Current Score</Text>
              <View style={[styles.scoreCircle, { 
                backgroundColor: currentScore >= 80 ? tokens.colors.success : 
                               currentScore >= 60 ? tokens.colors.warning : 
                               tokens.colors.danger 
              }]}>
                <Text style={styles.scoreText}>{currentScore}</Text>
              </View>
            </View>
          </Card>

          {/* Issues */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Issues (Select all that apply)</Text>
            <View style={styles.issuesGrid}>
              {INSPECTION_ISSUES.map((issue) => (
                <TouchableOpacity
                  key={issue}
                  style={[
                    styles.issueChip,
                    selectedIssues.includes(issue) && styles.issueChipSelected
                  ]}
                  onPress={() => toggleIssue(issue)}
                >
                  <Text style={[
                    styles.issueChipText,
                    selectedIssues.includes(issue) && styles.issueChipTextSelected
                  ]}>
                    {INSPECTION_ISSUE_LABELS[issue]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Action Required */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Action Required</Text>
            <View style={styles.radioGroup}>
              {[
                { value: 'none', label: 'No Action Required' },
                { value: 'advisory', label: 'Advisory' },
                { value: 'warning', label: 'Warning' },
                { value: 'final_warning', label: 'Final Warning' },
                { value: 'recommend_removal', label: 'Recommend Removal' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.radioOption,
                    selectedAction === option.value && styles.radioOptionSelected
                  ]}
                  onPress={() => setValue('action', option.value as any)}
                >
                  <Text style={[
                    styles.radioOptionText,
                    selectedAction === option.value && styles.radioOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {(selectedAction === 'warning' || selectedAction === 'final_warning' || selectedAction === 'recommend_removal') && (
              <Controller
                control={control}
                name="reinspect_by"
                render={({ field }) => (
                  <FormField
                    label="Reinspect By (Date)"
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder="YYYY-MM-DD"
                    error={errors.reinspect_by?.message}
                    style={styles.dateField}
                  />
                )}
              />
            )}
          </Card>

          {/* Photos */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <View style={styles.photoActions}>
              {photoOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.photoAction}
                  onPress={option.onPress}
                >
                  <Ionicons name={option.icon as any} size={24} color={tokens.colors.primary} />
                  <Text style={styles.photoActionText}>{option.title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedPhotos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoPreview}>
                {selectedPhotos.map((photo, index) => (
                  <View key={index} style={styles.photoContainer}>
                    <Image source={{ uri: photo }} style={styles.photoThumbnail} />
                    <TouchableOpacity
                      style={styles.photoRemove}
                      onPress={() => removePhoto(index)}
                    >
                      <Ionicons name="close" size={16} color={tokens.colors.white} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </Card>

          {/* Notes */}
          <Card style={styles.section}>
            <Controller
              control={control}
              name="notes"
              render={({ field }) => (
                <FormField
                  label="Notes (Optional)"
                  value={field.value || ''}
                  onChangeText={field.onChange}
                  placeholder="Add any additional comments..."
                  multiline
                  numberOfLines={4}
                  error={errors.notes?.message}
                />
              )}
            />
          </Card>
        </ScrollView>

        <View style={styles.footer}>
          {mode === 'batch' ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                title={isSubmitting ? 'Saving...' : 'Save'}
                onPress={handleSubmit(onSubmit as any)}
                loading={isSubmitting}
                disabled={!selectedPlotId}
              />
              {onSaveAndNext && (
                <Button
                  title={isSubmitting ? 'Saving...' : 'Save & Next Plot'}
                  onPress={handleSubmit(onSubmit as any)}
                  loading={isSubmitting}
                  disabled={!selectedPlotId}
                />
              )}
            </View>
          ) : (
            <Button
              title={isSubmitting ? 'Creating...' : 'Create Inspection'}
              onPress={handleSubmit(onSubmit as any)}
              loading={isSubmitting}
              disabled={!selectedPlotId}
            />
          )}
        </View>

        {/* Plot Picker Modal */}
        <Modal visible={showPlotPicker} animationType="slide" presentationStyle="formSheet">
          <SafeAreaView style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setShowPlotPicker(false)}>
                <Text style={styles.pickerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>Select Plot</Text>
              <View style={styles.placeholder} />
            </View>
            
            <ScrollView style={styles.pickerContent}>
              {plots.map((plot) => (
                <TouchableOpacity
                  key={plot.id}
                  style={styles.plotOption}
                  onPress={() => {
                    setValue('plot_id', plot.id);
                    setShowPlotPicker(false);
                  }}
                >
                  <View style={styles.plotOptionInfo}>
                    <Text style={styles.plotOptionNumber}>Plot {plot.number}</Text>
                    <Text style={styles.plotOptionDetails}>
                      {plot.size} • {plot.holder_user_id ? 'Occupied' : 'Vacant'}
                    </Text>
                  </View>
                  {selectedPlotId === plot.id && (
                    <Ionicons name="checkmark" size={20} color={tokens.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  closeButton: {
    padding: tokens.spacing.xs,
  },
  title: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.text.primary,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  section: {
    margin: tokens.spacing.md,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.semiBold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.md,
  },
  plotSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.borderRadius.md,
    backgroundColor: tokens.colors.surface,
  },
  plotSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plotSelectorText: {
    marginLeft: tokens.spacing.sm,
    fontSize: tokens.typography.sizes.md,
    color: tokens.colors.text.primary,
  },
  formGroup: {
    marginBottom: tokens.spacing.lg,
  },
  fieldLabel: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.sm,
  },
  radioGroup: {
    gap: tokens.spacing.sm,
  },
  radioOption: {
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.borderRadius.md,
    backgroundColor: tokens.colors.surface,
  },
  radioOptionSelected: {
    borderColor: tokens.colors.primary,
    backgroundColor: tokens.colors.primary + '10',
  },
  radioOptionText: {
    fontSize: tokens.typography.sizes.md,
    color: tokens.colors.text.primary,
    textAlign: 'center',
  },
  radioOptionTextSelected: {
    color: tokens.colors.primary,
    fontWeight: tokens.typography.weights.medium,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: tokens.spacing.md,
  },
  scoreLabel: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.colors.text.primary,
  },
  scoreCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.white,
  },
  issuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  issueChip: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.borderRadius.full,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
  },
  issueChipSelected: {
    borderColor: tokens.colors.danger,
    backgroundColor: tokens.colors.danger + '10',
  },
  issueChipText: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.primary,
  },
  issueChipTextSelected: {
    color: tokens.colors.danger,
    fontWeight: tokens.typography.weights.medium,
  },
  dateField: {
    marginTop: tokens.spacing.md,
  },
  photoActions: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  },
  photoAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.borderRadius.md,
    borderStyle: 'dashed',
  },
  photoActionText: {
    marginTop: tokens.spacing.xs,
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.primary,
    fontWeight: tokens.typography.weights.medium,
  },
  photoPreview: {
    marginTop: tokens.spacing.md,
  },
  photoContainer: {
    position: 'relative',
    marginRight: tokens.spacing.sm,
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: tokens.borderRadius.md,
  },
  photoRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: tokens.colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: tokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
  },
  errorText: {
    marginTop: tokens.spacing.xs,
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.danger,
  },
  
  // Plot picker styles
  pickerContainer: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  pickerCancel: {
    fontSize: tokens.typography.sizes.md,
    color: tokens.colors.primary,
  },
  pickerTitle: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.text.primary,
  },
  pickerContent: {
    flex: 1,
  },
  plotOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  plotOptionInfo: {
    flex: 1,
  },
  plotOptionNumber: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.semiBold,
    color: tokens.colors.text.primary,
  },
  plotOptionDetails: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.xs,
  },
});