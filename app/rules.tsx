import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRules, useRuleAcknowledgment, useAcknowledgeRules, useSearchRules, useFormattedRules } from '../src/hooks/useRules';
import { useAuthStore } from '../src/store/authStore';
import { CreateRulesModal } from '../src/components/CreateRulesModal';
import { RulesStatsModal } from '../src/components/RulesStatsModal';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { Button } from '../src/design/Button';
import { Card } from '../src/design/Card';
import { Tag } from '../src/design/Tag';
import { FAB } from '../src/design/FAB';
import { tokens } from '../src/design/tokens';
import { parseRulesMarkdown, generateRulesToC } from '../src/types/rules';
import { Ionicons } from '@expo/vector-icons';

export default function RulesScreen() {
  const { user } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showTableOfContents, setShowTableOfContents] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const isAdmin = user?.role === 'admin';

  // Hooks
  const { data: rules, isLoading: loadingRules } = useRules();
  const { data: acknowledgmentStatus } = useRuleAcknowledgment();
  const { data: formattedRules } = useFormattedRules();
  const { data: searchResults } = useSearchRules(searchQuery);
  const acknowledgeRulesMutation = useAcknowledgeRules();

  const hasAcknowledged = acknowledgmentStatus?.hasAcknowledged;
  const needsAcknowledgment = acknowledgmentStatus?.needsAcknowledgment;

  const handleAcknowledge = async () => {
    if (!rules) return;

    Alert.alert(
      'Acknowledge Rules',
      'By acknowledging these rules, you confirm that you have read, understood, and agree to abide by them.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'I Acknowledge',
          onPress: async () => {
            try {
              await acknowledgeRulesMutation.mutateAsync(rules.id!);
              Alert.alert('Success', 'Rules acknowledged successfully!');
            } catch (error) {
              console.error('Acknowledgment error:', error);
              Alert.alert('Error', 'Failed to acknowledge rules. Please try again.');
            }
          },
        },
      ]
    );
  };

  const scrollToSection = (sectionId: string) => {
    // This would need implementation with proper section references
    // For now, we'll just close the TOC
    setShowTableOfContents(false);
  };

  const renderSearchResults = () => {
    if (!searchQuery.trim() || !searchResults) return null;

    if (searchResults.sections.length === 0) {
      return (
        <Card style={styles.searchResults}>
          <View style={styles.noResultsContainer}>
            <Ionicons name="search" size={32} color={tokens.colors.text.secondary} />
            <Text style={styles.noResultsText}>No results found for "{searchQuery}"</Text>
          </View>
        </Card>
      );
    }

    return (
      <Card style={styles.searchResults}>
        <Text style={styles.searchResultsTitle}>
          Found {searchResults.sections.length} result{searchResults.sections.length !== 1 ? 's' : ''} for "{searchQuery}"
        </Text>
        {searchResults.sections.map((section, index) => (
          <TouchableOpacity
            key={index}
            style={styles.searchResultItem}
            onPress={() => scrollToSection(section.id)}
          >
            <Text style={styles.searchResultTitle}>{section.title}</Text>
            <Text style={styles.searchResultContent} numberOfLines={3}>
              {section.content}
            </Text>
          </TouchableOpacity>
        ))}
      </Card>
    );
  };

  const renderTableOfContents = () => {
    if (!formattedRules?.sections) return null;

    return (
      <Card style={styles.tableOfContents}>
        <View style={styles.tocHeader}>
          <Text style={styles.tocTitle}>Table of Contents</Text>
          <TouchableOpacity onPress={() => setShowTableOfContents(false)}>
            <Ionicons name="close" size={20} color={tokens.colors.text.secondary} />
          </TouchableOpacity>
        </View>
        {formattedRules.sections.map((section, index) => (
          <TouchableOpacity
            key={section.id}
            style={styles.tocItem}
            onPress={() => scrollToSection(section.id)}
          >
            <Text style={styles.tocItemText}>{section.title}</Text>
          </TouchableOpacity>
        ))}
      </Card>
    );
  };

  const renderRulesContent = () => {
    if (searchQuery.trim() && searchResults) {
      return renderSearchResults();
    }

    if (!formattedRules?.sections) {
      return (
        <Card style={styles.contentCard}>
          <Text style={styles.rulesContent}>{rules?.markdown || 'No rules available.'}</Text>
        </Card>
      );
    }

    return (
      <>
        {formattedRules.sections.map((section, index) => (
          <Card key={section.id} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </Card>
        ))}
      </>
    );
  };

  if (loadingRules) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading rules...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Community Rules</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowSearch(!showSearch)}
            >
              <Ionicons 
                name={showSearch ? "search" : "search-outline"} 
                size={20} 
                color={tokens.colors.primary} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowTableOfContents(!showTableOfContents)}
            >
              <Ionicons 
                name="list-outline" 
                size={20} 
                color={tokens.colors.primary} 
              />
            </TouchableOpacity>

            {isAdmin && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowStatsModal(true)}
              >
                <Ionicons 
                  name="stats-chart-outline" 
                  size={20} 
                  color={tokens.colors.primary} 
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={tokens.colors.text.secondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search rules..."
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
        )}

        {/* Table of Contents */}
        {showTableOfContents && renderTableOfContents()}

        {/* Rules Header Info */}
        {rules && !searchQuery.trim() && (
          <Card style={styles.rulesHeader}>
            <View style={styles.rulesHeaderContent}>
              <View style={styles.rulesInfo}>
                <Text style={styles.rulesVersion}>Version {rules.version}</Text>
                <Text style={styles.rulesDate}>
                  Published: {new Date(rules.published_at).toLocaleDateString()}
                </Text>
                {rules.summary && (
                  <Text style={styles.rulesSummary}>{rules.summary}</Text>
                )}
              </View>
              
              {needsAcknowledgment && (
                <View style={styles.acknowledgmentSection}>
                  <View style={styles.acknowledgmentBadge}>
                    <Ionicons name="warning" size={16} color={tokens.colors.warning} />
                    <Text style={styles.acknowledgmentText}>Acknowledgment Required</Text>
                  </View>
                </View>
              )}
              
              {hasAcknowledged && (
                <View style={styles.acknowledgedSection}>
                  <Tag text="✓ Acknowledged" variant="success" />
                  <Text style={styles.acknowledgedDate}>
                    {new Date(acknowledgmentStatus!.acknowledgment!.acknowledged_at).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Rules Content */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {rules ? renderRulesContent() : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text" size={64} color={tokens.colors.text.secondary} />
              <Text style={styles.emptyStateTitle}>No Rules Available</Text>
              <Text style={styles.emptyStateDescription}>
                {isAdmin 
                  ? 'Create the first version of community rules to get started.'
                  : 'Community rules will be displayed here once published.'
                }
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Acknowledgment Button */}
        {needsAcknowledgment && rules && (
          <View style={styles.acknowledgeFooter}>
            <Button
              title="I Acknowledge These Rules"
              onPress={handleAcknowledge}
              loading={acknowledgeRulesMutation.isPending}
              style={styles.acknowledgeButton}
            />
          </View>
        )}

        {/* Admin FAB */}
        {isAdmin && (
          <FAB
            icon="create-outline"
            onPress={() => setShowCreateModal(true)}
            style={styles.fab}
          />
        )}

        {/* Modals */}
        <CreateRulesModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />

        <RulesStatsModal
          visible={showStatsModal}
          onClose={() => setShowStatsModal(false)}
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
  headerActions: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  headerButton: {
    padding: tokens.spacing.xs,
    borderRadius: tokens.borderRadius.md,
    borderWidth: 1,
    borderColor: tokens.colors.primary,
  },
  searchContainer: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
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
  tableOfContents: {
    margin: tokens.spacing.md,
    marginBottom: 0,
  },
  tocHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  tocTitle: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.semiBold,
    color: tokens.colors.text.primary,
  },
  tocItem: {
    paddingVertical: tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  tocItemText: {
    fontSize: tokens.typography.sizes.md,
    color: tokens.colors.primary,
  },
  rulesHeader: {
    margin: tokens.spacing.md,
    marginBottom: 0,
  },
  rulesHeaderContent: {
    gap: tokens.spacing.md,
  },
  rulesInfo: {
    gap: tokens.spacing.xs,
  },
  rulesVersion: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.semiBold,
    color: tokens.colors.text.primary,
  },
  rulesDate: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
  },
  rulesSummary: {
    fontSize: tokens.typography.sizes.md,
    color: tokens.colors.text.primary,
    marginTop: tokens.spacing.xs,
    fontStyle: 'italic',
  },
  acknowledgmentSection: {
    gap: tokens.spacing.xs,
  },
  acknowledgmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    backgroundColor: tokens.colors.warning + '20',
    borderRadius: tokens.borderRadius.md,
    alignSelf: 'flex-start',
  },
  acknowledgmentText: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.warning,
    fontWeight: tokens.typography.weights.medium,
  },
  acknowledgedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  acknowledgedDate: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  contentCard: {
    margin: tokens.spacing.md,
  },
  rulesContent: {
    fontSize: tokens.typography.sizes.md,
    lineHeight: 24,
    color: tokens.colors.text.primary,
  },
  sectionCard: {
    margin: tokens.spacing.md,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.semiBold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.md,
  },
  sectionContent: {
    fontSize: tokens.typography.sizes.md,
    lineHeight: 24,
    color: tokens.colors.text.primary,
  },
  searchResults: {
    margin: tokens.spacing.md,
  },
  searchResultsTitle: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.md,
  },
  searchResultItem: {
    paddingVertical: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  searchResultTitle: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.semiBold,
    color: tokens.colors.primary,
    marginBottom: tokens.spacing.xs,
  },
  searchResultContent: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.text.secondary,
    lineHeight: 20,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: tokens.spacing.xl,
  },
  noResultsText: {
    fontSize: tokens.typography.sizes.md,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
    marginTop: tokens.spacing.sm,
  },
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
  acknowledgeFooter: {
    padding: tokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
    backgroundColor: tokens.colors.background,
  },
  acknowledgeButton: {
    backgroundColor: tokens.colors.success,
  },
  fab: {
    position: 'absolute',
    bottom: tokens.spacing.xl,
    right: tokens.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});