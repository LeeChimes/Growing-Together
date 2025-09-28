import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Button, Card, Tag, useTheme } from '../design';
import { useAIPlantAdvice, useAIPlantIdentification } from '../hooks/useAI';
import { Plant } from '../data/plants';

interface AskAIModalProps {
  visible: boolean;
  onClose: () => void;
  plant?: Plant;
}

const quickQuestions = [
  { id: 1, text: 'Why are my leaves turning yellow?', icon: 'leaf' },
  { id: 2, text: 'How often should I water this plant?', icon: 'water' },
  { id: 3, text: 'What pests might be affecting my plant?', icon: 'bug' },
  { id: 4, text: 'When is the best time to harvest?', icon: 'time' },
  { id: 5, text: 'How can I improve soil quality?', icon: 'earth' },
  { id: 6, text: 'What companion plants work well?', icon: 'flower' },
];

export function AskAIModal({ visible, onClose, plant }: AskAIModalProps) {
  const theme = useTheme();
  const [question, setQuestion] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [mode, setMode] = useState<'advice' | 'identify'>('advice');
  const [chatHistory, setChatHistory] = useState<Array<{
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
  }>>([]);

  const adviceMutation = useAIPlantAdvice();
  const identifyMutation = useAIPlantIdentification();

  const handleClose = () => {
    setQuestion('');
    setPhoto(null);
    setMode('advice');
    setChatHistory([]);
    onClose();
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri);
        
        // If in identify mode, automatically identify the plant
        if (mode === 'identify' && result.assets[0].base64) {
          handleIdentifyPlant(result.assets[0].base64);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleQuickQuestion = (questionText: string) => {
    setQuestion(questionText);
    handleAskQuestion(questionText);
  };

  const handleAskQuestion = async (questionText?: string) => {
    const currentQuestion = questionText || question;
    if (!currentQuestion.trim()) return;

    // Add user message to chat
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: currentQuestion,
      timestamp: new Date(),
    };
    setChatHistory(prev => [...prev, userMessage]);

    try {
      const response = await adviceMutation.mutateAsync({
        question: currentQuestion,
        plantName: plant?.name,
        photo: photo ? await convertToBase64(photo) : undefined,
        context: 'plant_care',
      });

      // Add AI response to chat
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai' as const,
        content: response.answer,
        timestamp: new Date(),
      };
      setChatHistory(prev => [...prev, aiMessage]);

    } catch (error) {
      Alert.alert('Error', 'Failed to get AI response');
    }

    setQuestion('');
  };

  const handleIdentifyPlant = async (base64Image: string) => {
    try {
      const response = await identifyMutation.mutateAsync(base64Image);
      
      const identificationMessage = {
        id: Date.now().toString(),
        type: 'ai' as const,
        content: `I think this is a **${response.plantName}** (*${response.scientificName}*) with ${Math.round(response.confidence * 100)}% confidence.\n\n**Care Instructions:**\n${response.careInstructions.map(instruction => `• ${instruction}`).join('\n')}`,
        timestamp: new Date(),
      };
      setChatHistory(prev => [...prev, identificationMessage]);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to identify plant');
    }
  };

  const convertToBase64 = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remove data:image/jpeg;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.grayLight }]}>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={theme.colors.charcoal} />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={[styles.headerTitle, { color: theme.colors.charcoal }]}>
                🤖 Ask AI Garden Assistant
              </Text>
              {plant && (
                <Text style={[styles.headerSubtitle, { color: theme.colors.gray }]}>
                  About {plant.name}
                </Text>
              )}
            </View>

            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  {
                    backgroundColor: mode === 'advice' ? theme.colors.green : 'transparent',
                  }
                ]}
                onPress={() => setMode('advice')}
              >
                <Ionicons 
                  name="chatbubble" 
                  size={16} 
                  color={mode === 'advice' ? theme.colors.paper : theme.colors.gray} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  {
                    backgroundColor: mode === 'identify' ? theme.colors.green : 'transparent',
                  }
                ]}
                onPress={() => setMode('identify')}
              >
                <Ionicons 
                  name="camera" 
                  size={16} 
                  color={mode === 'identify' ? theme.colors.paper : theme.colors.gray} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Chat History */}
          <ScrollView style={styles.chatContainer} contentContainerStyle={styles.chatContent}>
            {chatHistory.length === 0 ? (
              <View style={styles.welcomeContainer}>
                <Text style={[styles.welcomeTitle, { color: theme.colors.charcoal }]}>
                  {mode === 'advice' ? '🌱 Garden Advice' : '🔍 Plant Identification'}
                </Text>
                <Text style={[styles.welcomeText, { color: theme.colors.gray }]}>
                  {mode === 'advice' 
                    ? 'Ask me anything about gardening! I can help with plant care, pest problems, diseases, and growing tips.'
                    : 'Upload a photo of a plant and I\'ll try to identify it for you, along with care instructions.'
                  }
                </Text>

                {mode === 'advice' && (
                  <View style={styles.quickQuestions}>
                    <Text style={[styles.quickTitle, { color: theme.colors.charcoal }]}>
                      Quick Questions:
                    </Text>
                    {quickQuestions.map((q) => (
                      <TouchableOpacity
                        key={q.id}
                        style={[styles.quickQuestion, { borderColor: theme.colors.grayLight }]}
                        onPress={() => handleQuickQuestion(q.text)}
                      >
                        <Ionicons name={q.icon as any} size={16} color={theme.colors.green} />
                        <Text style={[styles.quickQuestionText, { color: theme.colors.charcoal }]}>
                          {q.text}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.messages}>
                {chatHistory.map((message) => (
                  <View
                    key={message.id}
                    style={[
                      styles.messageContainer,
                      message.type === 'user' ? styles.userMessage : styles.aiMessage,
                    ]}
                  >
                    <View style={styles.messageHeader}>
                      <View style={styles.messageAuthor}>
                        <Ionicons 
                          name={message.type === 'user' ? 'person' : 'leaf'} 
                          size={14} 
                          color={message.type === 'user' ? theme.colors.green : theme.colors.sky} 
                        />
                        <Text style={[styles.authorText, { color: theme.colors.gray }]}>
                          {message.type === 'user' ? 'You' : 'AI Assistant'}
                        </Text>
                      </View>
                      <Text style={[styles.timestamp, { color: theme.colors.gray }]}>
                        {formatTimestamp(message.timestamp)}
                      </Text>
                    </View>
                    
                    <Text style={[styles.messageText, { color: theme.colors.charcoal }]}>
                      {message.content}
                    </Text>
                  </View>
                ))}
                
                {(adviceMutation.isPending || identifyMutation.isPending) && (
                  <View style={[styles.messageContainer, styles.aiMessage]}>
                    <View style={styles.typingIndicator}>
                      <Text style={[styles.typingText, { color: theme.colors.gray }]}>
                        AI is thinking...
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Photo Preview */}
          {photo && (
            <View style={styles.photoPreview}>
              <Image source={{ uri: photo }} style={styles.photoImage} />
              <TouchableOpacity
                style={[styles.removePhoto, { backgroundColor: theme.colors.error }]}
                onPress={() => setPhoto(null)}
              >
                <Ionicons name="close" size={16} color={theme.colors.paper} />
              </TouchableOpacity>
            </View>
          )}

          {/* Input Area */}
          <View style={[styles.inputContainer, { borderTopColor: theme.colors.grayLight }]}>
            {mode === 'advice' ? (
              <View style={styles.inputRow}>
                <TouchableOpacity
                  style={[styles.inputButton, { borderColor: theme.colors.grayLight }]}
                  onPress={pickImage}
                >
                  <Ionicons name="camera" size={20} color={theme.colors.green} />
                </TouchableOpacity>
                
                <TextInput
                  style={[
                    styles.textInput,
                    { 
                      borderColor: theme.colors.grayLight,
                      color: theme.colors.charcoal,
                    }
                  ]}
                  value={question}
                  onChangeText={setQuestion}
                  placeholder={plant ? `Ask about ${plant.name}...` : 'Ask your gardening question...'}
                  placeholderTextColor={theme.colors.gray}
                  multiline
                  maxLength={500}
                />
                
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    { 
                      backgroundColor: question.trim() ? theme.colors.green : theme.colors.grayLight,
                    }
                  ]}
                  onPress={() => handleAskQuestion()}
                  disabled={!question.trim() || adviceMutation.isPending}
                >
                  <Ionicons 
                    name="send" 
                    size={20} 
                    color={question.trim() ? theme.colors.paper : theme.colors.gray} 
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <Button
                title={photo ? "Identify This Plant" : "Take Photo to Identify"}
                onPress={photo ? () => handleIdentifyPlant(photo) : pickImage}
                loading={identifyMutation.isPending}
                style={styles.identifyButton}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    backgroundColor: 'white',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    padding: 2,
  },
  modeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  quickQuestions: {
    width: '100%',
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  quickQuestionText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  messages: {
    gap: 16,
  },
  messageContainer: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#22c55e',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 11,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  typingIndicator: {
    padding: 8,
  },
  typingText: {
    fontStyle: 'italic',
  },
  photoPreview: {
    margin: 16,
    position: 'relative',
    alignSelf: 'center',
  },
  photoImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  removePhoto: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    backgroundColor: 'white',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  inputButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identifyButton: {
    width: '100%',
  },
});