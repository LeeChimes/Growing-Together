import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button, Tag, Avatar, useTheme, ListItem, EmptyState } from '../design';
import {
  useMembers,
  useJoinCodes,
  useApproveMember,
  useUpdateMemberRole,
  useToggleJoinCode,
  useAdminStats,
  useExportData,
  useHideContent,
} from '../hooks/useAdmin';
import { CreateJoinCodeModal } from './CreateJoinCodeModal';
import { CreateEventModal } from './CreateEventModal';
import { CreatePostModal } from './CreatePostModal';
import { AdminDocumentsModal } from './AdminDocumentsModal';
import { TasksGeneratorModal } from './TasksGeneratorModal';

type AdminView = 'dashboard' | 'members' | 'join-codes' | 'content' | 'export';

interface AdminDashboardProps {
  visible: boolean;
  onClose: () => void;
}

export function AdminDashboard({ visible, onClose }: AdminDashboardProps) {
  const theme = useTheme();
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [showCreateJoinCode, setShowCreateJoinCode] = useState(false);
  const [showTasksGenerator, setShowTasksGenerator] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showInspectionsHint] = useState(true);

  // Data hooks
  const { data: stats } = useAdminStats();
  const { data: members = [] } = useMembers();
  const { data: joinCodes = [] } = useJoinCodes();
  
  // Mutation hooks
  const approveMemberMutation = useApproveMember();
  const updateRoleMutation = useUpdateMemberRole();
  const toggleJoinCodeMutation = useToggleJoinCode();
  const exportDataMutation = useExportData();

  const handleApprovalToggle = (userId: string, currentStatus: boolean) => {
    Alert.alert(
      currentStatus ? 'Disapprove Member' : 'Approve Member',
      `Are you sure you want to ${currentStatus ? 'disapprove' : 'approve'} this member?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: currentStatus ? 'Disapprove' : 'Approve',
          style: currentStatus ? 'destructive' : 'default',
          onPress: () => approveMemberMutation.mutate({ userId, approved: !currentStatus }),
        },
      ]
    );
  };

  const handleRoleChange = (userId: string, currentRole: string) => {
    const roles = ['guest', 'member', 'admin'];
    const currentIndex = roles.indexOf(currentRole);
    const newRole = roles[(currentIndex + 1) % roles.length] as 'guest' | 'member' | 'admin';

    Alert.alert(
      'Change Role',
      `Change role from ${currentRole} to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          onPress: () => updateRoleMutation.mutate({ userId, role: newRole }),
        },
      ]
    );
  };

  const handleShareJoinCode = async (code: string) => {
    try {
      await Share.share({
        message: `Join our Growing Together community with code: ${code}`,
        title: 'Growing Together Join Code',
      });
    } catch (error) {
      console.error('Error sharing join code:', error);
    }
  };

  const handleExportData = (dataType: 'all' | 'members' | 'posts' | 'events' | 'tasks' | 'diary') => {
    Alert.alert(
      'Export Data',
      `Export ${dataType === 'all' ? 'all data' : dataType}? This may take a moment.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            try {
              const data = await exportDataMutation.mutateAsync(dataType);
              const jsonString = JSON.stringify(data, null, 2);
              
              // In a real app, you'd save this to a file or send it somewhere
              // For now, we'll just show a success message
              Alert.alert(
                'Export Complete',
                `${dataType} data exported successfully. In a production app, this would be saved as a downloadable file.`,
                [
                  {
                    text: 'Share JSON',
                    onPress: () => Share.share({
                      message: jsonString,
                      title: `Growing Together ${dataType} Export`,
                    }),
                  },
                  { text: 'OK' },
                ]
              );
            } catch (error) {
              Alert.alert('Export Failed', 'Failed to export data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderDashboard = () => (
    <ScrollView style={styles.content}>
      {/* Stats Overview */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <Text style={[styles.statNumber, { color: theme.colors.green }]}>
              {stats?.totalMembers || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.gray }]}>
              Total Members
            </Text>
          </View>
          <Ionicons name="people" size={32} color={theme.colors.green} />
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <Text style={[styles.statNumber, { color: theme.colors.warning }]}>
              {stats?.pendingApprovals || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.gray }]}>
              Pending Approvals
            </Text>
          </View>
          <Ionicons name="hourglass" size={32} color={theme.colors.warning} />
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <Text style={[styles.statNumber, { color: theme.colors.sky }]}>
              {stats?.activeJoinCodes || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.gray }]}>
              Active Join Codes
            </Text>
          </View>
          <Ionicons name="key" size={32} color={theme.colors.sky} />
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <Text style={[styles.statNumber, { color: theme.colors.success }]}>
              {(stats?.totalPosts || 0) + (stats?.totalEvents || 0) + (stats?.totalTasks || 0)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.gray }]}>
              Total Content
            </Text>
          </View>
          <Ionicons name="document-text" size={32} color={theme.colors.success} />
        </Card>
      </View>

      {/* Quick Actions */}
      <Card style={styles.quickActions}>
        <Text style={[styles.sectionTitle, { color: theme.colors.charcoal }]}>
          Quick Actions
        </Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.green + '20' }]}
            onPress={() => setCurrentView('members')}
          >
            <Ionicons name="people" size={24} color={theme.colors.green} />
            <Text style={[styles.actionText, { color: theme.colors.green }]}>
              Manage Members
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.sky + '20' }]}
            onPress={() => setCurrentView('join-codes')}
          >
            <Ionicons name="key" size={24} color={theme.colors.sky} />
            <Text style={[styles.actionText, { color: theme.colors.sky }]}>
              Join Codes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.warning + '20' }]}
            onPress={() => setCurrentView('export')}
          >
            <Ionicons name="download" size={24} color={theme.colors.warning} />
            <Text style={[styles.actionText, { color: theme.colors.warning }]}>
              Export Data
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.error + '20' }]}
            onPress={() => setCurrentView('content')}
          >
            <Ionicons name="shield" size={24} color={theme.colors.error} />
            <Text style={[styles.actionText, { color: theme.colors.error }]}>
              Moderate Content
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.sunflower + '20' }]}
            onPress={() => setShowTasksGenerator(true)}
          >
            <Ionicons name="leaf" size={24} color={theme.colors.sunflower} />
            <Text style={[styles.actionText, { color: theme.colors.sunflower }]}> 
              Tasks Generator
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.sky + '20' }]}
            onPress={() => setShowCreateEvent(true)}
          >
            <Ionicons name="calendar" size={24} color={theme.colors.sky} />
            <Text style={[styles.actionText, { color: theme.colors.sky }]}> 
              Create Event
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.warning + '20' }]}
            onPress={() => setShowAnnouncement(true)}
          >
            <Ionicons name="megaphone" size={24} color={theme.colors.warning} />
            <Text style={[styles.actionText, { color: theme.colors.warning }]}> 
              New Announcement
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.soil + '20' }]}
            onPress={() => setShowDocuments(true)}
          >
            <Ionicons name="document-text" size={24} color={theme.colors.soil} />
            <Text style={[styles.actionText, { color: theme.colors.soil }]}> 
              Documents
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.green + '20' }]}
            onPress={() => {
              // Navigate via a hint; admin can access inspections from its tab/screen
              Alert.alert(
                'Open Plot Inspections',
                'Go to the Inspections tab to start an inspection.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Open Inspections',
                    onPress: () => {
                      // In app navigation, this would route to /inspections
                    },
                  },
                ]
              );
            }}
          >
            <Ionicons name="checkbox" size={24} color={theme.colors.green} />
            <Text style={[styles.actionText, { color: theme.colors.green }]}> 
              Plot Inspections
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    </ScrollView>
  );

  const renderMembers = () => (
    <ScrollView style={styles.content}>
      <View style={styles.membersList}>
        {members.map((member) => (
          <Card key={member.id} style={styles.memberCard}>
            <View style={styles.memberHeader}>
              <Avatar
                name={member.full_name || 'Unknown'}
                imageUri={member.avatar_url ?? undefined}
                size="medium"
              />
              <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: theme.colors.charcoal }]}>
                  {member.full_name || 'Unknown'}
                </Text>
                <Text style={[styles.memberEmail, { color: theme.colors.gray }]}>
                  {member.email}
                </Text>
                <View style={styles.memberMeta}>
                  <Tag
                    label={member.role}
                    variant={member.role === 'admin' ? 'error' : member.role === 'member' ? 'success' : 'default'}
                    size="small"
                  />
                  {member.plot_number && (
                    <Text style={[styles.plotNumber, { color: theme.colors.gray }]}>
                      Plot {member.plot_number}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.memberActions}>
              <Button
                title={member.is_approved ? 'Approved' : 'Approve'}
                variant={member.is_approved ? 'secondary' : 'outline'}
                size="small"
                onPress={() => handleApprovalToggle(member.id, member.is_approved)}
                disabled={approveMemberMutation.isPending}
              />
              <Button
                title={`Role: ${member.role}`}
                variant="outline"
                size="small"
                onPress={() => handleRoleChange(member.id, member.role)}
                disabled={updateRoleMutation.isPending}
              />
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  );

  const renderJoinCodes = () => (
    <ScrollView style={styles.content}>
      <View style={styles.joinCodesHeader}>
        <Button
          title="Create Join Code"
          onPress={() => setShowCreateJoinCode(true)}
        />
      </View>

      <View style={styles.joinCodesList}>
        {joinCodes.map((joinCode) => (
          <Card key={joinCode.id} style={styles.joinCodeCard}>
            <View style={styles.joinCodeHeader}>
              <View style={styles.joinCodeInfo}>
                <Text style={[styles.joinCodeText, { color: theme.colors.charcoal }]}>
                  {joinCode.code}
                </Text>
                <View style={styles.joinCodeMeta}>
                  <Tag
                    label={joinCode.role}
                    variant={joinCode.role === 'admin' ? 'error' : 'success'}
                    size="small"
                  />
                  <Text style={[styles.joinCodeStatus, { color: theme.colors.gray }]}>
                    {joinCode.uses_count || 0}/{joinCode.max_uses || '∞'} uses
                  </Text>
                </View>
              </View>
              <View style={styles.joinCodeActions}>
                <TouchableOpacity
                  onPress={() => handleShareJoinCode(joinCode.code)}
                  style={styles.iconButton}
                >
                  <Ionicons name="share" size={20} color={theme.colors.sky} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => toggleJoinCodeMutation.mutate({
                    id: joinCode.id,
                    isActive: !joinCode.is_active
                  })}
                  style={styles.iconButton}
                >
                  <Ionicons 
                    name={joinCode.is_active ? "toggle" : "toggle-outline"} 
                    size={20} 
                    color={joinCode.is_active ? theme.colors.green : theme.colors.gray} 
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            {joinCode.expires_at && (
              <Text style={[styles.expiryText, { color: theme.colors.warning }]}>
                Expires: {new Date(joinCode.expires_at).toLocaleDateString('en-GB')}
              </Text>
            )}
          </Card>
        ))}
      </View>
    </ScrollView>
  );

  const renderExport = () => (
    <ScrollView style={styles.content}>
      <Card style={styles.exportCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.charcoal }]}>
          Data Export
        </Text>
        <Text style={[styles.exportDescription, { color: theme.colors.gray }]}>
          Export community data in JSON format. Select the type of data you want to export.
        </Text>

        <View style={styles.exportOptions}>
          {[
            { key: 'all', label: 'All Data', icon: 'cloud-download' },
            { key: 'members', label: 'Members', icon: 'people' },
            { key: 'posts', label: 'Posts', icon: 'chatbubbles' },
            { key: 'events', label: 'Events', icon: 'calendar' },
            { key: 'tasks', label: 'Tasks', icon: 'checkmark-circle' },
            { key: 'diary', label: 'Diary Entries', icon: 'book' },
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[styles.exportOption, { borderColor: theme.colors.grayLight }]}
              onPress={() => handleExportData(option.key as any)}
              disabled={exportDataMutation.isPending}
            >
              <Ionicons name={option.icon as any} size={24} color={theme.colors.sky} />
              <Text style={[styles.exportOptionText, { color: theme.colors.charcoal }]}>
                {option.label}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.gray} />
            </TouchableOpacity>
          ))}
        </View>
      </Card>
    </ScrollView>
  );

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Admin Dashboard';
      case 'members': return 'Member Management';
      case 'join-codes': return 'Join Codes';
      case 'content': return 'Content Moderation';
      case 'export': return 'Data Export';
      default: return 'Admin Dashboard';
    }
  };

  if (!visible) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: theme.colors.grayLight }]}>
        <TouchableOpacity 
          onPress={currentView === 'dashboard' ? onClose : () => setCurrentView('dashboard')}
        >
          <Ionicons 
            name={currentView === 'dashboard' ? "close" : "arrow-back"} 
            size={24} 
            color={theme.colors.charcoal} 
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.charcoal }]}>
          {getViewTitle()}
        </Text>
        <View style={styles.headerActions}>
          {currentView === 'dashboard' && (
            <Ionicons name="shield-checkmark" size={24} color={theme.colors.success} />
          )}
        </View>
      </View>

      {currentView === 'dashboard' && renderDashboard()}
      {currentView === 'members' && renderMembers()}
      {currentView === 'join-codes' && renderJoinCodes()}
      {currentView === 'export' && renderExport()}

      <CreateJoinCodeModal
        visible={showCreateJoinCode}
        onClose={() => setShowCreateJoinCode(false)}
      />

      <TasksGeneratorModal
        visible={showTasksGenerator}
        onClose={() => setShowTasksGenerator(false)}
      />

      <CreateEventModal
        visible={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
      />

      <CreatePostModal
        visible={showAnnouncement}
        onClose={() => setShowAnnouncement(false)}
        defaultAnnouncement
      />

      <AdminDocumentsModal
        visible={showDocuments}
        onClose={() => setShowDocuments(false)}
      />
    </SafeAreaView>
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
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    width: 24,
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  // Dashboard styles
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Members styles
  membersList: {
    gap: 12,
  },
  memberCard: {
    padding: 16,
  },
  memberHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plotNumber: {
    fontSize: 12,
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  // Join codes styles
  joinCodesHeader: {
    marginBottom: 16,
  },
  joinCodesList: {
    gap: 12,
  },
  joinCodeCard: {
    padding: 16,
  },
  joinCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  joinCodeInfo: {
    flex: 1,
  },
  joinCodeText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  joinCodeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  joinCodeStatus: {
    fontSize: 12,
  },
  joinCodeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  expiryText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  // Export styles
  exportCard: {
    padding: 16,
  },
  exportDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  exportOptions: {
    gap: 8,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    gap: 12,
  },
  exportOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
});