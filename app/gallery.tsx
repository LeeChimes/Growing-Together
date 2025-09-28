import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { 
  Button, 
  FAB, 
  Card, 
  EmptyState, 
  ImageTile, 
  useTheme,
  Avatar 
} from '../src/design';
import {
  useAlbums,
  usePhotos,
  useUploadPhotos,
  useGalleryStats,
} from '../src/hooks/useGallery';
import { CreateAlbumModal } from '../src/components/CreateAlbumModal';
import { PhotoViewerModal } from '../src/components/PhotoViewerModal';
import { PhotoCaptionModal } from '../src/components/PhotoCaptionModal';

const { width } = Dimensions.get('window');
const ALBUM_SIZE = (width - 48) / 2; // 2 columns with padding
const PHOTO_SIZE = (width - 64) / 3; // 3 columns with padding

type ViewMode = 'albums' | 'photos';

export default function GalleryScreen() {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('albums');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    visible: boolean;
    current: number;
    total: number;
  }>({ visible: false, current: 0, total: 0 });
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
  const [showCaptionModal, setShowCaptionModal] = useState(false);

  // Data hooks
  const albumsQuery = useAlbums();
  const photosQuery = usePhotos(selectedAlbum || undefined);
  const statsQuery = useGalleryStats();
  const uploadMutation = useUploadPhotos();

  const albums = albumsQuery.data || [];
  const photos = photosQuery.data || [];

  // Filter albums by search
  const filteredAlbums = albums.filter(album =>
    album.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (album.description && album.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filter photos by search
  const filteredPhotos = photos.filter(photo =>
    photo.caption?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBulkUpload = async () => {
    try {
      // Request permission first
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please grant access to your photo library to upload images.');
        return;
      }

      // Launch image picker for multiple images
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10, // Limit to 10 images
      });

      if (!result.canceled && result.assets.length > 0) {
        const imageUris = result.assets.map(asset => asset.uri);
        setPendingPhotos(imageUris);
        setShowCaptionModal(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to access photo library');
    }
  };

  const handlePhotosWithCaptions = async (photosWithCaptions: Array<{uri: string; caption: string}>) => {
    setShowCaptionModal(false);
    setUploadProgress({ visible: true, current: 0, total: photosWithCaptions.length });

    try {
      const imageUris = photosWithCaptions.map(p => p.uri);
      const captions = photosWithCaptions.map(p => p.caption);
      
      await uploadMutation.mutateAsync({
        photos: imageUris,
        albumId: selectedAlbum || undefined,
        captions,
      });
      
      Alert.alert('Success', `${photosWithCaptions.length} photos uploaded successfully!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to upload some photos. Please try again.');
    } finally {
      setUploadProgress({ visible: false, current: 0, total: 0 });
      setPendingPhotos([]);
    }
  };

  const handleQuickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadMutation.mutateAsync({
          photos: [result.assets[0].uri],
          albumId: selectedAlbum || undefined,
        });
        Alert.alert('Success', 'Photo uploaded successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload photo');
    }
  };

  const renderAlbumCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.albumCard, { width: ALBUM_SIZE }]}
      onPress={() => {
        setSelectedAlbum(item.id);
        setViewMode('photos');
      }}
    >
      <Card style={styles.albumCardInner}>
        {item.cover_photo_url ? (
          <ImageTile
            imageUri={item.cover_photo_url}
            size={ALBUM_SIZE - 32}
            aspectRatio={4/3}
          />
        ) : (
          <View style={[styles.albumPlaceholder, { width: ALBUM_SIZE - 32, height: (ALBUM_SIZE - 32) * 0.75 }]}>
            <Ionicons name="images" size={32} color={theme.colors.gray} />
          </View>
        )}
        
        <View style={styles.albumInfo}>
          <Text style={[styles.albumName, { color: theme.colors.charcoal }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.albumMeta}>
            <Text style={[styles.albumCount, { color: theme.colors.gray }]}>
              {item.photo_count} photos
            </Text>
            {item.is_private && (
              <Ionicons name="lock-closed" size={12} color={theme.colors.warning} />
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderPhotoTile = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity
      style={styles.photoTile}
      onPress={() => {
        setSelectedPhoto({ photo: item, photos: filteredPhotos, initialIndex: index });
        setShowPhotoViewer(true);
      }}
    >
      <ImageTile
        imageUri={item.url}
        size={PHOTO_SIZE}
        aspectRatio={1}
      />
      {item.caption && (
        <View style={[styles.photoCaptionOverlay, { backgroundColor: theme.colors.charcoal + 'CC' }]}>
          <Text style={[styles.photoCaption, { color: 'white' }]} numberOfLines={2}>
            {item.caption}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: 'white', borderColor: theme.colors.grayLight }]}>
        <Ionicons name="search" size={20} color={theme.colors.gray} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.charcoal }]}
          placeholder={`Search ${viewMode}...`}
          placeholderTextColor={theme.colors.gray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.colors.gray} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* View Mode Toggle */}
      <View style={[styles.toggleContainer, { backgroundColor: 'white', borderColor: theme.colors.grayLight }]}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'albums' && { backgroundColor: theme.colors.green }
          ]}
          onPress={() => {
            setViewMode('albums');
            setSelectedAlbum(null);
          }}
        >
          <Ionicons 
            name="albums" 
            size={18} 
            color={viewMode === 'albums' ? 'white' : theme.colors.gray} 
          />
          <Text style={[
            styles.toggleText,
            { color: viewMode === 'albums' ? 'white' : theme.colors.gray }
          ]}>
            Albums
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'photos' && { backgroundColor: theme.colors.green }
          ]}
          onPress={() => setViewMode('photos')}
        >
          <Ionicons 
            name="images" 
            size={18} 
            color={viewMode === 'photos' ? 'white' : theme.colors.gray} 
          />
          <Text style={[
            styles.toggleText,
            { color: viewMode === 'photos' ? 'white' : theme.colors.gray }
          ]}>
            Photos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      {statsQuery.data && (
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.green }]}>
                {statsQuery.data.myAlbums}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.gray }]}>My Albums</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.green }]}>
                {statsQuery.data.myPhotos}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.gray }]}>My Photos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.green }]}>
                {statsQuery.data.totalPhotos}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.gray }]}>Total Photos</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Selected Album Header */}
      {viewMode === 'photos' && selectedAlbum && (
        <View style={styles.albumHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setViewMode('albums');
              setSelectedAlbum(null);
            }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.charcoal} />
          </TouchableOpacity>
          <Text style={[styles.albumHeaderTitle, { color: theme.colors.charcoal }]}>
            {albums.find(a => a.id === selectedAlbum)?.name || 'Album'}
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => {
    if (viewMode === 'albums') {
      return (
        <EmptyState
          icon="albums"
          title="No Albums Yet"
          description="Create your first album to organize your garden photos"
          actionLabel="Create Album"
          onAction={() => setShowCreateAlbum(true)}
        />
      );
    } else {
      return (
        <EmptyState
          icon="images"
          title="No Photos Yet"
          description={selectedAlbum ? "This album is empty" : "Upload your first photos to get started"}
          actionLabel="Upload Photos"
          onAction={handleBulkUpload}
        />
      );
    }
  };

  const isLoading = albumsQuery.isLoading || photosQuery.isLoading;
  const isRefreshing = albumsQuery.isFetching || photosQuery.isFetching;

  const currentData = viewMode === 'albums' ? filteredAlbums : filteredPhotos;
  const hasData = currentData.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.green} />
          <Text style={[styles.loadingText, { color: theme.colors.gray }]}>
            Loading gallery...
          </Text>
        </View>
      ) : hasData ? (
        <FlatList
          data={currentData}
          renderItem={({ item, index }) => 
            viewMode === 'albums' ? renderAlbumCard({ item }) : renderPhotoTile({ item, index })
          }
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'albums' ? 2 : 3}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={viewMode === 'albums' ? styles.albumRow : styles.photoRow}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                albumsQuery.refetch();
                photosQuery.refetch();
              }}
              colors={[theme.colors.green]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptyState()
      )}

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        {viewMode === 'albums' ? (
          <FAB
            icon="add"
            onPress={() => setShowCreateAlbum(true)}
            label="Create Album"
            style={{ backgroundColor: theme.colors.green }}
          />
        ) : (
          <>
            <FAB
              icon="images"
              onPress={handleBulkUpload}
              label="Bulk Upload"
              style={{ backgroundColor: theme.colors.green, marginRight: 12 }}
              size="small"
            />
            <FAB
              icon="camera"
              onPress={handleQuickPhoto}
              label="Quick Photo"
              style={{ backgroundColor: theme.colors.blue }}
              size="small"
            />
          </>
        )}
      </View>

      {/* Upload Progress Modal */}
      <Modal visible={uploadProgress.visible} transparent>
        <View style={styles.progressOverlay}>
          <Card style={styles.progressCard}>
            <ActivityIndicator size="large" color={theme.colors.green} />
            <Text style={[styles.progressTitle, { color: theme.colors.charcoal }]}>
              Uploading Photos
            </Text>
            <Text style={[styles.progressText, { color: theme.colors.gray }]}>
              {uploadProgress.current} of {uploadProgress.total} photos uploaded
            </Text>
            <View style={[styles.progressBar, { backgroundColor: theme.colors.grayLight }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: theme.colors.green,
                    width: `${(uploadProgress.current / uploadProgress.total) * 100}%`
                  }
                ]} 
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* Create Album Modal */}
      <CreateAlbumModal
        visible={showCreateAlbum}
        onClose={() => setShowCreateAlbum(false)}
      />

      {/* Photo Viewer Modal */}
      <PhotoViewerModal
        visible={showPhotoViewer}
        onClose={() => {
          setShowPhotoViewer(false);
          setSelectedPhoto(null);
        }}
        photo={selectedPhoto?.photo}
        photos={selectedPhoto?.photos}
        initialIndex={selectedPhoto?.initialIndex}
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
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsCard: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  albumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  albumHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  albumRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  photoRow: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  albumCard: {
    marginBottom: 16,
  },
  albumCardInner: {
    padding: 16,
    alignItems: 'center',
  },
  albumPlaceholder: {
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  albumInfo: {
    marginTop: 12,
    alignItems: 'center',
    width: '100%',
  },
  albumName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  albumMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  albumCount: {
    fontSize: 14,
  },
  photoTile: {
    marginBottom: 8,
    position: 'relative',
  },
  photoCaptionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 6,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  photoCaption: {
    fontSize: 10,
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  progressCard: {
    padding: 24,
    alignItems: 'center',
    minWidth: 200,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  progressText: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});