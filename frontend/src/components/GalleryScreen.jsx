import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Plus, Image, Calendar, Users, Upload } from 'lucide-react';

const GalleryScreen = () => {
  // Mock data for now
  const [albums] = useState([
    {
      id: 1,
      name: "Spring Growth 2024",
      cover: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop",
      photoCount: 24,
      createdAt: "2024-03-15",
      description: "Capturing the beautiful spring growth across our allotment"
    },
    {
      id: 2,
      name: "Harvest Festival",
      cover: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop",
      photoCount: 18,
      createdAt: "2024-02-28",
      description: "Community harvest celebration photos"
    },
    {
      id: 3,
      name: "Plot Transformations",
      cover: "https://images.unsplash.com/photo-1592150621744-aca64f48394a?w=400&h=300&fit=crop",
      photoCount: 31,
      createdAt: "2024-01-20",
      description: "Before and after shots of plot improvements"
    }
  ]);

  return (
    <div className="p-4 max-w-6xl mx-auto mt-16 md:mt-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="heading-primary">Photo Gallery</h1>
          <p className="text-gray-600">Community memories and progress photos</p>
        </div>
        
        <Button 
          className="btn-accessible bg-green-600 hover:bg-green-700"
          data-testid="upload-photos-btn"
        >
          <Upload className="mr-2" size={20} />
          Upload Photos
        </Button>
      </div>

      {/* Quick Upload Area */}
      <div className="mb-8">
        <div className="photo-upload-zone rounded-lg p-8 text-center cursor-pointer transition-all hover:scale-[1.02]">
          <Image size={48} className="mx-auto text-green-600 mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">Quick Upload</h3>
          <p className="text-gray-600 mb-4">Drag and drop your photos here, or click to select</p>
          <Button variant="outline" className="btn-accessible">
            Choose Files
          </Button>
        </div>
      </div>

      {/* Albums Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="photo-albums-grid">
        {albums.map((album) => (
          <Card key={album.id} className="plant-card overflow-hidden cursor-pointer">
            <div className="relative">
              <img
                src={album.cover}
                alt={album.name}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-3 right-3">
                <Badge variant="secondary" className="bg-black/50 text-white">
                  {album.photoCount} photos
                </Badge>
              </div>
            </div>
            
            <CardHeader>
              <CardTitle className="text-lg">{album.name}</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar size={14} />
                  <span>{new Date(album.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users size={14} />
                  <span>Community</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-gray-700 text-sm">{album.description}</p>
            </CardContent>
          </Card>
        ))}

        {/* Add New Album Card */}
        <Card className="plant-card border-dashed border-2 border-green-300 hover:border-green-500 cursor-pointer transition-colors">
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <Plus size={48} className="text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">Create New Album</h3>
            <p className="text-gray-600">Start a new photo collection</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Photos */}
      <div className="mt-12">
        <h2 className="heading-secondary mb-6">Recent Photos</h2>
        <div className="photo-grid">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="photo-item">
              <img
                src={`https://images.unsplash.com/photo-${1415604152652 + index}-6a037b7d2a37?w=300&h=300&fit=crop`}
                alt={`Recent photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GalleryScreen;