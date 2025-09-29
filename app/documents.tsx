import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMyDocuments, useDocumentsRequiringAttention, useDeleteDocument, useDownloadDocument } from '../src/hooks/useDocuments';
import { useAuthStore } from '../src/store/authStore';
import { UploadDocumentModal } from '../src/components/UploadDocumentModal';
import { AdminDocumentsModal } from '../src/components/AdminDocumentsModal';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { OptimizedList } from '../src/components/OptimizedList';
import { Button } from '../src/design/Button';
import { Card } from '../src/design/Card';
import { Tag } from '../src/design/Tag';
import { FAB } from '../src/design/FAB';
import { tokens } from '../src/design/tokens';
import { UserDocumentT, DOCUMENT_TYPE_LABELS, getFileInfo, formatFileSize, getDocumentStatus, getDocumentStatusColor } from '../src/types/documents';
import { Ionicons } from '@expo/vector-icons';

export default function DocumentsScreen() {
  const { user } = useAuthStore();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<UserDocumentT | null>(null);

  const isAdmin = user?.role === 'admin';

  // Hooks
  const { data: myDocuments = [], isLoading: loadingDocuments } = useMyDocuments();
  const { data: attentionDocuments = [] } = useDocumentsRequiringAttention();
  const deleteDocumentMutation = useDeleteDocument();
  const downloadDocumentMutation = useDownloadDocument();

  const handleDownloadDocument = async (document: UserDocumentT) => {
    try {
      await downloadDocumentMutation.mutateAsync(document);
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to open document. Please try again.');
    }
  };

  const handleDeleteDocument = (document: UserDocumentT) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${document.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDocumentMutation.mutateAsync(document.id!);
              Alert.alert('Success', 'Document deleted successfully.');
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete document.');
            }
          },
        },
      ]
    );
  };

  const renderDocumentCard = ({ item: document }: { item: UserDocumentT }) => {
    const fileInfo = getFileInfo(document.mime_type || '');
    const status = getDocumentStatus(document.expires_at);
    const statusColor = getDocumentStatusColor(status);

    return (
      <TouchableOpacity
        onPress={() => handleDownloadDocument(document)}
        onLongPress={() => setSelectedDocument(document)}
        style={styles.documentCard}
      >
        <Card style={styles.cardContent}>
          <View style={styles.documentHeader}>
            <View style={styles.documentIconContainer}>
              <Ionicons 
                name={fileInfo.icon as any} 
                size={24} 
                color={fileInfo.color} 
              />
            </View>
            
            <View style={styles.documentInfo}>
              <Text style={styles.documentTitle} numberOfLines={1}>
                {document.title}
              </Text>
              <View style={styles.documentMeta}>
                <Tag 
                  label={DOCUMENT_TYPE_LABELS[document.type]} 
                  variant="default" 
                  size="small"
                />
                <Text style={styles.documentSize}>
                  {document.file_size ? formatFileSize(document.file_size) : 'Unknown size'}
                </Text>
              </View>
            </View>

            <View style={styles.documentActions}>
              {document.expires_at && (
                <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
              )}
              <TouchableOpacity
                onPress={() => setSelectedDocument(document)}
                style={styles.moreButton}
              >
                <Ionicons name="ellipsis-vertical" size={16} color={tokens.colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.documentDetails}>
            <Text style={styles.documentFileName} numberOfLines={1}>
              {document.file_name}
            </Text>
            <Text style={styles.uploadDate}>
              Uploaded: {new Date(document.created_at).toLocaleDateString()}
            </Text>
            {document.expires_at && (
              <View style={styles.expiryInfo}>
                <Ionicons 
                  name="calendar" 
                  size={14} 
                  color={status === 'expired' ? tokens.colors.danger : 
                         status === 'expiring' ? tokens.colors.warning : 
                         tokens.colors.text.secondary} 
                />
                <Text style={[
                  styles.expiryText,
                  { color: status === 'expired' ? tokens.colors.danger : 
                           status === 'expiring' ? tokens.colors.warning : 
                           tokens.colors.text.secondary }
                ]}>
                  {status === 'expired' ? 'Expired' : 
                   status === 'expiring' ? 'Expires soon' : 
                   'Valid'}: {new Date(document.expires_at).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderAttentionCard = () => {
    if (attentionDocuments.length === 0) return null;

    return (
      <Card style={styles.attentionCard}>
        <View style={styles.attentionHeader}>
          <View style={styles.attentionIconContainer}>
            <Ionicons name="warning" size={20} color={tokens.colors.warning} />
          </View>
          <View style={styles.attentionContent}>
            <Text style={styles.attentionTitle}>Documents Require Attention</Text>
            <Text style={styles.attentionDescription}>
              {attentionDocuments.length} document{attentionDocuments.length !== 1 ? 's' : ''} 
              {attentionDocuments.some(doc => (doc as any).status === 'expired') ? ' expired or' : ''} expiring soon
            </Text>
          </View>
        </View>
        
        <View style={styles.attentionList}>
          {attentionDocuments.slice(0, 3).map((document, index) => {
            const doc = document as UserDocumentT & { status: string };
            return (
              <View key={document.id} style={styles.attentionItem}>
                <Text style={styles.attentionItemTitle} numberOfLines={1}>
                  {document.title}
                </Text>
                <Tag 
                  label={doc.status === 'expired' ? 'Expired' : 'Expires Soon'} 
                  variant={doc.status === 'expired' ? 'error' : 'warning'} 
                  size="small"
                />
              </View>
            );
          })}
          
          {attentionDocuments.length > 3 && (
            <Text style={styles.attentionMore}>
              +{attentionDocuments.length - 3} more documents need attention
            </Text>
          )}
        </View>
      </Card>
    );
  };

  const renderDocumentStats = () => {
    const contractDocs = myDocuments.filter(doc => doc.type === 'contract');
    const idDocs = myDocuments.filter(doc => doc.type === 'id');
    const otherDocs = myDocuments.filter(doc => doc.type === 'other');

    return (
      <Card style={styles.statsCard}>
        <Text style={styles.statsTitle}>My Documents</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{contractDocs.length}</Text>
            <Text style={styles.statLabel}>Contracts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{idDocs.length}</Text>
            <Text style={styles.statLabel}>ID Documents</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{otherDocs.length}</Text>
            <Text style={styles.statLabel}>Other</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{myDocuments.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Documents</Text>
          {isAdmin && (
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => setShowAdminModal(true)}
            >
              <Ionicons name="people-outline" size={20} color={tokens.colors.primary} />
              <Text style={styles.adminButtonText}>Manage</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Attention Card */}
          {renderAttentionCard()}

          {/* Stats Card */}
          {myDocuments.length > 0 && renderDocumentStats()}

          {/* Documents List */}
          {myDocuments.length === 0 && !loadingDocuments ? (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open" size={64} color={tokens.colors.text.secondary} />
              <Text style={styles.emptyStateTitle}>No Documents Yet</Text>
              <Text style={styles.emptyStateDescription}>
                Upload your first document to get started. You can store contracts, ID documents, and other important files.
              </Text>
              <Button
                title="Upload Document"
                onPress={() => setShowUploadModal(true)}
                style={styles.emptyStateButton}
              />
            </View>
          ) : (
            <View style={styles.documentsContainer}>
              <OptimizedList
                data={myDocuments}
                renderItem={renderDocumentCard}
                keyExtractor={(item) => item.id || ''}
                loading={loadingDocuments}
                contentContainerStyle={styles.listContent}
              />
            </View>
          )}
        </ScrollView>

        {/* Upload FAB */}
        {myDocuments.length > 0 && (
          <FAB
            icon="add"
            onPress={() => setShowUploadModal(true)}
            style={styles.fab}
          />
        )}

        {/* Modals */}
        <UploadDocumentModal
          visible={showUploadModal}
          onClose={() => setShowUploadModal(false)}
        />

        <AdminDocumentsModal
          visible={showAdminModal}
          onClose={() => setShowAdminModal(false)}
        />

        {/* Document Actions Modal */}
        {selectedDocument && (
          <DocumentActionsModal
            document={selectedDocument}
            visible={!!selectedDocument}
            onClose={() => setSelectedDocument(null)}
            onDownload={() => {
              handleDownloadDocument(selectedDocument);
              setSelectedDocument(null);
            }}
            onDelete={() => {
              handleDeleteDocument(selectedDocument);
              setSelectedDocument(null);
            }}
          />
        )}
      </SafeAreaView>
    </ErrorBoundary>
  );
}

// Document Actions Modal Component
interface DocumentActionsModalProps {
  document: UserDocumentT;
  visible: boolean;
  onClose: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

const DocumentActionsModal: React.FC<DocumentActionsModalProps> = ({
  document,
  visible,
  onClose,
  onDownload,
  onDelete,
}) => {
  const fileInfo = getFileInfo(document.mime_type || '');
  const status = getDocumentStatus(document.expires_at);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <SafeAreaView style={styles.actionModalContainer}>
        <View style={styles.actionModalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={tokens.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.actionModalTitle}>Document Actions</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.actionModalContent}>
          <View style={styles.documentPreview}>
            <View style={styles.documentIconContainer}>
              <Ionicons name={fileInfo.icon as any} size={32} color={fileInfo.color} />
            </View>
            <View style={styles.documentPreviewInfo}>
              <Text style={styles.documentPreviewTitle}>{document.title}</Text>
              <Text style={styles.documentPreviewFileName}>{document.file_name}</Text>
              <View style={styles.documentPreviewMeta}>
                <Tag label={DOCUMENT_TYPE_LABELS[document.type]} variant="default" size="small" />
                {document.expires_at && (
                  <Tag 
                    label={status === 'expired' ? 'Expired' : status === 'expiring' ? 'Expires Soon' : 'Valid'} 
                    variant={status === 'expired' ? 'error' : status === 'expiring' ? 'warning' : 'success'} 
                    size="small"
                  />
                )}
              </View>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <Button
              title="View/Download"
              onPress={onDownload}
              style={styles.actionButton}
            />
            
            <Button
              title="Delete Document"
              onPress={onDelete}
              variant="outline"
              style={styles.actionButton}
            />
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  title: {
    fontSize: tokens.typography.sizes.xl,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.text.primary,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.borderRadius.md,
    borderWidth: 1,
    borderColor: tokens.colors.primary,
  },
  adminButtonText: {
    marginLeft: tokens.spacing.xs,
    color: tokens.colors.primary,
    fontSize: tokens.typography.sizes.sm,
    fontWeight: tokens.typography.weights.medium,
  },
  content: {
    flex: 1,
  },
  
  // Attention Card
  attentionCard: {
    margin: tokens.spacing.md,
    backgroundColor: tokens.colors.warning + '10',
    borderColor: tokens.colors.warning + '40',
  },
  attentionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.md,
  },
  attentionIconContainer: {
    marginRight: tokens.spacing.sm,
    marginTop: 2,
  },
  attentionContent: {
    flex: 1,
  },
  attentionTitle: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.semiBold,
    color: tokens.colors.text.primary,
  },
  attentionDescription: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.xs,
  },
  attentionList: {
    gap: tokens.spacing.sm,
  },
  attentionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attentionItemTitle: {
    flex: 1,
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.primary,
    marginRight: tokens.spacing.sm,
  },
  attentionMore: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
    fontStyle: 'italic',
  },
  
  // Stats Card
  statsCard: {
    margin: tokens.spacing.md,
    marginTop: 0,
  },
  statsTitle: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.semiBold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: tokens.typography.sizes.xl,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.primary,
  },
  statLabel: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.xs,
    textAlign: 'center',
  },
  
  // Documents
  documentsContainer: {
    flex: 1,
  },
  documentCard: {
    marginHorizontal: tokens.spacing.md,
    marginVertical: tokens.spacing.xs,
  },
  cardContent: {
    padding: tokens.spacing.md,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.sm,
  },
  documentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: tokens.borderRadius.md,
    backgroundColor: tokens.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: tokens.spacing.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.semiBold,
    color: tokens.colors.text.primary,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.xs,
  },
  documentSize: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
  },
  documentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  moreButton: {
    padding: tokens.spacing.xs,
  },
  documentDetails: {
    gap: tokens.spacing.xs,
  },
  documentFileName: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
  },
  uploadDate: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  expiryText: {
    fontSize: tokens.typography.sizes.sm,
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.xl,
    marginTop: tokens.spacing.xl * 2,
  },
  emptyStateTitle: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.semiBold,
    color: tokens.colors.text.primary,
    textAlign: 'center',
    marginTop: tokens.spacing.md,
  },
  emptyStateDescription: {
    fontSize: tokens.typography.sizes.md,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
    marginTop: tokens.spacing.sm,
    lineHeight: 22,
  },
  emptyStateButton: {
    marginTop: tokens.spacing.lg,
  },
  
  // List
  listContent: {
    paddingBottom: 100,
  },
  
  // FAB
  fab: {
    position: 'absolute',
    bottom: tokens.spacing.xl,
    right: tokens.spacing.xl,
  },
  
  // Action Modal
  actionModalContainer: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  actionModalHeader: {
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
  actionModalTitle: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.text.primary,
  },
  placeholder: {
    width: 32,
  },
  actionModalContent: {
    flex: 1,
    padding: tokens.spacing.md,
  },
  documentPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.xl,
  },
  documentPreviewInfo: {
    flex: 1,
  },
  documentPreviewTitle: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.semiBold,
    color: tokens.colors.text.primary,
  },
  documentPreviewFileName: {
    fontSize: tokens.typography.sizes.md,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.xs,
  },
  documentPreviewMeta: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.sm,
  },
  actionButtons: {
    gap: tokens.spacing.md,
  },
  actionButton: {
    width: '100%',
  },
});