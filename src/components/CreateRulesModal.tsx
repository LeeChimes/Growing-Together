import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateRules } from '../hooks/useRules';
import { RulesFormData, RulesFormDataT, DEFAULT_RULES_MARKDOWN } from '../types/rules';
import { Button } from '../design/Button';
import { FormField } from '../design/FormField';
import { Card } from '../design/Card';
import { tokens } from '../design/tokens';
import { Ionicons } from '@expo/vector-icons';

interface CreateRulesModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreateRulesModal: React.FC<CreateRulesModalProps> = ({
  visible,
  onClose,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createRulesMutation = useCreateRules();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RulesFormDataT>({
    resolver: zodResolver(RulesFormData),
    defaultValues: {
      version: '',
      markdown: DEFAULT_RULES_MARKDOWN,
      summary: '',
    },
  });

  const markdownContent = watch('markdown');

  const handleClose = () => {
    reset();
    setShowPreview(false);
    onClose();
  };

  const loadTemplate = () => {
    Alert.alert(
      'Load Template',
      'This will replace the current content with the default template. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Load Template',
          onPress: () => {
            setValue('markdown', DEFAULT_RULES_MARKDOWN);
            setValue('summary', 'Community rules and guidelines');
          },
        },
      ]
    );
  };

  const onSubmit = async (data: RulesFormDataT) => {
    try {
      setIsSubmitting(true);
      await createRulesMutation.mutateAsync(data);
      
      Alert.alert('Success', 'New rules version published successfully!', [
        { text: 'OK', onPress: handleClose }
      ]);
    } catch (error) {
      console.error('Create rules error:', error);
      Alert.alert('Error', 'Failed to publish rules. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPreview = () => {
    if (!markdownContent) return null;

    // Simple markdown to styled text conversion for preview
    const lines = markdownContent.split('\n');
    const elements: React.ReactElement[] = [];

    lines.forEach((line, index) => {
      if (line.startsWith('# ')) {
        elements.push(
          <Text key={index} style={styles.previewH1}>
            {line.replace('# ', '')}
          </Text>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <Text key={index} style={styles.previewH2}>
            {line.replace('## ', '')}
          </Text>
        );
      } else if (line.startsWith('- ')) {
        elements.push(
          <Text key={index} style={styles.previewBullet}>
            • {line.replace('- ', '')}
          </Text>
        );
      } else if (line.trim() === '---') {
        elements.push(
          <View key={index} style={styles.previewDivider} />
        );
      } else if (line.trim()) {
        elements.push(
          <Text key={index} style={styles.previewText}>
            {line}
          </Text>
        );
      } else {
        elements.push(
          <View key={index} style={styles.previewSpacing} />
        );
      }
    });

    return (
      <ScrollView style={styles.previewContainer} showsVerticalScrollIndicator={false}>
        {elements}
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={tokens.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>
            {showPreview ? 'Rules Preview' : 'Create New Rules'}
          </Text>
          <TouchableOpacity
            onPress={() => setShowPreview(!showPreview)}
            style={styles.previewToggle}
          >
            <Ionicons 
              name={showPreview ? "create" : "eye"} 
              size={20} 
              color={tokens.colors.primary} 
            />
            <Text style={styles.previewToggleText}>
              {showPreview ? 'Edit' : 'Preview'}
            </Text>
          </TouchableOpacity>
        </View>

        {showPreview ? (
          <View style={styles.content}>
            {renderPreview()}
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Version Information</Text>
              
              <Controller
                control={control}
                name="version"
                render={({ field }) => (
                  <FormField
                    label="Version Number *"
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder="e.g., 1.0, 2.1, etc."
                    error={errors.version?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="summary"
                render={({ field }) => (
                  <FormField
                    label="Summary (Optional)"
                    value={field.value || ''}
                    onChangeText={field.onChange}
                    placeholder="Brief description of changes or updates..."
                    multiline
                    numberOfLines={2}
                    error={errors.summary?.message}
                  />
                )}
              />
            </Card>

            <Card style={styles.section}>
              <View style={styles.markdownHeader}>
                <Text style={styles.sectionTitle}>Rules Content (Markdown)</Text>
                <TouchableOpacity
                  onPress={loadTemplate}
                  style={styles.templateButton}
                >
                  <Ionicons name="document-outline" size={16} color={tokens.colors.primary} />
                  <Text style={styles.templateButtonText}>Load Template</Text>
                </TouchableOpacity>
              </View>

              <Controller
                control={control}
                name="markdown"
                render={({ field }) => (
                  <View style={styles.markdownContainer}>
                    <TextInput
                      style={styles.markdownInput}
                      value={field.value}
                      onChangeText={field.onChange}
                      placeholder="Enter rules content in Markdown format..."
                      multiline
                      textAlignVertical="top"
                      placeholderTextColor={tokens.colors.text.secondary}
                    />
                    {errors.markdown && (
                      <Text style={styles.errorText}>{errors.markdown.message}</Text>
                    )}
                  </View>
                )}
              />

              <View style={styles.markdownHelp}>
                <Text style={styles.markdownHelpTitle}>Markdown Quick Reference:</Text>
                <Text style={styles.markdownHelpText}>
                  # Main Heading{'\n'}
                  ## Section Heading{'\n'}
                  - Bullet point{'\n'}
                  **Bold text**{'\n'}
                  *Italic text*{'\n'}
                  --- (Horizontal line)
                </Text>
              </View>
            </Card>

            <Card style={styles.section}>
              <View style={styles.publishWarning}>
                <Ionicons name="warning" size={20} color={tokens.colors.warning} />
                <View style={styles.publishWarningContent}>
                  <Text style={styles.publishWarningTitle}>Publishing Notice</Text>
                  <Text style={styles.publishWarningText}>
                    Publishing a new rules version will deactivate the current version and require all members to acknowledge the new rules.
                  </Text>
                </View>
              </View>
            </Card>
          </ScrollView>
        )}

        <View style={styles.footer}>
          {showPreview ? (
            <Button
              title="Back to Edit"
              onPress={() => setShowPreview(false)}
              variant="outline"
            />
          ) : (
            <Button
              title={isSubmitting ? 'Publishing...' : 'Publish Rules'}
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={!watch('version') || !watch('markdown')}
            />
          )}
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
  previewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.borderRadius.md,
    borderWidth: 1,
    borderColor: tokens.colors.primary,
  },
  previewToggleText: {
    marginLeft: tokens.spacing.xs,
    color: tokens.colors.primary,
    fontSize: tokens.typography.sizes.sm,
    fontWeight: tokens.typography.weights.medium,
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
  markdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.borderRadius.md,
    borderWidth: 1,
    borderColor: tokens.colors.primary,
  },
  templateButtonText: {
    marginLeft: tokens.spacing.xs,
    color: tokens.colors.primary,
    fontSize: tokens.typography.sizes.sm,
  },
  markdownContainer: {
    marginBottom: tokens.spacing.md,
  },
  markdownInput: {
    minHeight: 300,
    maxHeight: 400,
    padding: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.borderRadius.md,
    backgroundColor: tokens.colors.surface,
    fontSize: tokens.typography.sizes.md,
    color: tokens.colors.text.primary,
    fontFamily: 'monospace',
  },
  markdownHelp: {
    backgroundColor: tokens.colors.surface,
    padding: tokens.spacing.md,
    borderRadius: tokens.borderRadius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  markdownHelpTitle: {
    fontSize: tokens.typography.sizes.sm,
    fontWeight: tokens.typography.weights.semiBold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.xs,
  },
  markdownHelpText: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  publishWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: tokens.colors.warning + '10',
    padding: tokens.spacing.md,
    borderRadius: tokens.borderRadius.md,
    borderWidth: 1,
    borderColor: tokens.colors.warning + '40',
  },
  publishWarningContent: {
    flex: 1,
    marginLeft: tokens.spacing.sm,
  },
  publishWarningTitle: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.semiBold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.xs,
  },
  publishWarningText: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
    lineHeight: 20,
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
  
  // Preview styles
  previewContainer: {
    flex: 1,
    padding: tokens.spacing.md,
  },
  previewH1: {
    fontSize: tokens.typography.sizes.xxl,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.text.primary,
    marginVertical: tokens.spacing.md,
  },
  previewH2: {
    fontSize: tokens.typography.sizes.xl,
    fontWeight: tokens.typography.weights.semiBold,
    color: tokens.colors.text.primary,
    marginTop: tokens.spacing.lg,
    marginBottom: tokens.spacing.sm,
  },
  previewBullet: {
    fontSize: tokens.typography.sizes.md,
    color: tokens.colors.text.primary,
    marginVertical: tokens.spacing.xs,
    marginLeft: tokens.spacing.md,
    lineHeight: 22,
  },
  previewText: {
    fontSize: tokens.typography.sizes.md,
    color: tokens.colors.text.primary,
    marginVertical: tokens.spacing.xs,
    lineHeight: 22,
  },
  previewDivider: {
    height: 1,
    backgroundColor: tokens.colors.border,
    marginVertical: tokens.spacing.lg,
  },
  previewSpacing: {
    height: tokens.spacing.sm,
  },
});