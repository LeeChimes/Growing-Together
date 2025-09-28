import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Leaf, Search, MessageCircle, Camera, Lightbulb, BookOpen } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PlantLibraryScreen = () => {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiQuery, setAIQuery] = useState({ plant_name: '', question: '', photo_base64: null });
  const [aiResponse, setAIResponse] = useState(null);
  const [aiLoading, setAILoading] = useState(false);

  useEffect(() => {
    loadPlants();
  }, []);

  const loadPlants = async () => {
    try {
      const response = await axios.get(`${API}/plants`);
      setPlants(response.data);
    } catch (error) {
      console.error('Error loading plants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAIQuery = async (e) => {
    e.preventDefault();
    if (!aiQuery.question.trim()) return;

    setAILoading(true);
    try {
      const response = await axios.post(`${API}/plants/ai-advice`, aiQuery);
      setAIResponse(response.data);
    } catch (error) {
      console.error('Error getting AI advice:', error);
      setAIResponse({
        advice: "Sorry, I'm having trouble connecting to the AI service right now. Please try again later.",
        can_save_as_task: false
      });
    } finally {
      setAILoading(false);
    }
  };

  const filteredPlants = plants.filter(plant =>
    plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plant.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plant.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-4 space-y-4 mt-16 md:mt-20">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 bg-gray-200 rounded-lg loading-skeleton"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto mt-16 md:mt-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="heading-primary">Plant Library</h1>
          <p className="text-gray-600">Your gardening knowledge hub with AI assistance</p>
        </div>
        
        <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
          <DialogTrigger asChild>
            <Button 
              className="btn-accessible bg-green-600 hover:bg-green-700"
              data-testid="ask-ai-btn"
            >
              <Lightbulb className="mr-2" size={20} />
              Ask AI
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Lightbulb className="text-yellow-500" size={24} />
                <span>AI Plant Care Assistant</span>
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleAIQuery} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Plant (Optional)</label>
                <Input
                  placeholder="e.g., Tomatoes, Carrots"
                  value={aiQuery.plant_name}
                  onChange={(e) => setAIQuery({ ...aiQuery, plant_name: e.target.value })}
                  data-testid="ai-plant-name-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Your Question</label>
                <Textarea
                  placeholder="Describe your plant issue or ask for advice..."
                  value={aiQuery.question}
                  onChange={(e) => setAIQuery({ ...aiQuery, question: e.target.value })}
                  rows={4}
                  required
                  data-testid="ai-question-input"
                />
              </div>

              <div>
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center space-x-2"
                  data-testid="ai-photo-upload-btn"
                >
                  <Camera size={16} />
                  <span>Add Plant Photo (Optional)</span>
                </Button>
                <p className="text-sm text-gray-500 mt-1">
                  Photos help the AI provide more accurate advice
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAIDialog(false);
                    setAIResponse(null);
                    setAIQuery({ plant_name: '', question: '', photo_base64: null });
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={aiLoading}
                  data-testid="ai-submit-btn"
                >
                  {aiLoading ? 'Thinking...' : 'Get AI Advice'}
                </Button>
              </div>
            </form>

            {/* AI Response */}
            {aiResponse && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Lightbulb className="text-green-600" size={20} />
                  <h3 className="font-semibold text-green-800">AI Advice</h3>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap mb-4">{aiResponse.advice}</p>
                
                {aiResponse.can_save_as_task && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-white border-green-300 hover:bg-green-50"
                    data-testid="save-as-task-btn"
                  >
                    💾 Save as Task
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search plants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="plant-search-input"
          />
        </div>
      </div>

      {/* Plants Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="plants-grid">
        {filteredPlants.length > 0 ? (
          filteredPlants.map((plant) => (
            <Card key={plant.id} className="plant-card hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-center justify-between mb-3">
                  <CardTitle className="text-xl text-green-800">{plant.name}</CardTitle>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {plant.category}
                  </Badge>
                </div>
                
                {plant.scientific_name && (
                  <p className="text-sm italic text-gray-600">{plant.scientific_name}</p>
                )}
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-700 mb-4">{plant.description}</p>
                
                {/* Care Instructions */}
                {plant.care_instructions && Object.keys(plant.care_instructions).length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                      <Leaf size={16} className="mr-2 text-green-600" />
                      Care Tips
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(plant.care_instructions).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="font-medium capitalize text-gray-700">{key}: </span>
                          <span className="text-gray-600">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Planting Guide */}
                {plant.planting_guide && Object.keys(plant.planting_guide).length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                      <BookOpen size={16} className="mr-2 text-blue-600" />
                      Planting Guide
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(plant.planting_guide).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="font-medium capitalize text-gray-700">{key.replace('_', ' ')}: </span>
                          <span className="text-gray-600">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex space-x-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => {
                      setAIQuery({ ...aiQuery, plant_name: plant.name });
                      setShowAIDialog(true);
                    }}
                    data-testid={`ask-ai-about-${plant.name.toLowerCase().replace(' ', '-')}`}
                  >
                    <MessageCircle size={14} className="mr-1" />
                    Ask AI
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Leaf size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {searchQuery ? 'No plants found' : 'No plants in library'}
            </h3>
            <p className="text-gray-500">
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : 'The plant library is being populated'
              }
            </p>
          </div>
        )}
      </div>

      {/* Featured Tips */}
      <div className="mt-12">
        <h2 className="heading-secondary mb-6">Featured Growing Tips</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">🌱 Companion Planting</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Plant basil near tomatoes to improve their flavor and repel pests. Carrots and onions 
                also make great companions, as onions help deter carrot flies.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">💧 Watering Wisdom</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Water deeply but less frequently to encourage strong root growth. Early morning 
                watering is best as it gives plants time to absorb moisture before the heat of the day.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PlantLibraryScreen;