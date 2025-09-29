import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Button, useTheme } from '../design';
import { enqueueMutation, processQueueOnce, getQueue } from '../lib/queue';

interface DevOfflineHarnessProps {
  visible: boolean;
  onClose: () => void;
}

export function DevOfflineHarness({ visible, onClose }: DevOfflineHarnessProps) {
  const theme = useTheme();
  const [queueSize, setQueueSize] = React.useState(getQueue().length);

  if (!visible) return null;

  const enqueueExamples = async () => {
    enqueueMutation({ type: 'diary.create', payload: { id: 'dev-diary', title: 'Dev Diary', content: 'Offline test' } });
    enqueueMutation({ type: 'post.create', payload: { id: 'dev-post', content: 'Offline post' } });
    enqueueMutation({ type: 'event.rsvp', payload: { event_id: 'dev-event', status: 'going' } });
    enqueueMutation({ type: 'task.create', payload: { id: 'dev-task', title: 'Offline task' } });
    setQueueSize(getQueue().length);
  };

  const processOnce = async () => {
    await processQueueOnce();
    setQueueSize(getQueue().length);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Card style={{ marginBottom: 12 }}>
        <Text style={[styles.title, { color: theme.colors.charcoal }]}>Offline Dev Harness</Text>
        <Text style={{ color: theme.colors.gray, marginBottom: 12 }}>Enqueue sample mutations and process the queue manually.</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button title="Enqueue Samples" onPress={enqueueExamples} variant="secondary" />
          <Button title="Process Queue" onPress={processOnce} />
          <Button title="Close" onPress={onClose} variant="ghost" />
        </View>
        <Text style={{ marginTop: 12, color: theme.colors.charcoal }}>Queue size: {queueSize}</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
});


