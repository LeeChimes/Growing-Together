import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUploadDocument, useDocumentPicker } from '../hooks/useDocuments';
import { DocumentFormData, DocumentFormDataT, DocumentUploadDataT, DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_DESCRIPTIONS } from '../types/documents';
import { Button } from '../design/Button';
import { FormField } from '../design/FormField';
import { Card } from '../design/Card';
import { Tag } from '../design/Tag';
import { tokens } from '../design/tokens';
import { Ionicons } from '@expo/vector-icons';

interface UploadDocumentModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: string; // For admin uploading on behalf of user
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  visible,
  onClose,
  userId,
}) => {
  const [selectedFile, setSelectedFile] = useState<DocumentUploadDataT | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadDocumentMutation = useUploadDocument();
  const documentPickerMutation = useDocumentPicker();

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DocumentFormDataT>({
    resolver: zodResolver(DocumentFormData),
    defaultValues: {
      title: '',
      type: 'other',
      expires_at: '',
    },
  });

  const handleClose = () => {
    reset();
    setSelectedFile(null);
    onClose();
  };

  const handleFilePick = async () => {
    try {
      const file = await documentPickerMutation.mutateAsync();
      if (file) {
        setSelectedFile(file);
        // Auto-fill title with filename if empty
        if (!control._formValues.title) {
          const nameWithoutExtension = file.name.split('.').slice(0, -1).join('.');
          setValue('title', nameWithoutExtension);
        }
      }
    } catch (error) {
      console.error('File picker error:', error);
      Alert.alert('Error', 'Failed to select file. Please try again.');
    }
  };

  const onSubmit = async (data: DocumentFormDataT) => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file to upload.');
      return;
    }

    try {
      setIsUploading(true);
      await uploadDocumentMutation.mutateAsync({
        documentData: data,
        file: selectedFile,
        userId,
      });
      
      Alert.alert('Success', 'Document uploaded successfully!', [
        { text: 'OK', onPress: handleClose }
      ]);
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={tokens.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Upload Document</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* File Selection */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Select File</Text>
            
            {selectedFile ? (
              <View style={styles.selectedFile}>
                <View style={styles.fileIcon}>
                  <Ionicons name="document" size={24} color={tokens.colors.primary} />
                </View>
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName}>{selectedFile.name}</Text>
                  <Text style={styles.fileSize}>
                    {selectedFile.size ? formatFileSize(selectedFile.size) : 'Unknown size'}
                  </Text>
                  {selectedFile.type && (
                    <Text style={styles.fileType}>{selectedFile.type}</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedFile(null)}
                  style={styles.removeFile}
                >
                  <Ionicons name="close-circle" size={20} color={tokens.colors.danger} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.filePicker}
                onPress={handleFilePick}
                disabled={documentPickerMutation.isPending}
              >
                <Ionicons name="cloud-upload" size={32} color={tokens.colors.primary} />
                <Text style={styles.filePickerTitle}>
                  {documentPickerMutation.isPending ? 'Opening file picker...' : 'Choose File'}
                </Text>
                <Text style={styles.filePickerDescription}>
                  PDF, DOC, DOCX, JPG, PNG files up to 10MB
                </Text>
              </TouchableOpacity>
            )}
          </Card>

          {/* Document Details */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Document Details</Text>
            
            <Controller
              control={control}
              name="title"
              render={({ field }) => (
                <FormField
                  label="Document Title *"
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Enter document title..."
                  error={errors.title?.message}
                />
              )}
            />

            <View style={styles.typeSelection}>
              <Text style={styles.fieldLabel}>Document Type *</Text>
              <View style={styles.typeButtons}>
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                  <Controller
                    key={value}
                    control={control}
                    name="type"
                    render={({ field }) => (
                      <TouchableOpacity
                        style={[
                          styles.typeButton,
                          field.value === value && styles.typeButtonSelected
                        ]}
                        onPress={() => field.onChange(value)}
                      >
                        <Text style={[
                          styles.typeButtonText,
                          field.value === value && styles.typeButtonTextSelected
                        ]}>
                          {label}
                        </Text>
                        <Text style={[
                          styles.typeButtonDescription,
                          field.value === value && styles.typeButtonDescriptionSelected
                        ]}>
                          {DOCUMENT_TYPE_DESCRIPTIONS[value as keyof typeof DOCUMENT_TYPE_DESCRIPTIONS]}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                ))}
              </View>
            </View>

            <Controller
              control={control}
              name="expires_at"
              render={({ field }) => (
                <FormField
                  label="Expiry Date (Optional)"
                  value={field.value || ''}
                  onChangeText={field.onChange}
                  placeholder="YYYY-MM-DD"
                  error={errors.expires_at?.message}
                />
              )}
            />
          </Card>

          {/* Upload Info */}
          <Card style={styles.section}>
            <View style={styles.uploadInfo}>
              <Ionicons name="information-circle" size={20} color={tokens.colors.primary} />
              <View style={styles.uploadInfoContent}>
                <Text style={styles.uploadInfoTitle}>Upload Guidelines</Text>
                <Text style={styles.uploadInfoText}>
                  • Maximum file size: 10MB{'\n'}
                  • Supported formats: PDF, DOC, DOCX, JPG, PNG{'\n'}
                  • Files are stored securely and only visible to you and administrators{'\n'}
                  • Set expiry dates for documents that need renewal
                </Text>
              </View>
            </View>
          </Card>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={isUploading ? 'Uploading...' : 'Upload Document'}
            onPress={handleSubmit(onSubmit)}
            loading={isUploading}
            disabled={!selectedFile}
          />
        </View>
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
  
  // File Selection
  filePicker: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing.xl * 2,
    paddingHorizontal: tokens.spacing.xl,
    borderWidth: 2,
    borderColor: tokens.colors.border,
    borderStyle: 'dashed',
    borderRadius: tokens.borderRadius.lg,
    backgroundColor: tokens.colors.surface,
  },
  filePickerTitle: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.semiBold,
    color: tokens.colors.primary,
    marginTop: tokens.spacing.md,
  },
  filePickerDescription: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
    marginTop: tokens.spacing.xs,
  },
  selectedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing.md,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.borderRadius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: tokens.borderRadius.md,
    backgroundColor: tokens.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: tokens.spacing.md,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.colors.text.primary,
  },
  fileSize: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.xs,
  },
  fileType: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
  },
  removeFile: {
    padding: tokens.spacing.xs,
  },
  
  // Type Selection
  typeSelection: {
    marginBottom: tokens.spacing.lg,
  },
  fieldLabel: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.sm,
  },
  typeButtons: {
    gap: tokens.spacing.sm,
  },
  typeButton: {
    padding: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.borderRadius.md,
    backgroundColor: tokens.colors.surface,
  },
  typeButtonSelected: {
    borderColor: tokens.colors.primary,
    backgroundColor: tokens.colors.primary + '10',
  },
  typeButtonText: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.colors.text.primary,
  },
  typeButtonTextSelected: {
    color: tokens.colors.primary,
  },
  typeButtonDescription: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.xs,
  },
  typeButtonDescriptionSelected: {
    color: tokens.colors.primary + 'CC',
  },
  
  // Upload Info
  uploadInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: tokens.colors.primary + '10',
    padding: tokens.spacing.md,
    borderRadius: tokens.borderRadius.md,
    borderWidth: 1,
    borderColor: tokens.colors.primary + '40',
  },
  uploadInfoContent: {
    flex: 1,
    marginLeft: tokens.spacing.sm,
  },
  uploadInfoTitle: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.semiBold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.xs,
  },
  uploadInfoText: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
    lineHeight: 20,
  },
  
  // Footer
  footer: {
    padding: tokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
  },
});