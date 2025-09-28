import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { 
  Camera, 
  Upload, 
  X, 
  Plus,
  Cloud,
  Sun,
  CloudRain,
  Thermometer,
  Lightbulb,
  Tag,
  MapPin
} from 'lucide-react';

const EnhancedDiaryModal = ({ open, onClose, onSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState({
    plot_number: initialData.plot_number || '',
    entry_type: initialData.entry_type || 'general',
    title: initialData.title || '',
    content: initialData.content || '',
    photos: initialData.photos || [],
    tags: initialData.tags || [],
    weather_condition: '',
    temperature: '',
    location_details: ''
  });

  const [newTag, setNewTag] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const entryTypes = [
    { 
      value: 'sowing', 
      label: 'Sowing Seeds', 
      color: 'bg-green-100 text-green-800',
      smartTemplate: {
        title: 'Sowing Session - {{date}}',
        content: 'Seeds planted: \n- \n\nPlanting details:\n- Location: \n- Depth: \n- Spacing: \n- Soil condition: \n\nWeather: {{weather}}\nNext steps: \n- Water gently\n- Monitor for germination\n- Protect from pests'
      }
    },
    { 
      value: 'watering', 
      label: 'Watering', 
      color: 'bg-blue-100 text-blue-800',
      smartTemplate: {
        title: 'Watering Session - {{date}}',
        content: 'Areas watered:\n- \n\nWatering details:\n- Duration: \n- Method: (sprinkler/hand/drip)\n- Amount: \n\nSoil condition:\n- Before: \n- After: \n\nWeather: {{weather}}\nNotes: '
      }
    },
    { 
      value: 'harvest', 
      label: 'Harvest', 
      color: 'bg-orange-100 text-orange-800',
      smartTemplate: {
        title: 'Harvest Day - {{date}}',
        content: 'Harvested today:\n- \n\nHarvest details:\n- Quantity: \n- Quality: \n- Size/Weight: \n\nStorage method: \n- \n\nNext harvest expected: \nNotes: '
      }
    },
    { 
      value: 'maintenance', 
      label: 'Maintenance & Care', 
      color: 'bg-purple-100 text-purple-800',
      smartTemplate: {
        title: 'Maintenance Work - {{date}}',
        content: 'Tasks completed:\n- \n\nMaintenance details:\n- Tools used: \n- Time taken: \n- Materials: \n\nCondition assessment:\n- Before: \n- After: \n\nNext maintenance due: \nNotes: '
      }
    },
    { 
      value: 'pest_disease', 
      label: 'Pest & Disease', 
      color: 'bg-red-100 text-red-800',
      smartTemplate: {
        title: 'Pest/Disease Management - {{date}}',
        content: 'Issue identified:\n- Type: \n- Severity: \n- Affected plants: \n\nTreatment applied:\n- Method: \n- Products used: \n- Coverage area: \n\nResults expected: \nFollow-up required: '
      }
    },
    { 
      value: 'fertilizing', 
      label: 'Fertilizing', 
      color: 'bg-yellow-100 text-yellow-800',
      smartTemplate: {
        title: 'Fertilizing - {{date}}',
        content: 'Fertilizer application:\n- Type: \n- Brand/NPK ratio: \n- Amount: \n- Application method: \n\nArea covered:\n- \n\nSoil condition: \nWeather: {{weather}}\nNext application: '
      }
    },
    { 
      value: 'general', 
      label: 'General Observation', 
      color: 'bg-gray-100 text-gray-800',
      smartTemplate: {
        title: 'Plot Visit - {{date}}',
        content: 'Today\'s observations:\n\nPlant progress:\n- \n\nWeather impact: {{weather}}\n\nTasks for next visit:\n- \n\nNotes: '
      }
    }
  ];

  const weatherOptions = [
    { value: 'sunny', label: 'Sunny', icon: Sun },
    { value: 'cloudy', label: 'Cloudy', icon: Cloud },
    { value: 'rainy', label: 'Rainy', icon: CloudRain },
    { value: 'overcast', label: 'Overcast', icon: Cloud }
  ];

  const applySmartTemplate = (type) => {
    const template = entryTypes.find(t => t.value === type)?.smartTemplate;
    if (template) {
      const currentDate = new Date().toLocaleDateString();
      const weatherText = formData.weather_condition 
        ? `${formData.weather_condition}${formData.temperature ? `, ${formData.temperature}°C` : ''}`
        : '[Weather conditions]';
      
      const title = template.title
        .replace('{{date}}', currentDate);
      
      const content = template.content
        .replace(/{{date}}/g, currentDate)
        .replace(/{{weather}}/g, weatherText);
      
      setFormData({
        ...formData,
        entry_type: type,
        title,
        content
      });
    }
  };

  const handleFileSelect = (files) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => file.type.startsWith('image/'));
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newPhoto = {
          id: Date.now() + Math.random(),
          src: e.target.result,
          name: file.name,
          size: file.size
        };
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, newPhoto]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (photoId) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter(photo => photo.id !== photoId)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>📖 Enhanced Diary Entry</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="plot_number">Plot Number</Label>
              <Input
                id="plot_number"
                value={formData.plot_number}
                onChange={(e) => setFormData({ ...formData, plot_number: e.target.value })}
                required
                placeholder="e.g. 12A"
                data-testid="enhanced-diary-plot-input"
              />
            </div>
            
            <div>
              <Label htmlFor="entry_type">Entry Type</Label>
              <Select
                value={formData.entry_type}
                onValueChange={(value) => applySmartTemplate(value)}
              >
                <SelectTrigger data-testid="enhanced-diary-type-select">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {entryTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <Badge className={type.color}>
                          {type.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="weather_condition">Weather</Label>
              <Select
                value={formData.weather_condition}
                onValueChange={(value) => setFormData({ ...formData, weather_condition: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select weather" />
                </SelectTrigger>
                <SelectContent>
                  {weatherOptions.map((weather) => {
                    const Icon = weather.icon;
                    return (
                      <SelectItem key={weather.value} value={weather.value}>
                        <div className="flex items-center space-x-2">
                          <Icon size={16} />
                          <span>{weather.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Weather Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="temperature">Temperature (°C)</Label>
              <Input
                id="temperature"
                type="number"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                placeholder="e.g. 22"
              />
            </div>
            
            <div>
              <Label htmlFor="location_details">Specific Location</Label>
              <Input
                id="location_details"
                value={formData.location_details}
                onChange={(e) => setFormData({ ...formData, location_details: e.target.value })}
                placeholder="e.g. North corner, Greenhouse A"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Entry Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              data-testid="enhanced-diary-title-input"
            />
          </div>

          {/* Smart Template Suggestion */}
          {formData.entry_type && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Lightbulb className="text-blue-600" size={16} />
                  <span className="text-sm font-medium text-blue-800">Smart Template Applied</span>
                </div>
                <p className="text-sm text-blue-700">
                  Template for {entryTypes.find(t => t.value === formData.entry_type)?.label} has been applied with helpful prompts and structure.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Content */}
          <div>
            <Label htmlFor="content">Entry Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              rows={10}
              className="font-mono text-sm"
              data-testid="enhanced-diary-content-input"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <Label>Photos</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragOver 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Camera size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600 mb-2">Drag photos here or click to upload</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={16} className="mr-2" />
                Choose Photos
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>

            {/* Photo Preview */}
            {formData.photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {formData.photos.map((photo) => (
                  <div key={photo.id} className="relative">
                    <img
                      src={photo.src}
                      alt="Upload preview"
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => removePhoto(photo.id)}
                    >
                      <X size={12} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex items-center space-x-2 mb-2">
              <Input
                placeholder="Add a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1"
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus size={16} />
              </Button>
            </div>
            
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="flex items-center space-x-1">
                    <Tag size={12} />
                    <span>{tag}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => removeTag(tag)}
                    >
                      <X size={8} />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              data-testid="enhanced-diary-submit-btn"
            >
              Save Entry
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedDiaryModal;