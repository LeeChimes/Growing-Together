import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Button, Card, Tag } from '../design';
import { useCreateRecipe } from '../hooks/useRecipes';

interface CreateRecipeModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreateRecipeModal: React.FC<CreateRecipeModalProps> = ({ visible, onClose }) => {
  const theme = useTheme();
  const createRecipe = useCreateRecipe();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [steps, setSteps] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [newStep, setNewStep] = useState('');

  const addIngredient = () => {
    const item = newIngredient.trim();
    if (!item) return;
    setIngredients((prev) => [...prev, item]);
    setNewIngredient('');
  };

  const addStep = () => {
    const item = newStep.trim();
    if (!item) return;
    setSteps((prev) => [...prev, item]);
    setNewStep('');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a recipe title');
      return;
    }
    try {
      await createRecipe.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        ingredients,
        steps,
        photos: [],
      });
      setTitle('');
      setDescription('');
      setIngredients([]);
      setSteps([]);
      onClose();
    } catch (e) {
      Alert.alert('Error', 'Failed to save recipe');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.colors.paper }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.grayLight }}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.colors.charcoal} />
          </TouchableOpacity>
          <Text style={{ marginLeft: 12, fontSize: 18, fontWeight: '600', color: theme.colors.charcoal }}>Add Recipe</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <Card style={{ padding: 12 }}>
            <Text style={{ color: theme.colors.charcoal, marginBottom: 8 }}>Title</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder="E.g. Courgette Fritters" placeholderTextColor={theme.colors.gray} style={{ borderWidth: 1, borderColor: theme.colors.grayLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: theme.colors.charcoal }} />
          </Card>

          <Card style={{ padding: 12 }}>
            <Text style={{ color: theme.colors.charcoal, marginBottom: 8 }}>Description (optional)</Text>
            <TextInput value={description} onChangeText={setDescription} placeholder="Short description" placeholderTextColor={theme.colors.gray} multiline style={{ borderWidth: 1, borderColor: theme.colors.grayLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: theme.colors.charcoal, minHeight: 60 }} />
          </Card>

          <Card style={{ padding: 12 }}>
            <Text style={{ color: theme.colors.charcoal, marginBottom: 8 }}>Ingredients</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <TextInput value={newIngredient} onChangeText={setNewIngredient} placeholder="Add ingredient" placeholderTextColor={theme.colors.gray} style={{ flex: 1, borderWidth: 1, borderColor: theme.colors.grayLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: theme.colors.charcoal }} />
              <Button title="Add" onPress={addIngredient} size="small" />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {ingredients.map((ing, i) => (
                <Tag key={i} label={ing} />
              ))}
            </View>
          </Card>

          <Card style={{ padding: 12 }}>
            <Text style={{ color: theme.colors.charcoal, marginBottom: 8 }}>Steps</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <TextInput value={newStep} onChangeText={setNewStep} placeholder="Add step" placeholderTextColor={theme.colors.gray} style={{ flex: 1, borderWidth: 1, borderColor: theme.colors.grayLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: theme.colors.charcoal }} />
              <Button title="Add" onPress={addStep} size="small" />
            </View>
            <View style={{ gap: 8 }}>
              {steps.map((s, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                  <Text style={{ color: theme.colors.gray }}>{i + 1}.</Text>
                  <Text style={{ color: theme.colors.charcoal, flex: 1 }}>{s}</Text>
                </View>
              ))}
            </View>
          </Card>
        </ScrollView>

        <View style={{ padding: 16 }}>
          <Button title="Save Recipe" onPress={handleSave} />
        </View>
      </View>
    </Modal>
  );
};


