// Advanced AI Assistant Service
import axios from 'axios';

class AIAssistant {
  constructor() {
    this.BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
    this.API = `${this.BACKEND_URL}/api`;
    this.conversationHistory = [];
    this.userPreferences = {};
    this.plantDatabase = [];
    this.loadPreferences();
  }

  async loadPreferences() {
    try {
      const stored = localStorage.getItem('ai_assistant_preferences');
      if (stored) {
        this.userPreferences = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load AI preferences:', error);
    }
  }

  savePreferences() {
    localStorage.setItem('ai_assistant_preferences', JSON.stringify(this.userPreferences));
  }

  // Enhanced Plant Care Assistant
  async getPlantCareAdvice(query) {
    try {
      const response = await axios.post(`${this.API}/plants/ai-advice`, {
        plant_name: query.plantName || '',
        question: query.question,
        photo_base64: query.photo || null,
        context: {
          season: this.getCurrentSeason(),
          location: query.location || 'UK',
          experience_level: this.userPreferences.experienceLevel || 'beginner',
          previous_issues: query.previousIssues || [],
          garden_type: 'allotment'
        }
      });

      const advice = response.data.advice;
      
      // Add to conversation history
      this.addToHistory('plant_care', query, advice);
      
      return {
        advice,
        actionableSteps: this.extractActionableSteps(advice),
        suggestedTasks: this.generateTaskSuggestions(query, advice),
        followUpQuestions: this.generateFollowUpQuestions(query, advice),
        severity: this.assessIssueSeverity(query, advice),
        confidenceScore: response.data.confidence || 0.8
      };
    } catch (error) {
      console.error('AI plant care advice failed:', error);
      return this.getFallbackPlantAdvice(query);
    }
  }

  // Automated Task Suggestions
  async generateTaskSuggestions(userContext) {
    const { plotNumber, recentEntries, weather, season } = userContext;
    
    const suggestions = [];
    
    // Weather-based suggestions
    if (weather) {
      if (weather.condition.includes('Rain') && weather.precipitation > 70) {
        suggestions.push({
          type: 'weather_alert',
          title: 'Avoid Watering',
          description: 'Heavy rain expected - skip watering for next 2-3 days',
          priority: 'high',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
      }
      
      if (weather.wind_speed > 15) {
        suggestions.push({
          type: 'protection',
          title: 'Protect Tender Plants',
          description: 'Strong winds forecasted - secure plant supports and covers',
          priority: 'medium',
          dueDate: new Date()
        });
      }
      
      if (weather.temperature > 25) {
        suggestions.push({
          type: 'care',
          title: 'Extra Watering Needed',
          description: 'High temperatures expected - ensure adequate watering',
          priority: 'medium',
          dueDate: new Date()
        });
      }
    }
    
    // Season-based suggestions
    const seasonalTasks = this.getSeasonalTasks(season);
    suggestions.push(...seasonalTasks);
    
    // Entry-based suggestions
    if (recentEntries) {
      const entryBasedTasks = this.analyzeEntriesForTasks(recentEntries);
      suggestions.push(...entryBasedTasks);
    }
    
    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  getSeasonalTasks(season = this.getCurrentSeason()) {
    const tasks = {
      spring: [
        {
          type: 'planting',
          title: 'Start Seed Sowing',
          description: 'Begin sowing hardy vegetables like peas, broad beans, and onions',
          priority: 'high'
        },
        {
          type: 'maintenance',
          title: 'Prepare Soil',
          description: 'Add compost and prepare beds for planting season',
          priority: 'high'
        }
      ],
      summer: [
        {
          type: 'care',
          title: 'Regular Watering Schedule',
          description: 'Establish consistent watering routine for all plants',
          priority: 'high'
        },
        {
          type: 'harvest',
          title: 'Harvest Ready Crops',
          description: 'Check for ready vegetables and harvest regularly',
          priority: 'medium'
        }
      ],
      autumn: [
        {
          type: 'harvest',
          title: 'Main Harvest Season',
          description: 'Harvest root vegetables and preserve for winter',
          priority: 'high'
        },
        {
          type: 'planting',
          title: 'Winter Crop Planting',
          description: 'Plant winter vegetables like kale and brussels sprouts',
          priority: 'medium'
        }
      ],
      winter: [
        {
          type: 'planning',
          title: 'Plan Next Season',
          description: 'Order seeds and plan crop rotation for next year',
          priority: 'medium'
        },
        {
          type: 'maintenance',
          title: 'Tool Maintenance',
          description: 'Clean and maintain gardening tools during quiet period',
          priority: 'low'
        }
      ]
    };
    
    return tasks[season] || [];
  }

  // Smart Problem Diagnosis
  async diagnosePlantProblem(symptoms) {
    const diagnosis = {
      possibleCauses: [],
      recommendedActions: [],
      urgencyLevel: 'low',
      needsImmediateAttention: false
    };
    
    // Analyze symptoms
    const { description, photos, affectedPlants, severity } = symptoms;
    
    // Common problem patterns
    const problemPatterns = [
      {
        keywords: ['yellow', 'yellowing', 'leaves', 'dropping'],
        causes: ['overwatering', 'nutrient_deficiency', 'natural_aging'],
        urgency: 'medium'
      },
      {
        keywords: ['wilting', 'drooping', 'dry', 'crispy'],
        causes: ['underwatering', 'heat_stress', 'root_damage'],
        urgency: 'high'
      },
      {
        keywords: ['spots', 'brown', 'black', 'mold', 'fungus'],
        causes: ['fungal_disease', 'bacterial_infection', 'poor_air_circulation'],
        urgency: 'high'
      },
      {
        keywords: ['holes', 'eaten', 'chewed', 'damage'],
        causes: ['pest_damage', 'slug_damage', 'caterpillar_damage'],
        urgency: 'medium'
      }
    ];
    
    // Match patterns
    const descriptionLower = description.toLowerCase();
    const matchedPatterns = problemPatterns.filter(pattern =>
      pattern.keywords.some(keyword => descriptionLower.includes(keyword))
    );
    
    if (matchedPatterns.length > 0) {
      diagnosis.possibleCauses = [...new Set(matchedPatterns.flatMap(p => p.causes))];
      diagnosis.urgencyLevel = matchedPatterns.some(p => p.urgency === 'high') ? 'high' : 
                              matchedPatterns.some(p => p.urgency === 'medium') ? 'medium' : 'low';
      diagnosis.needsImmediateAttention = diagnosis.urgencyLevel === 'high';
      
      // Generate recommended actions
      diagnosis.recommendedActions = this.generateRecommendedActions(diagnosis.possibleCauses);
    }
    
    return diagnosis;
  }

  generateRecommendedActions(causes) {
    const actionMap = {
      overwatering: [
        'Reduce watering frequency',
        'Improve soil drainage',
        'Check for root rot'
      ],
      underwatering: [
        'Increase watering frequency',
        'Add mulch to retain moisture',
        'Water deeply rather than frequently'
      ],
      nutrient_deficiency: [
        'Apply balanced fertilizer',
        'Test soil pH',
        'Add organic compost'
      ],
      fungal_disease: [
        'Improve air circulation',
        'Remove affected leaves',
        'Apply organic fungicide'
      ],
      pest_damage: [
        'Inspect plants regularly',
        'Apply organic pest control',
        'Encourage beneficial insects'
      ]
    };
    
    return causes.flatMap(cause => actionMap[cause] || []);
  }

  // Harvest Prediction
  async predictHarvestDates(plantings) {
    const predictions = {};
    
    for (const planting of plantings) {
      const { plantType, sowingDate, variety } = planting;
      
      // Get crop data (this would normally come from a database)
      const cropData = this.getCropData(plantType, variety);
      
      if (cropData) {
        const sowingDateObj = new Date(sowingDate);
        const harvestDate = new Date(sowingDateObj.getTime() + (cropData.daysToHarvest * 24 * 60 * 60 * 1000));
        
        predictions[planting.id] = {
          estimatedHarvestDate: harvestDate,
          daysRemaining: Math.ceil((harvestDate - new Date()) / (24 * 60 * 60 * 1000)),
          confidence: cropData.confidence || 0.8,
          factors: this.getHarvestFactors(plantType, sowingDate)
        };
      }
    }
    
    return predictions;
  }

  getCropData(plantType, variety = 'standard') {
    const cropDatabase = {
      'tomatoes': { daysToHarvest: 75, confidence: 0.85 },
      'carrots': { daysToHarvest: 70, confidence: 0.9 },
      'lettuce': { daysToHarvest: 45, confidence: 0.95 },
      'peas': { daysToHarvest: 60, confidence: 0.9 },
      'beans': { daysToHarvest: 55, confidence: 0.85 },
      'potatoes': { daysToHarvest: 90, confidence: 0.8 },
      'onions': { daysToHarvest: 120, confidence: 0.85 }
    };
    
    return cropDatabase[plantType.toLowerCase()];
  }

  // Weather Impact Analysis
  async analyzeWeatherImpact(weatherForecast, currentCrops) {
    const impacts = [];
    
    for (const day of weatherForecast) {
      const dayImpacts = [];
      
      // Temperature impacts
      if (day.high > 30) {
        dayImpacts.push({
          type: 'heat_stress',
          severity: 'high',
          affectedCrops: ['lettuce', 'peas', 'spinach'],
          recommendation: 'Provide shade and extra watering'
        });
      }
      
      if (day.low < 5) {
        dayImpacts.push({
          type: 'frost_risk',
          severity: 'high',
          affectedCrops: ['tomatoes', 'beans', 'courgettes'],
          recommendation: 'Cover tender plants or move to protection'
        });
      }
      
      // Rain impacts
      if (day.precipitation > 80) {
        dayImpacts.push({
          type: 'heavy_rain',
          severity: 'medium',
          affectedCrops: ['all'],
          recommendation: 'Ensure good drainage and avoid watering'
        });
      }
      
      // Wind impacts
      if (day.wind > 20) {
        dayImpacts.push({
          type: 'strong_wind',
          severity: 'medium',
          affectedCrops: ['tall_plants', 'climbing_plants'],
          recommendation: 'Secure plant supports and stakes'
        });
      }
      
      if (dayImpacts.length > 0) {
        impacts.push({
          date: day.date,
          impacts: dayImpacts
        });
      }
    }
    
    return impacts;
  }

  // Utility Methods
  getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  extractActionableSteps(advice) {
    // Extract actionable steps from AI response
    const actionWords = ['apply', 'water', 'remove', 'add', 'check', 'monitor', 'prune', 'fertilize'];
    const sentences = advice.split(/[.!?]+/);
    
    return sentences
      .filter(sentence => 
        actionWords.some(word => sentence.toLowerCase().includes(word))
      )
      .map(step => step.trim())
      .filter(step => step.length > 10)
      .slice(0, 5);
  }

  generateFollowUpQuestions(query, advice) {
    const questions = [
      "How long should I wait before seeing improvements?",
      "Are there any warning signs I should watch for?",
      "What preventive measures can I take?",
      "Should I apply any specific treatments?",
      "When is the best time to implement these suggestions?"
    ];
    
    return questions.slice(0, 3);
  }

  assessIssueSeverity(query, advice) {
    const severityKeywords = {
      high: ['immediate', 'urgent', 'critical', 'dying', 'severe', 'emergency'],
      medium: ['concern', 'monitor', 'watch', 'address', 'problem'],
      low: ['normal', 'minor', 'slight', 'temporary', 'maintenance']
    };
    
    const combinedText = (query.question + ' ' + advice).toLowerCase();
    
    if (severityKeywords.high.some(keyword => combinedText.includes(keyword))) return 'high';
    if (severityKeywords.medium.some(keyword => combinedText.includes(keyword))) return 'medium';
    return 'low';
  }

  addToHistory(type, query, response) {
    this.conversationHistory.push({
      type,
      query,
      response,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 conversations
    if (this.conversationHistory.length > 50) {
      this.conversationHistory = this.conversationHistory.slice(-50);
    }
  }

  analyzeEntriesForTasks(entries) {
    const tasks = [];
    
    // Analyze recent entries for patterns
    entries.forEach(entry => {
      if (entry.entry_type === 'sowing' && entry.date) {
        const sowingDate = new Date(entry.date);
        const transplantDate = new Date(sowingDate.getTime() + (14 * 24 * 60 * 60 * 1000));
        
        if (transplantDate > new Date()) {
          tasks.push({
            type: 'follow_up',
            title: 'Check Germination',
            description: `Check ${entry.title} for germination and growth`,
            priority: 'medium',
            dueDate: transplantDate,
            relatedEntry: entry.id
          });
        }
      }
      
      if (entry.entry_type === 'harvest' && entry.content.includes('more ready')) {
        tasks.push({
          type: 'follow_up',
          title: 'Continue Harvesting',
          description: `More crops may be ready for harvest in ${entry.plot_number}`,
          priority: 'medium',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
      }
    });
    
    return tasks;
  }

  getFallbackPlantAdvice(query) {
    return {
      advice: "I'm having trouble connecting to the AI service right now. Here are some general tips: Ensure your plants have adequate water, good drainage, and appropriate sunlight. Check for pests regularly and maintain healthy soil with compost.",
      actionableSteps: [
        "Check soil moisture level",
        "Inspect plants for pests or disease",
        "Ensure adequate sunlight exposure",
        "Maintain proper drainage"
      ],
      suggestedTasks: [],
      followUpQuestions: [
        "What specific symptoms are you seeing?",
        "How long has this issue been present?",
        "What care routine are you currently following?"
      ],
      severity: 'low',
      confidenceScore: 0.3
    };
  }

  // Machine Learning Enhancement (simplified)
  async learnFromFeedback(queryId, feedback) {
    // Store feedback for future improvements
    const feedbackData = {
      queryId,
      feedback,
      timestamp: new Date().toISOString(),
      userId: this.getCurrentUserId()
    };
    
    // In a real implementation, this would train the model
    localStorage.setItem(`ai_feedback_${queryId}`, JSON.stringify(feedbackData));
  }

  getCurrentUserId() {
    // Get current user ID from auth context
    return localStorage.getItem('userId') || 'anonymous';
  }
}

// Create singleton instance
const aiAssistant = new AIAssistant();

export default aiAssistant;