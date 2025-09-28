import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, useTheme } from '../design';

interface PhotoWithCaption {
  uri: string;
  caption: string;
}

interface PhotoCaptionModalProps {
  visible: boolean;
  onClose: () => void;
  photos: string[];
  onSubmit: (photosWithCaptions: PhotoWithCaption[]) => void;
  loading?: boolean;
}

export function PhotoCaptionModal({
  visible,
  onClose,
  photos,
  onSubmit,
  loading = false,
}: PhotoCaptionModalProps) {
  const theme = useTheme();
  const [photosWithCaptions, setPhotosWithCaptions] = useState<PhotoWithCaption[]>(
    photos.map(uri => ({ uri, caption: '' }))
  );

  const updateCaption = (index: number, caption: string) => {
    const updated = [...photosWithCaptions];
    updated[index].caption = caption;
    setPhotosWithCaptions(updated);
  };

  const handleSubmit = () => {
    onSubmit(photosWithCaptions);
  };

  const handleSkip = () => {
    onSubmit(photos.map(uri => ({ uri, caption: '' })));
  };

  const renderPhotoItem = ({ item, index }: { item: PhotoWithCaption; index: number }) => (
    <View style={styles.photoItem}>
      <Image source={{ uri: item.uri }} style={styles.photoPreview} />
      <View style={styles.captionContainer}>
        <Text style={[styles.photoNumber, { color: theme.colors.charcoal }]}>
          Photo {index + 1} of {photos.length}
        </Text>
        <TextInput
          style={[
            styles.captionInput,
            {
              borderColor: theme.colors.grayLight,
              color: theme.colors.charcoal,
            }
          ]}
          value={item.caption}
          onChangeText={(text) => updateCaption(index, text)}
          placeholder="Add a caption (optional)..."
          placeholderTextColor={theme.colors.gray}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          maxLength={200}
        />
        <Text style={[styles.charCount, { color: theme.colors.gray }]}>
          {item.caption.length}/200
        </Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: theme.colors.grayLight }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.colors.charcoal} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.charcoal }]}>
            Add Captions
          </Text>
          <View style={styles.headerActions}>
            <Button
              title="Skip"
              onPress={handleSkip}
              size="small"
              variant="outline"
              disabled={loading}
            />
            <Button
              title="Upload"
              onPress={handleSubmit}
              size="small"
              loading={loading}
              style={{ marginLeft: 8 }}
            />
          </View>
        </View>

        <View style={styles.content}>
          <View style={[styles.infoCard, { backgroundColor: theme.colors.greenBg }]}>
            <Ionicons name="information-circle" size={20} color={theme.colors.green} />
            <Text style={[styles.infoText, { color: theme.colors.charcoal }]}>
              Add captions to help others understand your photos. You can skip this step if you prefer.
            </Text>
          </View>

          <FlatList
            data={photosWithCaptions}
            renderItem={renderPhotoItem}
            keyExtractor={(_, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        </View>
      </SafeAreaView>
    </Modal>
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
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },
  listContent: {
    gap: 16,
  },
  photoItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 16,
  },
  photoPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  captionContainer: {
    flex: 1,
  },
  photoNumber: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  captionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
});