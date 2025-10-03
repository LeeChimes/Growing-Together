import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Button, Avatar, Card } from '../design';
import { useAuthStore } from '../store/authStore';
import { useChatMessages, useSendChatMessage } from '../hooks/useCommunity';

interface ChatModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({ visible, onClose }) => {
  const theme = useTheme();
  const { profile } = useAuthStore();
  const { data: messages = [] } = useChatMessages();
  const sendMessage = useSendChatMessage();
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, [visible, messages.length]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content) return;
    try {
      await sendMessage.mutateAsync({ text: content });
      setText('');
    } catch {}
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, backgroundColor: theme.colors.paper }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.grayLight }}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.charcoal} />
            </TouchableOpacity>
            <Text style={{ marginLeft: 12, fontSize: 18, fontWeight: '600', color: theme.colors.charcoal }}>Community Chat</Text>
          </View>

          <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, gap: 8 }}>
            {messages.map((m) => (
              <Card key={m.id} style={{ padding: 12 }}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                  <Avatar name={m.user_id?.slice(0, 6)} size="small" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.colors.charcoal }}>{m.text}</Text>
                    <Text style={{ color: theme.colors.gray, fontSize: 12, marginTop: 4 }}>
                      {new Date(m.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </ScrollView>

          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: theme.colors.grayLight }}>
            <Avatar name={profile?.full_name} size="small" />
            <View style={{ flex: 1, marginHorizontal: 8 }}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Write a message"
                placeholderTextColor={theme.colors.gray}
                style={{ borderWidth: 1, borderColor: theme.colors.grayLight, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, color: theme.colors.charcoal }}
              />
            </View>
            <Button title="Send" size="small" onPress={handleSend} disabled={sendMessage.isPending} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};


