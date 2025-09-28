import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  Plus, 
  Calendar, 
  MapPin, 
  Camera, 
  Droplets,
  Scissors,
  Shovel,
  Wrench,
  BookOpen,
  Filter
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DiaryScreen = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [selectedPlot, setSelectedPlot] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    plot_number: '',
    entry_type: 'general',
    title: '',
    content: '',
    photos: [],
    tags: []
  });

  // Entry type templates
  const entryTypes = [
    { 
      value: 'sowing', 
      label: 'Sowing', 
      icon: Shovel, 
      color: 'bg-green-100 text-green-800',
      template: {
        title: 'Sowing Session',
        content: 'Seeds planted:\n- \n\nLocation: \nDepth: \nSpacing: \n\nConditions: \nNext steps: '
      }
    },
    { 
      value: 'watering', 
      label: 'Watering', 
      icon: Droplets, 
      color: 'bg-blue-100 text-blue-800',
      template: {
        title: 'Watering Session',
        content: 'Areas watered:\n- \n\nDuration: \nMethod: \n\nSoil condition before: \nWeather: \nNotes: '
      }
    },
    { 
      value: 'harvest', 
      label: 'Harvest', 
      icon: Scissors, 
      color: 'bg-yellow-100 text-yellow-800',
      template: {
        title: 'Harvest Day',
        content: 'Harvested:\n- \n\nQuantity: \nQuality: \n\nStorage method: \nNext harvest expected: '
      }
    },
    { 
      value: 'maintenance', 
      label: 'Maintenance', 
      icon: Wrench, 
      color: 'bg-purple-100 text-purple-800',
      template: {
        title: 'Maintenance Work',
        content: 'Tasks completed:\n- \n\nTools used: \nTime taken: \n\nCondition before: \nCondition after: \nNext maintenance: '
      }
    },
    { 
      value: 'general', 
      label: 'General', 
      icon: BookOpen, 
      color: 'bg-gray-100 text-gray-800',
      template: {
        title: 'General Entry',
        content: 'What happened today:\n\n\nObservations:\n\nPlan for next visit:'
      }
    }
  ];

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const response = await axios.get(`${API}/diary`);
      setEntries(response.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      console.error('Error loading diary entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/diary`, formData);
      setEntries([response.data, ...entries]);
      setShowAddForm(false);
      setFormData({
        plot_number: '',
        entry_type: 'general',
        title: '',
        content: '',
        photos: [],
        tags: []
      });
    } catch (error) {
      console.error('Error creating diary entry:', error);
    }
  };

  const applyTemplate = (type) => {
    const template = entryTypes.find(t => t.value === type)?.template;
    if (template) {
      setFormData({
        ...formData,
        entry_type: type,
        title: template.title,
        content: template.content
      });
    }
  };

  const filteredEntries = entries.filter(entry => {
    if (filterType !== 'all' && entry.entry_type !== filterType) return false;
    if (selectedPlot && entry.plot_number !== selectedPlot) return false;
    return true;
  });

  // Get unique plot numbers for filter
  const plotNumbers = [...new Set(entries.map(entry => entry.plot_number))].sort();

  if (loading) {
    return (
      <div className="p-4 space-y-4 mt-16 md:mt-20">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg loading-skeleton"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto mt-16 md:mt-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="heading-primary">Plot Diary</h1>
          <p className="text-gray-600">Track your allotment journey</p>
        </div>
        
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button 
              className="btn-accessible bg-green-600 hover:bg-green-700"
              data-testid="add-diary-entry-btn"
            >
              <Plus className="mr-2" size={20} />
              Add Entry
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Diary Entry</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plot_number">Plot Number</Label>
                  <Input
                    id="plot_number"
                    value={formData.plot_number}
                    onChange={(e) => setFormData({ ...formData, plot_number: e.target.value })}
                    required
                    placeholder="e.g. 12A"
                    data-testid="diary-plot-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="entry_type">Entry Type</Label>
                  <Select
                    value={formData.entry_type}
                    onValueChange={(value) => {
                      setFormData({ ...formData, entry_type: value });
                      applyTemplate(value);
                    }}
                  >
                    <SelectTrigger data-testid="diary-type-select">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {entryTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center space-x-2">
                            <type.icon size={16} />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  data-testid="diary-title-input"
                />
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  rows={8}
                  data-testid="diary-content-input"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="diary-submit-btn"
                >
                  Save Entry
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Template Buttons */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Templates</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {entryTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Button
                key={type.value}
                variant="outline"
                size="sm"
                className={`btn-accessible h-16 flex-col space-y-1 ${type.color}`}
                onClick={() => {
                  applyTemplate(type.value);
                  setShowAddForm(true);
                }}
                data-testid={`template-${type.value}-btn`}
              >
                <Icon size={20} />
                <span className="text-xs">{type.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Filter size={16} />
          <span className="font-medium text-sm">Filters:</span>
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {entryTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {plotNumbers.length > 0 && (
          <Select value={selectedPlot} onValueChange={setSelectedPlot}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All plots" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plots</SelectItem>
              {plotNumbers.map((plot) => (
                <SelectItem key={plot} value={plot}>
                  Plot {plot}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {(filterType !== 'all' || selectedPlot) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFilterType('all');
              setSelectedPlot('');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Entries Timeline */}
      <div className="space-y-4" data-testid="diary-entries-list">
        {filteredEntries.length > 0 ? (
          filteredEntries.map((entry) => {
            const entryType = entryTypes.find(t => t.value === entry.entry_type);
            const Icon = entryType?.icon || BookOpen;
            
            return (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${entryType?.color || 'bg-gray-100 text-gray-800'}`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{entry.title}</CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <div className="flex items-center space-x-1">
                            <MapPin size={14} />
                            <span>Plot {entry.plot_number}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar size={14} />
                            <span>{new Date(entry.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Badge variant="secondary" className={entryType?.color}>
                      {entryType?.label || 'General'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap mb-4">{entry.content}</p>
                  
                  {entry.photos && entry.photos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                      {entry.photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Entry photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        />
                      ))}
                    </div>
                  )}
                  
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No diary entries yet</h3>
            <p className="text-gray-500 mb-4">
              {filterType !== 'all' || selectedPlot 
                ? 'No entries match your current filters' 
                : 'Start documenting your allotment journey!'
              }
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="mr-2" size={16} />
              Add Your First Entry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiaryScreen;