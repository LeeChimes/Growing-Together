import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { 
  FAB, 
  Card, 
  Tag, 
  EmptyState, 
  Button,
  useTheme 
} from '../src/design';
import { useDiaryEntries } from '../src/hooks/useDiary';
import { DiaryEntryModal } from '../src/components/DiaryEntryModal';
import { Database } from '../src/lib/database.types';

type DiaryEntry = Database['public']['Tables']['diary_entries']['Row'];
type TemplateType = 'sowing' | 'watering' | 'harvesting' | 'maintenance' | 'general';

const templates = [
  { id: 'all', name: 'All', icon: 'grid', color: '#6b7280' },
  { id: 'sowing', name: 'Sowing', icon: 'leaf', color: '#22c55e' },
  { id: 'watering', name: 'Watering', icon: 'water', color: '#3b82f6' },
  { id: 'harvesting', name: 'Harvesting', icon: 'basket', color: '#f59e0b' },
  { id: 'maintenance', name: 'Maintenance', icon: 'build', color: '#8b5cf6' },
  { id: 'general', name: 'General', icon: 'document-text', color: '#6b7280' },
];

export default function DiaryScreen() {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | undefined>();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | undefined>();
  const [filterTemplate, setFilterTemplate] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'week' | 'month' | 'all'>('all');

  // Calculate date range for filters
  const getDateRange = () => {
    const now = new Date();
    const startDate = new Date();
    
    switch (dateFilter) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        return { startDate: startDate.toISOString() };
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        return { startDate: startDate.toISOString() };
      default:
        return {};
    }
  };

  const filters = {
    ...(filterTemplate !== 'all' && { templateType: filterTemplate }),
    ...getDateRange(),
  };

  const { data: entries = [], isLoading, refetch } = useDiaryEntries(filters);

  const handleCreateEntry = (template?: TemplateType) => {
    setSelectedEntry(undefined);
    setSelectedTemplate(template);
    setModalVisible(true);
  };

  const handleEditEntry = (entry: DiaryEntry) => {
    setSelectedEntry(entry);
    setSelectedTemplate(undefined);
    setModalVisible(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTemplateInfo = (templateType: string) => {
    return templates.find(t => t.id === templateType) || templates[0];
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.paper }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.charcoal }]}>
          My Garden Diary
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.gray }]}>
          {entries.length} entries
        </Text>
      </View>

      {/* Filters */}
      <View style={[styles.filters, { backgroundColor: theme.colors.paper }]}>
        {/* Template Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {templates.map((template) => (
            <TouchableOpacity
              key={template.id}
              style={[
                styles.filterButton,
                {
                  backgroundColor: filterTemplate === template.id ? template.color + '20' : theme.colors.grayLight,
                  borderColor: filterTemplate === template.id ? template.color : 'transparent',
                }
              ]}
              onPress={() => setFilterTemplate(template.id)}
            >
              <Ionicons 
                name={template.icon as any} 
                size={16} 
                color={filterTemplate === template.id ? template.color : theme.colors.gray} 
              />
              <Text 
                style={[
                  styles.filterText,
                  { color: filterTemplate === template.id ? template.color : theme.colors.gray }
                ]}
              >
                {template.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Date Filter */}
        <View style={styles.dateFilters}>
          {['all', 'month', 'week'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.dateFilterButton,
                {
                  backgroundColor: dateFilter === period ? theme.colors.green + '20' : 'transparent',
                }
              ]}
              onPress={() => setDateFilter(period as any)}
            >
              <Text 
                style={[
                  styles.dateFilterText,
                  { color: dateFilter === period ? theme.colors.green : theme.colors.gray }
                ]}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Entries List */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {entries.length > 0 ? (
          <View style={styles.entriesList}>
            {entries.map((entry) => {
              const templateInfo = getTemplateInfo(entry.template_type);
              return (
                <TouchableOpacity
                  key={entry.id}
                  onPress={() => handleEditEntry(entry)}
                >
                  <Card style={styles.entryCard}>
                    <View style={styles.entryHeader}>
                      <View style={styles.entryMeta}>
                        <Tag
                          label={templateInfo.name}
                          variant="default"
                          size="small"
                          style={{ backgroundColor: templateInfo.color + '20' }}
                        />
                        <Text style={[styles.entryDate, { color: theme.colors.gray }]}>
                          {formatDate(entry.created_at)}
                        </Text>
                      </View>
                      
                      {entry.weather && (
                        <View style={styles.weatherInfo}>
                          <Ionicons name="partly-sunny" size={16} color={theme.colors.sky} />
                          <Text style={[styles.weatherText, { color: theme.colors.gray }]}>
                            {entry.weather}
                            {entry.temperature && ` • ${entry.temperature}°C`}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={[styles.entryTitle, { color: theme.colors.charcoal }]}>
                      {entry.title}
                    </Text>
                    
                    <Text style={[styles.entryContent, { color: theme.colors.gray }]} numberOfLines={3}>
                      {entry.content}
                    </Text>

                    {entry.photos && entry.photos.length > 0 && (
                      <View style={styles.photoPreview}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {entry.photos.slice(0, 3).map((photo, index) => (
                            <Image key={index} source={{ uri: photo }} style={styles.previewPhoto} />
                          ))}
                          {entry.photos.length > 3 && (
                            <View style={[styles.morePhotos, { backgroundColor: theme.colors.grayLight }]}>
                              <Text style={[styles.morePhotosText, { color: theme.colors.gray }]}>
                                +{entry.photos.length - 3}
                              </Text>
                            </View>
                          )}
                        </ScrollView>
                      </View>
                    )}
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <EmptyState
            icon={<Ionicons name="book" size={48} color={theme.colors.gray} />}
            title="No diary entries yet"
            description="Start documenting your allotment journey!"
            actionLabel="Create First Entry"
            onAction={() => handleCreateEntry()}
          />
        )}
      </ScrollView>

      {/* Quick Template Buttons */}
      {entries.length > 0 && (
        <View style={styles.quickActions}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {templates.slice(1).map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[styles.quickActionButton, { backgroundColor: template.color }]}
                onPress={() => handleCreateEntry(template.id as TemplateType)}
              >
                <Ionicons name={template.icon as any} size={20} color="white" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* FAB */}
      <FAB
        onPress={() => handleCreateEntry()}
        icon={<Ionicons name="add" size={24} color="white" />}
      />

      {/* Modal */}
      <DiaryEntryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        entry={selectedEntry}
        defaultTemplate={selectedTemplate}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  filters: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterScroll: {
    marginBottom: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  filterText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  dateFilters: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  dateFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dateFilterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  entriesList: {
    padding: 16,
    gap: 12,
  },
  entryCard: {
    marginBottom: 4,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryDate: {
    fontSize: 12,
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weatherText: {
    fontSize: 12,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  entryContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  photoPreview: {
    marginTop: 8,
  },
  previewPhoto: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  morePhotos: {
    width: 60,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  morePhotosText: {
    fontSize: 12,
    fontWeight: '500',
  },
  quickActions: {
    padding: 16,
    paddingBottom: 8,
  },
  quickActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
});