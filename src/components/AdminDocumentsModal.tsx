import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUsersWithDocuments, useUserDocuments } from '../hooks/useDocuments';
import { UploadDocumentModal } from './UploadDocumentModal';
import { OptimizedList } from './OptimizedList';
import { Button } from '../design/Button';
import { Card } from '../design/Card';
import { Tag } from '../design/Tag';
import { tokens } from '../design/tokens';
import { getDocumentStatus } from '../types/documents';
import { Ionicons } from '@expo/vector-icons';

interface AdminDocumentsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AdminDocumentsModal: React.FC<AdminDocumentsModalProps> = ({
  visible,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const { data: usersWithDocs = [], isLoading } = useUsersWithDocuments();
  const { data: selectedUserDocs = [] } = useUserDocuments(selectedUserId || undefined);

  // Filter users based on search query
  const filteredUsers = usersWithDocs.filter(user =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.plot_number?.toString().includes(searchQuery)
  );

  const renderUserCard = ({ item: user }: { item: any }) => {
    const hasIssues = user.documentStats.expiredCount > 0 || user.documentStats.expiringCount > 0;
    
    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => setSelectedUserId(user.id)}
      >
        <Card style={styles.userCardContent}>
          <View style={styles.userHeader}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.full_name || 'Unnamed User'}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              {user.plot_number && (
                <Text style={styles.userPlot}>Plot {user.plot_number}</Text>
              )}
            </View>
            
            {hasIssues && (
              <View style={styles.warningIndicator}>
                <Ionicons name="warning" size={16} color={tokens.colors.warning} />
              </View>
            )}
          </View>

          <View style={styles.documentStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.documentStats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            
            <View style={styles.statSeparator} />
            
            <View style={styles.statItem}>
              <Text style={[
                styles.statValue, 
                { color: user.documentStats.hasContract ? tokens.colors.success : tokens.colors.text.secondary }
              ]}>
                {user.documentStats.hasContract ? '✓' : '✗'}
              </Text>
              <Text style={styles.statLabel}>Contract</Text>
            </View>
            
            <View style={styles.statSeparator} />
            
            <View style={styles.statItem}>
              <Text style={[
                styles.statValue, 
                { color: user.documentStats.hasId ? tokens.colors.success : tokens.colors.text.secondary }
              ]}>
                {user.documentStats.hasId ? '✓' : '✗'}
              </Text>
              <Text style={styles.statLabel}>ID</Text>
            </View>
            
            {hasIssues && (
              <>
                <View style={styles.statSeparator} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: tokens.colors.warning }]}>
                    {user.documentStats.expiredCount + user.documentStats.expiringCount}
                  </Text>
                  <Text style={styles.statLabel}>Issues</Text>
                </View>
              </>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderUserDocuments = () => {
    if (!selectedUserId) return null;

    const selectedUser = usersWithDocs.find(u => u.id === selectedUserId);
    
    return (
      <View style={styles.userDocsContainer}>
        <View style={styles.userDocsHeader}>
          <TouchableOpacity
            onPress={() => setSelectedUserId(null)}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={20} color={tokens.colors.primary} />
            <Text style={styles.backButtonText}>Back to Users</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setShowUploadModal(true)}
            style={styles.uploadButton}
          >
            <Ionicons name="add" size={16} color={tokens.colors.primary} />
            <Text style={styles.uploadButtonText}>Upload</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.selectedUserCard}>
          <Text style={styles.selectedUserName}>
            {selectedUser?.full_name || 'Unknown User'}
          </Text>
          <Text style={styles.selectedUserEmail}>{selectedUser?.email}</Text>
          {selectedUser?.plot_number && (
            <Text style={styles.selectedUserPlot}>Plot {selectedUser.plot_number}</Text>
          )}
        </Card>

        <View style={styles.documentsSection}>
          <Text style={styles.documentsSectionTitle}>
            Documents ({selectedUserDocs.length})
          </Text>
          
          {selectedUserDocs.length === 0 ? (
            <View style={styles.emptyDocs}>
              <Ionicons name="folder-open" size={48} color={tokens.colors.text.secondary} />
              <Text style={styles.emptyDocsText}>No documents uploaded</Text>
              <Button
                title="Upload First Document"
                onPress={() => setShowUploadModal(true)}
                size="small"
                style={styles.emptyDocsButton}
              />
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedUserDocs.map((doc) => {
                const status = getDocumentStatus(doc.expires_at);
                
                return (
                  <Card key={doc.id} style={styles.documentCard}>
                    <View style={styles.documentHeader}>
                      <Text style={styles.documentTitle}>{doc.title}</Text>
                      {doc.expires_at && (
                <Tag
                  label={status === 'expired' ? 'Expired' : status === 'expiring' ? 'Expires Soon' : 'Valid'}
                  variant={status === 'expired' ? 'error' : status === 'expiring' ? 'warning' : 'success'}
                  size="small"
                />
                      )}
                    </View>
                    
                    <Text style={styles.documentFileName}>{doc.file_name}</Text>
                    <Text style={styles.documentDate}>
                      Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                    </Text>
                  </Card>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    );
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={tokens.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>Member Documents</Text>
            <View style={styles.placeholder} />
          </View>

          {selectedUserId ? (
            renderUserDocuments()
          ) : (
            <View style={styles.content}>
              {/* Search */}
              <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                  <Ionicons name="search" size={20} color={tokens.colors.text.secondary} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search members..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor={tokens.colors.text.secondary}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close" size={20} color={tokens.colors.text.secondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Summary Stats */}
              <Card style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Document Overview</Text>
                <View style={styles.summaryStats}>
                  <View style={styles.summaryStatItem}>
                    <Text style={styles.summaryStatValue}>{filteredUsers.length}</Text>
                    <Text style={styles.summaryStatLabel}>Members</Text>
                  </View>
                  
                  <View style={styles.summaryStatItem}>
                    <Text style={[styles.summaryStatValue, { color: tokens.colors.warning }]}>
                      {filteredUsers.reduce((sum, user) => 
                        sum + user.documentStats.expiredCount + user.documentStats.expiringCount, 0
                      )}
                    </Text>
                    <Text style={styles.summaryStatLabel}>Issues</Text>
                  </View>
                  
                  <View style={styles.summaryStatItem}>
                    <Text style={[styles.summaryStatValue, { color: tokens.colors.success }]}>
                      {filteredUsers.filter(user => user.documentStats.hasContract).length}
                    </Text>
                    <Text style={styles.summaryStatLabel}>With Contract</Text>
                  </View>
                </View>
              </Card>

              {/* Users List */}
              <View style={styles.usersList}>
                <OptimizedList
                  data={filteredUsers}
                  renderItem={renderUserCard}
                  keyExtractor={(item) => item.id}
                  loading={isLoading}
                  contentContainerStyle={styles.listContent}
                />
              </View>
            </View>
          )}

          <UploadDocumentModal
            visible={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            userId={selectedUserId || undefined}
          />
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
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  
  // Search
  searchContainer: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.borderRadius.md,
    gap: tokens.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: tokens.typography.sizes.md,
    color: tokens.colors.text.primary,
  },
  
  // Summary
  summaryCard: {
    margin: tokens.spacing.md,
    marginTop: 0,
  },
  summaryTitle: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.semiBold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.md,
  },
  summaryStats: {
    flexDirection: 'row',
    gap: tokens.spacing.lg,
  },
  summaryStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: tokens.typography.sizes.xl,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.text.primary,
  },
  summaryStatLabel: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.xs,
    textAlign: 'center',
  },
  
  // Users List
  usersList: {
    flex: 1,
  },
  userCard: {
    marginHorizontal: tokens.spacing.md,
    marginVertical: tokens.spacing.xs,
  },
  userCardContent: {
    padding: tokens.spacing.md,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.semiBold,
    color: tokens.colors.text.primary,
  },
  userEmail: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.xs,
  },
  userPlot: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.primary,
    marginTop: tokens.spacing.xs,
  },
  warningIndicator: {
    padding: tokens.spacing.xs,
  },
  documentStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.text.primary,
  },
  statLabel: {
    fontSize: tokens.typography.sizes.xs,
    color: tokens.colors.text.secondary,
    marginTop: 2,
  },
  statSeparator: {
    width: 1,
    height: 24,
    backgroundColor: tokens.colors.border,
    marginHorizontal: tokens.spacing.md,
  },
  listContent: {
    paddingBottom: tokens.spacing.xl,
  },
  
  // User Documents View
  userDocsContainer: {
    flex: 1,
  },
  userDocsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    marginLeft: tokens.spacing.xs,
    color: tokens.colors.primary,
    fontSize: tokens.typography.sizes.md,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.borderRadius.md,
    borderWidth: 1,
    borderColor: tokens.colors.primary,
  },
  uploadButtonText: {
    marginLeft: tokens.spacing.xs,
    color: tokens.colors.primary,
    fontSize: tokens.typography.sizes.sm,
  },
  selectedUserCard: {
    margin: tokens.spacing.md,
  },
  selectedUserName: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.text.primary,
  },
  selectedUserEmail: {
    fontSize: tokens.typography.sizes.md,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.xs,
  },
  selectedUserPlot: {
    fontSize: tokens.typography.sizes.md,
    color: tokens.colors.primary,
    marginTop: tokens.spacing.xs,
  },
  documentsSection: {
    flex: 1,
    paddingHorizontal: tokens.spacing.md,
  },
  documentsSectionTitle: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.semiBold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.md,
  },
  documentCard: {
    marginBottom: tokens.spacing.sm,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  documentTitle: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.colors.text.primary,
    flex: 1,
    marginRight: tokens.spacing.sm,
  },
  documentFileName: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
  },
  documentDate: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.xs,
  },
  emptyDocs: {
    alignItems: 'center',
    paddingVertical: tokens.spacing.xl * 2,
  },
  emptyDocsText: {
    fontSize: tokens.typography.sizes.md,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.md,
  },
  emptyDocsButton: {
    marginTop: tokens.spacing.lg,
  },
});