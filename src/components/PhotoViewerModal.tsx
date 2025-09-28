import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Avatar, Button } from '../design';
import { useDeletePhoto } from '../hooks/useGallery';
import { useAuthStore } from '../store/authStore';

const { width, height } = Dimensions.get('window');

interface Photo {
  id: string;
  url: string;
  caption?: string | null;
  uploaded_by: string;
  created_at: string;
  uploader: {
    full_name: string;
    avatar_url?: string;
  };
}

interface PhotoViewerModalProps {
  visible: boolean;
  onClose: () => void;
  photo: Photo | null;
  photos?: Photo[];
  initialIndex?: number;
}

export function PhotoViewerModal({
  visible,
  onClose,
  photo,
  photos = [],
  initialIndex = 0,
}: PhotoViewerModalProps) {
  const theme = useTheme();
  const { user } = useAuthStore();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const deleteMutation = useDeletePhoto();

  const currentPhoto = photos.length > 0 ? photos[currentIndex] : photo;
  const canDelete = currentPhoto && user && currentPhoto.uploaded_by === user.id;

  if (!currentPhoto) return null;

  const handleDelete = () => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(currentPhoto.id);
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete photo');
            }
          },
        },
      ]
    );
  };

  const goToPrevious = () => {
    if (photos.length > 1 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (photos.length > 1 && currentIndex < photos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: 'rgba(0, 0, 0, 0.8)' }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {currentPhoto.caption || 'Photo'}
            </Text>
            {photos.length > 1 && (
              <Text style={styles.headerSubtitle}>
                {currentIndex + 1} of {photos.length}
              </Text>
            )}
          </View>

          <View style={styles.headerActions}>
            {canDelete && (
              <TouchableOpacity
                onPress={handleDelete}
                style={styles.headerButton}
                disabled={deleteMutation.isPending}
              >
                <Ionicons 
                  name="trash" 
                  size={20} 
                  color={deleteMutation.isPending ? '#666' : '#ff4444'} 
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Photo */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: currentPhoto.url }}
            style={styles.image}
            resizeMode="contain"
          />
          
          {/* Navigation arrows */}
          {photos.length > 1 && (
            <>
              {currentIndex > 0 && (
                <TouchableOpacity
                  style={[styles.navButton, styles.navButtonLeft]}
                  onPress={goToPrevious}
                >
                  <Ionicons name="chevron-back" size={32} color="white" />
                </TouchableOpacity>
              )}
              
              {currentIndex < photos.length - 1 && (
                <TouchableOpacity
                  style={[styles.navButton, styles.navButtonRight]}
                  onPress={goToNext}
                >
                  <Ionicons name="chevron-forward" size={32} color="white" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Photo Info */}
        <View style={[styles.footer, { backgroundColor: 'rgba(0, 0, 0, 0.8)' }]}>
          <View style={styles.uploaderInfo}>
            <Avatar
              name={currentPhoto.uploader.full_name}
              imageUri={currentPhoto.uploader.avatar_url}
              size="small"
            />
            <View style={styles.uploaderText}>
              <Text style={styles.uploaderName}>
                {currentPhoto.uploader.full_name}
              </Text>
              <Text style={styles.uploadDate}>
                {new Date(currentPhoto.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
          
          {currentPhoto.caption && (
            <Text style={styles.caption}>
              {currentPhoto.caption}
            </Text>
          )}
        </View>

        {/* Thumbnails for multiple photos */}
        {photos.length > 1 && (
          <View style={styles.thumbnailsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnails}
            >
              {photos.map((photo, index) => (
                <TouchableOpacity
                  key={photo.id}
                  onPress={() => setCurrentIndex(index)}
                  style={[
                    styles.thumbnail,
                    index === currentIndex && { borderColor: theme.colors.green, borderWidth: 2 }
                  ]}
                >
                  <Image
                    source={{ uri: photo.url }}
                    style={styles.thumbnailImage}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    zIndex: 1,
  },
  headerButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: width,
    height: height - 200, // Account for header and footer
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -24 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonLeft: {
    left: 16,
  },
  navButtonRight: {
    right: 16,
  },
  footer: {
    padding: 16,
  },
  uploaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploaderText: {
    marginLeft: 12,
  },
  uploaderName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  uploadDate: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  caption: {
    color: 'white',
    fontSize: 16,
    lineHeight: 22,
  },
  thumbnailsContainer: {
    height: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  thumbnails: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 4,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
});