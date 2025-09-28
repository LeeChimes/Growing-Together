import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInspections, usePlots, useMyPlotInspections } from '../src/hooks/useInspections';
import { useAuthStore } from '../src/store/authStore';
import { CreateInspectionModal } from '../src/components/CreateInspectionModal';
import { InspectionDetailModal } from '../src/components/InspectionDetailModal';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { OptimizedList } from '../src/components/OptimizedList';
import { FAB } from '../src/design/FAB';
import { Card } from '../src/design/Card';
import { Tag } from '../src/design/Tag';
import { tokens } from '../src/design/tokens';
import { InspectionT, getScoreColor, getActionSeverity, ACTION_LABELS, USE_STATUS_LABELS, UPKEEP_LABELS } from '../src/types/inspections';
import { Ionicons } from '@expo/vector-icons';

interface FilterState {
  action: string;
  plotId: string;
  dateFrom: string;
  dateTo: string;
}

export default function InspectionsScreen() {
  const { user } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<InspectionT | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    action: 'all',
    plotId: '',
    dateFrom: '',
    dateTo: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const isAdmin = user?.role === 'admin';
  
  // Hooks
  const { data: inspections = [], isLoading: loadingInspections } = useInspections(
    isAdmin ? {
      action: filters.action === 'all' ? undefined : filters.action,
      plotId: filters.plotId || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    } : undefined
  );
  
  const { data: myPlotInspections = [], isLoading: loadingMyInspections } = useMyPlotInspections();
  const { data: plots = [] } = usePlots();

  const displayData = isAdmin ? inspections : myPlotInspections;
  const isLoading = isAdmin ? loadingInspections : loadingMyInspections;

  const renderInspectionCard = ({ item: inspection }: { item: InspectionT }) => {
    const plot = plots.find(p => p.id === inspection.plot_id);
    const scoreColor = getScoreColor(inspection.score);
    const actionSeverity = getActionSeverity(inspection.action);

    return (
      <TouchableOpacity
        onPress={() => setSelectedInspection(inspection)}
        style={styles.inspectionCard}
      >
        <Card style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.plotInfo}>
              <Text style={styles.plotNumber}>Plot {plot?.number || 'N/A'}</Text>
              <Text style={styles.inspectionDate}>
                {new Date(inspection.date).toLocaleDateString()}
              </Text>
            </View>
            <View style={[styles.scoreCircle, { backgroundColor: scoreColor }]}>
              <Text style={styles.scoreText}>{inspection.score}</Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <Tag
              text={USE_STATUS_LABELS[inspection.use_status as keyof typeof USE_STATUS_LABELS]}
              variant="outline"
              size="small"
            />
            <Tag
              text={UPKEEP_LABELS[inspection.upkeep as keyof typeof UPKEEP_LABELS]}
              variant="outline"
              size="small"
            />
          </View>

          {inspection.action !== 'none' && (
            <View style={styles.actionRow}>
              <Tag
                text={ACTION_LABELS[inspection.action as keyof typeof ACTION_LABELS]}
                variant={actionSeverity === 'critical' ? 'danger' : actionSeverity === 'high' ? 'warning' : 'default'}
                size="small"
              />
            </View>
          )}

          {inspection.issues.length > 0 && (
            <View style={styles.issuesRow}>
              <Ionicons name="warning" size={16} color={tokens.colors.warning} />
              <Text style={styles.issuesText}>
                {inspection.issues.length} issue{inspection.issues.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {inspection.notes && (
            <Text style={styles.notesText} numberOfLines={2}>
              {inspection.notes}
            </Text>
          )}

          {inspection.reinspect_by && (
            <View style={styles.reinspectRow}>
              <Ionicons name="time" size={16} color={tokens.colors.text.secondary} />
              <Text style={styles.reinspectText}>
                Reinspect by: {new Date(inspection.reinspect_by).toLocaleDateString()}
              </Text>
            </View>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  const renderFilterButton = () => (
    <TouchableOpacity
      style={styles.filterButton}
      onPress={() => setShowFilters(!showFilters)}
    >
      <Ionicons 
        name={showFilters ? "filter" : "filter-outline"} 
        size={20} 
        color={tokens.colors.primary} 
      />
      <Text style={styles.filterButtonText}>Filters</Text>
    </TouchableOpacity>
  );

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isAdmin ? 'Plot Inspections' : 'My Plot Inspections'}
          </Text>
          {isAdmin && renderFilterButton()}
        </View>

        {showFilters && isAdmin && (
          <Card style={styles.filtersCard}>
            <Text style={styles.filtersTitle}>Filters</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterRow}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    filters.action === 'all' && styles.filterChipActive
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, action: 'all' }))}
                >
                  <Text style={[
                    styles.filterChipText,
                    filters.action === 'all' && styles.filterChipTextActive
                  ]}>
                    All Actions
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    filters.action === 'warning' && styles.filterChipActive
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, action: 'warning' }))}
                >
                  <Text style={[
                    styles.filterChipText,
                    filters.action === 'warning' && styles.filterChipTextActive
                  ]}>
                    Warnings
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    filters.action === 'final_warning' && styles.filterChipActive
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, action: 'final_warning' }))}
                >
                  <Text style={[
                    styles.filterChipText,
                    filters.action === 'final_warning' && styles.filterChipTextActive
                  ]}>
                    Final Warnings
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Card>
        )}

        <View style={styles.content}>
          {displayData.length === 0 && !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="clipboard" size={64} color={tokens.colors.text.secondary} />
              <Text style={styles.emptyStateTitle}>
                {isAdmin ? 'No Inspections Yet' : 'No Inspections for Your Plot'}
              </Text>
              <Text style={styles.emptyStateDescription}>
                {isAdmin 
                  ? 'Create your first plot inspection to get started.'
                  : 'No inspections have been recorded for your plot yet.'
                }
              </Text>
            </View>
          ) : (
            <OptimizedList
              data={displayData}
              renderItem={renderInspectionCard}
              keyExtractor={(item) => item.id || ''}
              loading={isLoading}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>

        {isAdmin && (
          <FAB
            icon="add"
            onPress={() => setShowCreateModal(true)}
            style={styles.fab}
          />
        )}

        <CreateInspectionModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />

        <InspectionDetailModal
          inspection={selectedInspection}
          visible={!!selectedInspection}
          onClose={() => setSelectedInspection(null)}
        />
      </SafeAreaView>
    </ErrorBoundary>
  );
}

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
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.borderRadius.md,
    borderWidth: 1,
    borderColor: tokens.colors.primary,
  },
  filterButtonText: {
    marginLeft: tokens.spacing.xs,
    color: tokens.colors.primary,
    fontSize: tokens.typography.sizes.sm,
    fontWeight: tokens.typography.weights.medium,
  },
  filtersCard: {
    margin: tokens.spacing.md,
    marginBottom: 0,
  },
  filtersTitle: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.semiBold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.borderRadius.full,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.background,
  },
  filterChipActive: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  filterChipText: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.primary,
  },
  filterChipTextActive: {
    color: tokens.colors.white,
  },
  content: {
    flex: 1,
  },
  inspectionCard: {
    marginHorizontal: tokens.spacing.md,
    marginVertical: tokens.spacing.xs,
  },
  cardContent: {
    padding: tokens.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.sm,
  },
  plotInfo: {
    flex: 1,
  },
  plotNumber: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.semiBold,
    color: tokens.colors.text.primary,
  },
  inspectionDate: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.xs,
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
  statusRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.sm,
  },
  actionRow: {
    marginBottom: tokens.spacing.sm,
  },
  issuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  issuesText: {
    marginLeft: tokens.spacing.xs,
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.warning,
    fontWeight: tokens.typography.weights.medium,
  },
  notesText: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
    lineHeight: 20,
    marginBottom: tokens.spacing.sm,
  },
  reinspectRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reinspectText: {
    marginLeft: tokens.spacing.xs,
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
    fontStyle: 'italic',
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.xl,
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
  fab: {
    position: 'absolute',
    bottom: tokens.spacing.xl,
    right: tokens.spacing.xl,
  },
});