import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRulesStats, useRuleAcknowledgments, useRules } from '../hooks/useRules';
import { Card } from '../design/Card';
import { Tag } from '../design/Tag';
import { tokens } from '../design/tokens';
import { Ionicons } from '@expo/vector-icons';

interface RulesStatsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const RulesStatsModal: React.FC<RulesStatsModalProps> = ({
  visible,
  onClose,
}) => {
  const { data: rules } = useRules();
  const { data: stats } = useRulesStats();
  const { data: acknowledgments = [] } = useRuleAcknowledgments(rules?.id);

  const renderProgressBar = (value: number, total: number) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${percentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(percentage)}%
        </Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={tokens.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Rules Statistics</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Overview Stats */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Acknowledgment Overview</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats?.totalMembers || 0}</Text>
                <Text style={styles.statLabel}>Total Members</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: tokens.colors.success }]}>
                  {stats?.acknowledgedCount || 0}
                </Text>
                <Text style={styles.statLabel}>Acknowledged</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: tokens.colors.warning }]}>
                  {stats?.pendingCount || 0}
                </Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Acknowledgment Progress</Text>
                <Text style={styles.progressPercentage}>
                  {Math.round(stats?.acknowledgmentRate || 0)}%
                </Text>
              </View>
              {renderProgressBar(stats?.acknowledgedCount || 0, stats?.totalMembers || 0)}
            </View>
          </Card>

          {/* Rules Info */}
          {rules && (
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Current Rules Version</Text>
              
              <View style={styles.rulesInfo}>
                <View style={styles.rulesInfoRow}>
                  <Text style={styles.rulesInfoLabel}>Version:</Text>
                  <Tag label={`v${rules.version}`} variant="default" size="small" />
                </View>
                
                <View style={styles.rulesInfoRow}>
                  <Text style={styles.rulesInfoLabel}>Published:</Text>
                  <Text style={styles.rulesInfoValue}>
                    {new Date(rules.published_at).toLocaleDateString('en-GB', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                
                {rules.summary && (
                  <View style={styles.rulesInfoRow}>
                    <Text style={styles.rulesInfoLabel}>Summary:</Text>
                    <Text style={styles.rulesInfoValue}>{rules.summary}</Text>
                  </View>
                )}
              </View>
            </Card>
          )}

          {/* Recent Acknowledgments */}
          {acknowledgments.length > 0 && (
            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Acknowledgments</Text>
              
              <View style={styles.acknowledgmentsList}>
                {acknowledgments.slice(0, 10).map((ack, index) => (
                  <View key={ack.id} style={styles.acknowledgmentItem}>
                    <View style={styles.acknowledgmentInfo}>
                      <Text style={styles.acknowledgmentName}>
                        {(ack as any).profiles?.full_name || 'Unknown User'}
                      </Text>
                      <Text style={styles.acknowledgmentDate}>
                        {new Date(ack.acknowledged_at).toLocaleDateString('en-GB')}
                      </Text>
                    </View>
                    <Ionicons 
                      name="checkmark-circle" 
                      size={20} 
                      color={tokens.colors.success} 
                    />
                  </View>
                ))}
                
                {acknowledgments.length > 10 && (
                  <Text style={styles.acknowledgmentsMore}>
                    +{acknowledgments.length - 10} more acknowledgments
                  </Text>
                )}
              </View>
            </Card>
          )}

          {/* Actions */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            
            <View style={styles.actionsList}>
              <TouchableOpacity style={styles.actionItem}>
                <View style={styles.actionIcon}>
                  <Ionicons name="download-outline" size={20} color={tokens.colors.primary} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Export Acknowledgments</Text>
                  <Text style={styles.actionDescription}>
                    Download a list of all member acknowledgments
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={tokens.colors.text.secondary} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionItem}>
                <View style={styles.actionIcon}>
                  <Ionicons name="mail-outline" size={20} color={tokens.colors.primary} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>Send Reminders</Text>
                  <Text style={styles.actionDescription}>
                    Notify members who haven't acknowledged yet
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={tokens.colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </Card>
        </ScrollView>
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
  
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: tokens.spacing.md,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.borderRadius.md,
  },
  statValue: {
    fontSize: tokens.typography.sizes.xl,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.text.primary,
  },
  statLabel: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.xs,
    textAlign: 'center',
  },
  
  // Progress
  progressSection: {
    paddingTop: tokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  progressLabel: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.colors.text.primary,
  },
  progressPercentage: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.primary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: tokens.colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: tokens.colors.success,
    borderRadius: 4,
  },
  progressText: {
    fontSize: tokens.typography.sizes.sm,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.colors.text.secondary,
    minWidth: 40,
    textAlign: 'right',
  },
  
  // Rules Info
  rulesInfo: {
    gap: tokens.spacing.md,
  },
  rulesInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  rulesInfoLabel: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.colors.text.secondary,
    minWidth: 80,
  },
  rulesInfoValue: {
    fontSize: tokens.typography.sizes.md,
    color: tokens.colors.text.primary,
    flex: 1,
  },
  
  // Acknowledgments List
  acknowledgmentsList: {
    gap: tokens.spacing.sm,
  },
  acknowledgmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.borderRadius.md,
  },
  acknowledgmentInfo: {
    flex: 1,
  },
  acknowledgmentName: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.colors.text.primary,
  },
  acknowledgmentDate: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.xs,
  },
  acknowledgmentsMore: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: tokens.spacing.sm,
  },
  
  // Actions
  actionsList: {
    gap: tokens.spacing.xs,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.md,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.borderRadius.md,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: tokens.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: tokens.spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.colors.text.primary,
  },
  actionDescription: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.xs,
  },
});