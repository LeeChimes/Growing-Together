import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button, FAB, EmptyState, useTheme, Tag } from '../src/design';
import { useRecipes } from '../src/hooks/useRecipes';
import { CreateRecipeModal } from '../src/components/CreateRecipeModal';

export default function RecipesScreen() {
  const theme = useTheme();
  const [createVisible, setCreateVisible] = useState(false);
  const { data: recipes = [], isLoading, refetch } = useRecipes();

  const renderRecipe = ({ item }: { item: any }) => (
    <Card style={styles.recipeCard}>
      <Text style={[styles.recipeTitle, { color: theme.colors.charcoal }]}>{item.title}</Text>
      {item.description ? (
        <Text style={{ color: theme.colors.gray, marginTop: 4 }}>{item.description}</Text>
      ) : null}

      {item.ingredients?.length ? (
        <View style={{ marginTop: 8 }}>
          <Text style={{ color: theme.colors.charcoal, fontWeight: '600', marginBottom: 4 }}>Ingredients</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {item.ingredients.slice(0, 6).map((ing: string, i: number) => (
              <Tag key={i} label={ing} />
            ))}
          </View>
        </View>
      ) : null}

      {item.steps?.length ? (
        <View style={{ marginTop: 8 }}>
          <Text style={{ color: theme.colors.charcoal, fontWeight: '600', marginBottom: 4 }}>Steps</Text>
          {item.steps.slice(0, 3).map((s: string, i: number) => (
            <Text key={i} style={{ color: theme.colors.gray }}>{i + 1}. {s}</Text>
          ))}
        </View>
      ) : null}
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: theme.colors.paper }]}> 
        <View>
          <Text style={[styles.headerTitle, { color: theme.colors.charcoal }]}>Recipes & Ideas</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.gray }]}>{recipes.length} recipes</Text>
        </View>
      </View>

      <FlatList
        data={recipes}
        renderItem={renderRecipe}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name="restaurant" size={48} color={theme.colors.gray} />}
            title="No recipes yet"
            description="Share your favourite harvest dishes with the community."
            actionLabel="Add Recipe"
            onAction={() => setCreateVisible(true)}
          />
        }
      />

      <FAB onPress={() => setCreateVisible(true)} icon={<Ionicons name="add" size={24} color="white" />} />

      <CreateRecipeModal visible={createVisible} onClose={() => setCreateVisible(false)} />
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
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  listContent: {
    padding: 16,
  },
  recipeCard: {
    marginBottom: 12,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
});


