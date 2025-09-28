import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  Plus, 
  Image, 
  Calendar, 
  Users, 
  Upload, 
  Search,
  Download,
  Share,
  Heart,
  MessageCircle,
  X,
  ZoomIn,
  Grid3X3,
  List,
  Filter
} from 'lucide-react';

const EnhancedGalleryScreen = () => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const fileInputRef = useRef(null);

  // Enhanced mock data with more details
  const [albums, setAlbums] = useState([
    {
      id: 1,
      name: "Spring Growth 2024",
      cover: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop",
      photoCount: 24,
      createdAt: "2024-03-15",
      description: "Capturing the beautiful spring growth across our allotment",
      category: "seasonal",
      author: "Admin",
      likes: 12,
      isPublic: true,
      photos: [
        {
          id: 101,
          src: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop",
          title: "First Spring Shoots",
          description: "Young lettuce emerging in Plot 12A",
          uploadedAt: "2024-03-15T10:30:00Z",
          uploadedBy: "Admin",
          likes: 5,
          comments: ["Looking great!", "Can't wait for harvest"]
        },
        {
          id: 102,
          src: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&h=600&fit=crop",
          title: "Tomato Seedlings",
          description: "Starting tomatoes in the greenhouse",
          uploadedAt: "2024-03-16T14:15:00Z",
          uploadedBy: "Admin",
          likes: 8,
          comments: ["Perfect timing!", "Mine are just starting too"]
        }
      ]
    },
    {
      id: 2,
      name: "Harvest Festival",
      cover: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop",
      photoCount: 18,
      createdAt: "2024-02-28",
      description: "Community harvest celebration photos",
      category: "events",
      author: "Sarah Johnson",
      likes: 23,
      isPublic: true,
      photos: []
    },
    {
      id: 3,
      name: "Plot Transformations",
      cover: "https://images.unsplash.com/photo-1592150621744-aca64f48394a?w=400&h=300&fit=crop",
      photoCount: 31,
      createdAt: "2024-01-20",
      description: "Before and after shots of plot improvements",
      category: "progress",
      author: "Mike Wilson",
      likes: 15,
      isPublic: true,
      photos: []
    },
    {
      id: 4,
      name: "Pest Management",
      cover: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400&h=300&fit=crop",
      photoCount: 8,
      createdAt: "2024-04-10",
      description: "Identifying and managing common garden pests",
      category: "education",
      author: "Dr. Green Thumb",
      likes: 7,
      isPublic: false,
      photos: []
    }
  ]);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'seasonal', label: 'Seasonal' },
    { value: 'events', label: 'Events' },
    { value: 'progress', label: 'Progress' },
    { value: 'education', label: 'Educational' },
    { value: 'harvest', label: 'Harvest' }
  ];

  const filteredAlbums = albums.filter(album => {
    const matchesSearch = album.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         album.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || album.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleBulkUpload = (files) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => file.type.startsWith('image/'));
    
    console.log(`Processing ${validFiles.length} images for bulk upload`);
    // Here you would typically upload to your backend
    // For demo, we'll just show the count
    alert(`Ready to upload ${validFiles.length} photos!`);
  };

  const openPhotoViewer = (photo) => {
    setSelectedPhoto(photo);
  };

  const closePhotoViewer = () => {
    setSelectedPhoto(null);
  };

  const likePhoto = (photoId) => {
    // Handle photo like functionality
    console.log(`Liked photo ${photoId}`);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto mt-16 md:mt-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="heading-primary">Community Gallery</h1>
          <p className="text-gray-600">Memories, progress, and shared knowledge</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="hidden md:flex border border-gray-200 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="px-3"
            >
              <Grid3X3 size={16} />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="px-3"
            >
              <List size={16} />
            </Button>
          </div>

          <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
            <DialogTrigger asChild>
              <Button 
                className="btn-accessible bg-green-600 hover:bg-green-700"
                data-testid="bulk-upload-btn"
              >
                <Upload className="mr-2" size={20} />
                Upload Photos
              </Button>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Photo Upload</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-green-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors">
                  <Image size={48} className="mx-auto text-green-600 mb-4" />
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Upload Multiple Photos</h3>
                  <p className="text-gray-600 mb-4">Select multiple images to create an album or add to existing ones</p>
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Choose Photos
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleBulkUpload(e.target.files)}
                    className="hidden"
                  />
                </div>
                
                <div className="text-sm text-gray-500">
                  <p><strong>Tips:</strong></p>
                  <ul className="list-disc list-inside space-y-1 mt-1">
                    <li>Images will be automatically resized for optimal storage</li>
                    <li>Supported formats: JPG, PNG, WebP</li>
                    <li>Maximum 50 photos per upload</li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search albums and photos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="gallery-search-input"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-2 bg-white"
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Albums Grid */}
      {!selectedAlbum ? (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`} data-testid="albums-grid">
          {filteredAlbums.map((album) => (
            <Card 
              key={album.id} 
              className={`plant-card overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                viewMode === 'list' ? 'md:flex md:flex-row' : ''
              }`}
              onClick={() => setSelectedAlbum(album)}
            >
              <div className={`relative ${viewMode === 'list' ? 'md:w-48' : ''}`}>
                <img
                  src={album.cover}
                  alt={album.name}
                  className={`w-full object-cover ${
                    viewMode === 'list' ? 'h-32 md:h-full' : 'h-48'
                  }`}
                />
                <div className="absolute top-3 right-3 flex space-x-2">
                  <Badge variant="secondary" className="bg-black/50 text-white">
                    {album.photoCount} photos
                  </Badge>
                  {!album.isPublic && (
                    <Badge variant="secondary" className="bg-red-500 text-white">
                      Private
                    </Badge>
                  )}
                </div>
                <div className="absolute bottom-3 left-3">
                  <Badge className="bg-green-600 text-white capitalize">
                    {album.category}
                  </Badge>
                </div>
              </div>
              
              <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                <h3 className="font-semibold text-lg text-gray-800 mb-2">{album.name}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{album.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>{new Date(album.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users size={14} />
                      <span>{album.author}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Heart size={14} className="text-red-500" />
                    <span>{album.likes}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {/* Create New Album Card */}
          <Card className="plant-card border-dashed border-2 border-green-300 hover:border-green-500 cursor-pointer transition-colors">
            <CardContent className="flex flex-col items-center justify-center h-64 text-center">
              <Plus size={48} className="text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">Create New Album</h3>
              <p className="text-gray-600">Start a new photo collection</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Album Detail View */
        <div>
          {/* Album Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              onClick={() => setSelectedAlbum(null)}
              className="mb-4"
            >
              ← Back to Albums
            </Button>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Share size={16} className="mr-2" />
                Share Album
              </Button>
              <Button variant="outline" size="sm">
                <Download size={16} className="mr-2" />
                Download All
              </Button>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <img
                  src={selectedAlbum.cover}
                  alt={selectedAlbum.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div>
                  <CardTitle className="text-2xl">{selectedAlbum.name}</CardTitle>
                  <p className="text-gray-600 mt-1">{selectedAlbum.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>{selectedAlbum.photoCount} photos</span>
                    <span>By {selectedAlbum.author}</span>
                    <span>{new Date(selectedAlbum.createdAt).toLocaleDateString()}</span>
                    <div className="flex items-center space-x-1">
                      <Heart size={14} className="text-red-500" />
                      <span>{selectedAlbum.likes} likes</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Photos Grid */}
          <div className="photo-grid">
            {selectedAlbum.photos.map((photo) => (
              <div 
                key={photo.id} 
                className="photo-item group cursor-pointer"
                onClick={() => openPhotoViewer(photo)}
              >
                <img
                  src={photo.src}
                  alt={photo.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                  <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <h4 className="text-white font-medium text-sm">{photo.title}</h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-gray-200 text-xs">{photo.uploadedBy}</span>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <Heart size={12} className="text-red-400" />
                        <span className="text-white text-xs">{photo.likes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle size={12} className="text-blue-400" />
                        <span className="text-white text-xs">{photo.comments.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={closePhotoViewer}>
          <DialogContent className="max-w-4xl max-w-[90vw] max-h-[90vh]">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>{selectedPhoto.title}</DialogTitle>
                <Button variant="ghost" size="sm" onClick={closePhotoViewer}>
                  <X size={16} />
                </Button>
              </div>
            </DialogHeader>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <img
                  src={selectedPhoto.src}
                  alt={selectedPhoto.title}
                  className="w-full h-auto rounded-lg"
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">{selectedPhoto.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{selectedPhoto.description}</p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => likePhoto(selectedPhoto.id)}
                    className="flex items-center space-x-1"
                  >
                    <Heart size={16} className="text-red-500" />
                    <span>{selectedPhoto.likes}</span>
                  </Button>
                  
                  <div className="flex items-center space-x-1 text-gray-600">
                    <MessageCircle size={16} />
                    <span>{selectedPhoto.comments.length} comments</span>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Comments</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedPhoto.comments.map((comment, index) => (
                      <div key={index} className="text-sm">
                        <p className="text-gray-700">"{comment}"</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 border-t pt-4">
                  <p>Uploaded by {selectedPhoto.uploadedBy}</p>
                  <p>{new Date(selectedPhoto.uploadedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EnhancedGalleryScreen;