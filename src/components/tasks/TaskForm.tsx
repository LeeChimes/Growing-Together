// components/tasks/TaskForm.tsx
import { useState } from 'react';
import { View, TextInput, Button, Image, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { useCreateTask } from '../../hooks/useTasks';

export default function TaskForm({ onCreated, onCancel }: { onCreated?: () => void; onCancel?: () => void }) {
  const create = useCreateTask();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  async function pickImage() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!res.canceled) setImageUri(res.assets[0].uri);
  }

  async function uploadToStorage(uri: string): Promise<string> {
    const file = await fetch(uri).then(r => r.blob());
    const ext = (file.type?.split('/')[1] ?? 'jpg').split(';')[0];
    const path = `tasks/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('task-images').upload(path, file, {
      contentType: file.type ?? 'image/jpeg',
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from('task-images').getPublicUrl(path);
    return data.publicUrl;
  }

  async function onSubmit() {
    let image_url: string | undefined = undefined;
    if (imageUri) image_url = await uploadToStorage(imageUri);
    await create.mutateAsync({ title, description, image_url });
    onCreated?.();
    setTitle(''); setDescription(''); setImageUri(null);
  }

  return (
    <View style={{ gap: 12 }}>
      <TextInput
        placeholder="Task title (e.g. Mow plot 54)"
        value={title}
        onChangeText={setTitle}
        style={{ padding: 12, borderWidth: 1, borderRadius: 10 }}
      />
      <TextInput
        placeholder="Describe the task"
        value={description}
        onChangeText={setDescription}
        multiline
        style={{ padding: 12, borderWidth: 1, borderRadius: 10, minHeight: 80 }}
      />
      {imageUri ? <Image source={{ uri: imageUri }} style={{ width: '100%', height: 180, borderRadius: 10 }} /> : null}
      <Button title={imageUri ? 'Change Photo' : 'Add Photo'} onPress={pickImage} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Button title="Cancel" onPress={onCancel} />
        <Button title="Create Task" onPress={onSubmit} disabled={!title.trim() || create.isPending} />
      </View>
    </View>
  );
}

