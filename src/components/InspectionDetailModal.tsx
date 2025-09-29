import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUpdateInspection, useDeleteInspection, usePlots } from '../hooks/useInspections';
import { useAuthStore } from '../store/authStore';
import { InspectionT, getScoreColor, getActionSeverity, ACTION_LABELS, USE_STATUS_LABELS, UPKEEP_LABELS, INSPECTION_ISSUE_LABELS } from '../types/inspections';
import { Button } from '../design/Button';
import { Card } from '../design/Card';
import { Tag } from '../design/Tag';
import { tokens } from '../design/tokens';
import { Ionicons } from '@expo/vector-icons';

interface InspectionDetailModalProps {
  inspection: InspectionT | null;
  visible: boolean;
  onClose: () => void;
}

export const InspectionDetailModal: React.FC<InspectionDetailModalProps> = ({
  inspection,
  visible,
  onClose,
}) => {
  const { user } = useAuthStore();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { data: plots = [] } = usePlots();
  const updateInspectionMutation = useUpdateInspection();
  const deleteInspectionMutation = useDeleteInspection();

  if (!inspection) return null;

  const plot = plots.find(p => p.id === inspection.plot_id);
  const scoreColor = getScoreColor(inspection.score);
  const actionSeverity = getActionSeverity(inspection.action);
  const isAdmin = user?.role === 'admin';
  const canEdit = isAdmin && inspection.assessor_user_id === user?.id;

  const handleShare = async () => {
    try {
      const shareContent = `Plot ${plot?.number || 'N/A'} Inspection Report

Date: ${new Date(inspection.date).toLocaleDateString()}
Score: ${inspection.score}/100
Use Status: ${USE_STATUS_LABELS[inspection.use_status as keyof typeof USE_STATUS_LABELS]}
Upkeep: ${UPKEEP_LABELS[inspection.upkeep as keyof typeof UPKEEP_LABELS]}
Action: ${ACTION_LABELS[inspection.action as keyof typeof ACTION_LABELS]}

${inspection.issues.length > 0 ? `Issues: ${inspection.issues.map(issue => INSPECTION_ISSUE_LABELS[issue as keyof typeof INSPECTION_ISSUE_LABELS]).join(', ')}` : ''}
${inspection.notes ? `Notes: ${inspection.notes}` : ''}
${inspection.reinspect_by ? `Reinspect by: ${new Date(inspection.reinspect_by).toLocaleDateString()}` : ''}`;

      await Share.share({
        message: shareContent,
        title: `Plot ${plot?.number} Inspection Report`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Inspection',
      'Are you sure you want to delete this inspection? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await deleteInspectionMutation.mutateAsync(inspection.id!);
              Alert.alert('Success', 'Inspection deleted successfully.');
              onClose();
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete inspection.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleSharedWithMember = async () => {
    try {
      await updateInspectionMutation.mutateAsync({
        id: inspection.id!,
        shared_with_member: !inspection.shared_with_member,
      });
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Failed to update inspection visibility.');
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={tokens.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>Inspection Details</Text>
            <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
              <Ionicons name="share-outline" size={24} color={tokens.colors.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Header Info */}
            <Card style={styles.section}>
              <View style={styles.inspectionHeader}>
                <View style={styles.plotInfo}>
                  <Text style={styles.plotNumber}>Plot {plot?.number || 'N/A'}</Text>
                  <Text style={styles.inspectionDate}>
                    {new Date(inspection.date).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                  {plot?.holder_user_id && (
                    <Text style={styles.plotHolder}>
                      Holder: {(plot as any).profiles?.full_name || 'Unknown'}
                    </Text>
                  )}
                </View>
                <View style={[styles.scoreCircle, { backgroundColor: scoreColor }]}>
                  <Text style={styles.scoreText}>{inspection.score}</Text>
                  <Text style={styles.scoreLabel}>/ 100</Text>
                </View>
              </View>

              <Text style={styles.assessorInfo}>
                Assessed by: {(inspection as any).profiles?.full_name || 'Unknown'}
              </Text>
            </Card>

            {/* Assessment Details */}
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Assessment</Text>
              
              <View style={styles.assessmentGrid}>
                <View style={styles.assessmentItem}>
                  <Text style={styles.assessmentLabel}>Use Status</Text>
                  <Tag
                    label={USE_STATUS_LABELS[inspection.use_status as keyof typeof USE_STATUS_LABELS]}
                    variant={inspection.use_status === 'active' ? 'success' : inspection.use_status === 'partial' ? 'warning' : 'error'}
                  />
                </View>
                
                <View style={styles.assessmentItem}>
                  <Text style={styles.assessmentLabel}>Upkeep</Text>
                  <Tag
                    label={UPKEEP_LABELS[inspection.upkeep as keyof typeof UPKEEP_LABELS]}
                    variant={inspection.upkeep === 'good' ? 'success' : inspection.upkeep === 'fair' ? 'warning' : 'error'}
                  />
                </View>
              </View>

              {inspection.action !== 'none' && (
                <View style={styles.actionSection}>
                  <Text style={styles.assessmentLabel}>Action Required</Text>
                  <Tag
                    label={ACTION_LABELS[inspection.action as keyof typeof ACTION_LABELS]}
                    variant={
                      actionSeverity === 'critical' ? 'error' : 
                      actionSeverity === 'high' ? 'warning' : 
                      'default'
                    }
                  />
                  
                  {inspection.reinspect_by && (
                    <View style={styles.reinspectInfo}>
                      <Ionicons name="time" size={16} color={tokens.colors.text.secondary} />
                      <Text style={styles.reinspectText}>
                        Reinspect by: {new Date(inspection.reinspect_by).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </Card>

            {/* Issues */}
            {inspection.issues.length > 0 && (
              <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Issues Found</Text>
                <View style={styles.issuesContainer}>
                  {inspection.issues.map((issue, index) => (
                    <View key={index} style={styles.issueItem}>
                      <Ionicons name="warning" size={16} color={tokens.colors.warning} />
                      <Text style={styles.issueText}>
                        {INSPECTION_ISSUE_LABELS[issue as keyof typeof INSPECTION_ISSUE_LABELS]}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}

            {/* Photos */}
            {inspection.photos.length > 0 && (
              <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Photos ({inspection.photos.length})</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
                  {inspection.photos.map((photo, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.photoContainer}
                      onPress={() => setSelectedPhotoIndex(index)}
                    >
                      <Image source={{ uri: photo }} style={styles.photoThumbnail} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Card>
            )}

            {/* Notes */}
            {inspection.notes && (
              <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <Text style={styles.notesText}>{inspection.notes}</Text>
              </Card>
            )}

            {/* Admin Controls */}
            {isAdmin && (
              <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Admin Controls</Text>
                
                <View style={styles.adminControls}>
                  <TouchableOpacity
                    style={[
                      styles.visibilityToggle,
                      inspection.shared_with_member && styles.visibilityToggleActive
                    ]}
                    onPress={handleToggleSharedWithMember}
                  >
                    <Ionicons 
                      name={inspection.shared_with_member ? "eye" : "eye-off"} 
                      size={20} 
                      color={inspection.shared_with_member ? tokens.colors.primary : tokens.colors.text.secondary} 
                    />
                    <Text style={[
                      styles.visibilityToggleText,
                      inspection.shared_with_member && styles.visibilityToggleTextActive
                    ]}>
                      {inspection.shared_with_member ? 'Visible to Member' : 'Hidden from Member'}
                    </Text>
                  </TouchableOpacity>

                  {canEdit && (
                    <Button
                      title={isDeleting ? 'Deleting...' : 'Delete Inspection'}
                      onPress={handleDelete}
                      variant="secondary"
                      loading={isDeleting}
                      style={styles.deleteButton}
                    />
                  )}
                </View>
              </Card>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Photo Viewer Modal */}
      <Modal visible={selectedPhotoIndex !== null} animationType="fade" presentationStyle="overFullScreen">
        <SafeAreaView style={styles.photoViewerContainer}>
          <View style={styles.photoViewerHeader}>
            <TouchableOpacity onPress={() => setSelectedPhotoIndex(null)} style={styles.photoViewerClose}>
              <Ionicons name="close" size={28} color={tokens.colors.white} />
            </TouchableOpacity>
            <Text style={styles.photoViewerTitle}>
              {selectedPhotoIndex !== null ? `${selectedPhotoIndex + 1} of ${inspection.photos.length}` : ''}
            </Text>
            <View style={styles.placeholder} />
          </View>
          
          {selectedPhotoIndex !== null && (
            <ScrollView
              contentContainerStyle={styles.photoViewerContent}
              maximumZoomScale={3}
              minimumZoomScale={1}
            >
              <Image 
                source={{ uri: inspection.photos[selectedPhotoIndex] }} 
                style={styles.photoViewerImage}
                resizeMode="contain"
              />
            </ScrollView>
          )}
          
          {inspection.photos.length > 1 && selectedPhotoIndex !== null && (
            <View style={styles.photoNavigation}>
              <TouchableOpacity
                style={[
                  styles.photoNavButton,
                  selectedPhotoIndex === 0 && styles.photoNavButtonDisabled
                ]}
                onPress={() => setSelectedPhotoIndex(Math.max(0, selectedPhotoIndex - 1))}
                disabled={selectedPhotoIndex === 0}
              >
                <Ionicons name="chevron-back" size={24} color={tokens.colors.white} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.photoNavButton,
                  selectedPhotoIndex === inspection.photos.length - 1 && styles.photoNavButtonDisabled
                ]}
                onPress={() => setSelectedPhotoIndex(Math.min(inspection.photos.length - 1, selectedPhotoIndex + 1))}
                disabled={selectedPhotoIndex === inspection.photos.length - 1}
              >
                <Ionicons name="chevron-forward" size={24} color={tokens.colors.white} />
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </>
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
  shareButton: {
    padding: tokens.spacing.xs,
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
  inspectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.md,
  },
  plotInfo: {
    flex: 1,
  },
  plotNumber: {
    fontSize: tokens.typography.sizes.xl,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.text.primary,
  },
  inspectionDate: {
    fontSize: tokens.typography.sizes.md,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.xs,
  },
  plotHolder: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.xs,
  },
  scoreCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: tokens.typography.sizes.xl,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.white,
  },
  scoreLabel: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.white + 'CC',
  },
  assessorInfo: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
    fontStyle: 'italic',
  },
  assessmentGrid: {
    flexDirection: 'row',
    gap: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
  },
  assessmentItem: {
    flex: 1,
  },
  assessmentLabel: {
    fontSize: tokens.typography.sizes.sm,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing.xs,
  },
  actionSection: {
    paddingTop: tokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
  },
  reinspectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: tokens.spacing.sm,
  },
  reinspectText: {
    marginLeft: tokens.spacing.xs,
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
    fontStyle: 'italic',
  },
  issuesContainer: {
    gap: tokens.spacing.sm,
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  issueText: {
    marginLeft: tokens.spacing.sm,
    fontSize: tokens.typography.sizes.md,
    color: tokens.colors.text.primary,
  },
  photosContainer: {
    marginTop: tokens.spacing.sm,
  },
  photoContainer: {
    marginRight: tokens.spacing.sm,
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: tokens.borderRadius.md,
  },
  notesText: {
    fontSize: tokens.typography.sizes.md,
    color: tokens.colors.text.primary,
    lineHeight: 22,
  },
  adminControls: {
    gap: tokens.spacing.md,
  },
  visibilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.borderRadius.md,
    backgroundColor: tokens.colors.surface,
  },
  visibilityToggleActive: {
    borderColor: tokens.colors.primary,
    backgroundColor: tokens.colors.primary + '10',
  },
  visibilityToggleText: {
    marginLeft: tokens.spacing.sm,
    fontSize: tokens.typography.sizes.md,
    color: tokens.colors.text.secondary,
  },
  visibilityToggleTextActive: {
    color: tokens.colors.primary,
    fontWeight: tokens.typography.weights.medium,
  },
  deleteButton: {
    marginTop: tokens.spacing.sm,
  },
  
  // Photo viewer styles
  photoViewerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  photoViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.md,
  },
  photoViewerClose: {
    padding: tokens.spacing.xs,
  },
  photoViewerTitle: {
    fontSize: tokens.typography.sizes.md,
    color: tokens.colors.white,
    fontWeight: tokens.typography.weights.medium,
  },
  photoViewerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoViewerImage: {
    width: '100%',
    height: '100%',
  },
  photoNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xl,
  },
  photoNavButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoNavButtonDisabled: {
    opacity: 0.3,
  },
});