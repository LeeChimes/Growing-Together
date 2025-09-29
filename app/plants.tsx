import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { 
  Card, 
  Tag, 
  Button,
  EmptyState,
  useTheme 
} from '../src/design';
import { ukPlants, plantCategories, getDifficultyColor, getMonthName, Plant } from '../src/data/plants';
import { AskAIModal } from '../src/components/AskAIModal';

export default function PlantLibraryScreen() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'difficulty' | 'season'>('name');
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [askAiPlant, setAskAiPlant] = useState<Plant | undefined>();

  // Filter and sort plants
  const filteredPlants = ukPlants
    .filter(plant => {
      const matchesSearch = plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           plant.scientificName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || plant.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'all' || plant.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesCategory && matchesDifficulty;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'difficulty': {
          const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 } as const;
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        }
        case 'season':
          return Math.min(...a.sowingMonths) - Math.min(...b.sowingMonths);
        default:
          return 0;
      }
    });

  const handleAskAI = (plant?: Plant) => {
    setAskAiPlant(plant);
    setAiModalVisible(true);
  };

  const getCurrentMonthPlants = () => {
    const currentMonth = new Date().getMonth() + 1;
    return ukPlants.filter(plant => 
      plant.sowingMonths.includes(currentMonth) || plant.harvestMonths.includes(currentMonth)
    );
  };

  const renderPlantCard = ({ item: plant }: { item: Plant }) => (
    <TouchableOpacity
      onPress={() => setSelectedPlant(plant)}
      style={styles.plantCard}
    >
      <Card style={styles.card}>
        <View style={styles.plantHeader}>
          <View style={styles.plantInfo}>
            <Text style={[styles.plantName, { color: theme.colors.charcoal }]}>
              {plant.name}
            </Text>
            <Text style={[styles.scientificName, { color: theme.colors.gray }]}>
              {plant.scientificName}
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.aiButton, { backgroundColor: theme.colors.sky + '20' }]}
            onPress={() => handleAskAI(plant)}
          >
            <Ionicons name="chatbubble-ellipses" size={16} color={theme.colors.sky} />
            <Text style={[styles.aiButtonText, { color: theme.colors.sky }]}>
              Ask AI
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.plantMeta}>
          <Tag
            label={plant.category}
            variant="default"
            size="small"
            style={{ backgroundColor: theme.colors.green + '20' }}
          />
          <Tag
            label={plant.difficulty}
            variant="default"
            size="small"
            style={{ backgroundColor: getDifficultyColor(plant.difficulty) + '20' }}
          />
          <View style={styles.sunRequirement}>
            <Ionicons 
              name={plant.sunRequirement === 'full_sun' ? 'sunny' : plant.sunRequirement === 'partial_shade' ? 'partly-sunny' : 'cloudy'} 
              size={14} 
              color={theme.colors.sunflower} 
            />
          </View>
        </View>

        <Text style={[styles.plantDescription, { color: theme.colors.gray }]} numberOfLines={2}>
          {plant.description}
        </Text>

        <View style={styles.sowingHarvest}>
          <View style={styles.monthsContainer}>
            <Text style={[styles.monthsLabel, { color: theme.colors.green }]}>
              Sow: {plant.sowingMonths.map(m => getMonthName(m)).join(', ')}
            </Text>
          </View>
          <View style={styles.monthsContainer}>
            <Text style={[styles.monthsLabel, { color: theme.colors.warning }]}>
              Harvest: {plant.harvestMonths.map(m => getMonthName(m)).join(', ')}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderPlantDetail = () => {
    if (!selectedPlant) return null;

    return (
      <ScrollView style={styles.detailContainer}>
        <View style={styles.detailHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedPlant(null)}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.charcoal} />
          </TouchableOpacity>
          
          <Text style={[styles.detailTitle, { color: theme.colors.charcoal }]}>
            {selectedPlant.name}
          </Text>
          
          <TouchableOpacity
            style={[styles.aiButton, { backgroundColor: theme.colors.sky + '20' }]}
            onPress={() => handleAskAI(selectedPlant)}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color={theme.colors.sky} />
            <Text style={[styles.aiButtonText, { color: theme.colors.sky }]}>
              Ask AI
            </Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.detailCard}>
          <Text style={[styles.scientificName, { color: theme.colors.gray }]}>
            {selectedPlant.scientificName}
          </Text>
          
          <View style={styles.detailMeta}>
            <Tag label={selectedPlant.category} variant="default" />
            <Tag 
              label={selectedPlant.difficulty}
              variant="default"
              style={{ backgroundColor: getDifficultyColor(selectedPlant.difficulty) + '20' }}
            />
          </View>

          <Text style={[styles.detailDescription, { color: theme.colors.charcoal }]}>
            {selectedPlant.description}
          </Text>

          <View style={styles.detailSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.charcoal }]}>
              Planting Information
            </Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: theme.colors.gray }]}>Spacing</Text>
                <Text style={[styles.infoValue, { color: theme.colors.charcoal }]}>
                  {selectedPlant.spacing}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: theme.colors.gray }]}>Soil Type</Text>
                <Text style={[styles.infoValue, { color: theme.colors.charcoal }]}>
                  {selectedPlant.soilType}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, { color: theme.colors.gray }]}>Watering</Text>
                <Text style={[styles.infoValue, { color: theme.colors.charcoal }]}>
                  {selectedPlant.wateringNeeds}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.charcoal }]}>
              Care Instructions
            </Text>
            {selectedPlant.careInstructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <Ionicons name="checkmark-circle" size={16} color={theme.colors.green} />
                <Text style={[styles.instructionText, { color: theme.colors.charcoal }]}>
                  {instruction}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.detailSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.charcoal }]}>
              Tips & Advice
            </Text>
            {selectedPlant.tips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Ionicons name="bulb" size={16} color={theme.colors.sunflower} />
                <Text style={[styles.tipText, { color: theme.colors.charcoal }]}>
                  {tip}
                </Text>
              </View>
            ))}
          </View>

          {selectedPlant.companionPlants.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.charcoal }]}>
                Companion Plants
              </Text>
              <View style={styles.companionList}>
                {selectedPlant.companionPlants.map((companion, index) => (
                  <Tag key={index} label={companion} variant="success" size="small" />
                ))}
              </View>
            </View>
          )}
        </Card>
      </ScrollView>
    );
  };

  if (selectedPlant) {
    return (
      <SafeAreaView style={styles.container}>
        {renderPlantDetail()}
        <AskAIModal
          visible={aiModalVisible}
          onClose={() => setAiModalVisible(false)}
          plant={askAiPlant}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.paper }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.charcoal }]}>
          🌱 Plant Library
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.gray }]}>
          {filteredPlants.length} UK plants
        </Text>
        
        <TouchableOpacity
          style={[styles.globalAiButton, { backgroundColor: theme.colors.sky }]}
          onPress={() => handleAskAI()}
        >
          <Ionicons name="chatbubble-ellipses" size={20} color={theme.colors.paper} />
          <Text style={[styles.globalAiButtonText, { color: theme.colors.paper }]}>
            Ask AI
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.paper }]}>
        <View style={[styles.searchInputContainer, { borderColor: theme.colors.grayLight }]}>
          <Ionicons name="search" size={20} color={theme.colors.gray} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.charcoal }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search plants..."
            placeholderTextColor={theme.colors.gray}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.gray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: theme.colors.paper }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterSection}>
            {plantCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: selectedCategory === category.id ? theme.colors.green + '20' : theme.colors.grayLight,
                    borderColor: selectedCategory === category.id ? theme.colors.green : 'transparent',
                  }
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Ionicons 
                  name={category.icon as any} 
                  size={16} 
                  color={selectedCategory === category.id ? theme.colors.green : theme.colors.gray} 
                />
                <Text 
                  style={[
                    styles.filterText,
                    { color: selectedCategory === category.id ? theme.colors.green : theme.colors.gray }
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Current Month Highlight */}
      {getCurrentMonthPlants().length > 0 && (
        <Card style={styles.seasonalCard}>
          <View style={styles.seasonalHeader}>
            <Ionicons name="calendar" size={20} color={theme.colors.green} />
            <Text style={[styles.seasonalTitle, { color: theme.colors.charcoal }]}>
              Plant This Month
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {getCurrentMonthPlants().slice(0, 5).map((plant) => (
              <TouchableOpacity
                key={plant.id}
                style={[styles.seasonalPlant, { borderColor: theme.colors.grayLight }]}
                onPress={() => setSelectedPlant(plant)}
              >
                <Text style={[styles.seasonalPlantName, { color: theme.colors.charcoal }]}>
                  {plant.name}
                </Text>
                <Tag label={plant.difficulty} size="small" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card>
      )}

      {/* Plants List */}
      <FlatList
        data={filteredPlants}
        renderItem={renderPlantCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name="leaf" size={48} color={theme.colors.gray} />}
            title="No plants found"
            description="Try adjusting your search or filters"
            actionLabel="Clear Filters"
            onAction={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedDifficulty('all');
            }}
          />
        }
      />

      <AskAIModal
        visible={aiModalVisible}
        onClose={() => setAiModalVisible(false)}
        plant={askAiPlant}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    position: 'absolute',
    top: 45,
    left: 16,
  },
  globalAiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  globalAiButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filtersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  seasonalCard: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  seasonalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  seasonalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  seasonalPlant: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 100,
  },
  seasonalPlantName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  plantCard: {
    marginBottom: 12,
  },
  card: {
    // Card styling handled by Card component
  },
  plantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  plantInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  scientificName: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  aiButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  plantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  sunRequirement: {
    marginLeft: 'auto',
  },
  plantDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  sowingHarvest: {
    gap: 4,
  },
  monthsContainer: {
    flexDirection: 'row',
  },
  monthsLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Detail view styles
  detailContainer: {
    flex: 1,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 16,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
  },
  detailCard: {
    margin: 16,
  },
  detailMeta: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  detailDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  companionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});