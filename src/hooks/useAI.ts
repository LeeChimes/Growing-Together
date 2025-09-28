import { useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface AIQueryRequest {
  question: string;
  plantName?: string;
  photo?: string; // base64 encoded image
  context?: 'plant_care' | 'pest_identification' | 'disease_diagnosis' | 'general';
}

interface AIResponse {
  answer: string;
  confidence: number;
  suggestions?: string[];
  relatedPlants?: string[];
}

export const useAIPlantAdvice = () => {
  return useMutation({
    mutationFn: async (query: AIQueryRequest): Promise<AIResponse> => {
      try {
        // Call our Supabase edge function for AI plant advice
        const { data, error } = await supabase.functions.invoke('plant-ai-advice', {
          body: query,
        });

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('AI query failed:', error);
        
        // Fallback response with general advice
        return {
          answer: generateFallbackAdvice(query),
          confidence: 0.5,
          suggestions: [
            'Check soil moisture levels',
            'Inspect leaves for pests',
            'Ensure adequate sunlight',
            'Consider seasonal care requirements',
          ],
        };
      }
    },
  });
};

const generateFallbackAdvice = (query: AIQueryRequest): string => {
  const { question, plantName, context } = query;
  
  // Basic pattern matching for common queries
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('water') || lowerQuestion.includes('drought')) {
    return `For ${plantName || 'your plant'}, water regularly but avoid overwatering. Check soil moisture by inserting your finger 2-3cm into the soil. If it feels dry, it's time to water. Water deeply but less frequently to encourage deep root growth.`;
  }
  
  if (lowerQuestion.includes('pest') || lowerQuestion.includes('bug') || lowerQuestion.includes('insect')) {
    return `Common pests can be managed through regular inspection and early intervention. For ${plantName || 'your plant'}, check the undersides of leaves weekly. Consider companion planting with pest-deterrent plants like marigolds or nasturtiums. Remove affected leaves promptly and consider organic pest control methods.`;
  }
  
  if (lowerQuestion.includes('disease') || lowerQuestion.includes('fungus') || lowerQuestion.includes('mould')) {
    return `Plant diseases often result from poor air circulation or excess moisture. For ${plantName || 'your plant'}, ensure good spacing between plants, water at soil level rather than on leaves, and remove any affected plant material immediately. Consider organic fungicides if the problem persists.`;
  }
  
  if (lowerQuestion.includes('fertilizer') || lowerQuestion.includes('feed') || lowerQuestion.includes('nutrients')) {
    return `${plantName || 'Your plant'} will benefit from regular feeding during the growing season. Use a balanced organic fertilizer monthly, or compost tea weekly. Heavy feeders like tomatoes need more frequent feeding, while herbs often prefer leaner conditions.`;
  }
  
  if (lowerQuestion.includes('prune') || lowerQuestion.includes('trim') || lowerQuestion.includes('cut')) {
    return `Pruning ${plantName || 'your plant'} should be done at the right time of year. For most plants, light pruning can be done anytime, but major pruning is best in late winter or early spring. Remove dead, diseased, or crossing branches first, then shape as needed.`;
  }
  
  // Default general advice
  return `For ${plantName || 'your plant'}, the key to success is regular observation and consistent care. Monitor for changes in leaf color, growth patterns, and overall health. Ensure appropriate light levels, water when needed but don't overwater, and maintain good soil health with organic matter. Each plant has specific needs, so consider researching the particular requirements for your variety.`;
};

// Hook for plant identification from photos
export const useAIPlantIdentification = () => {
  return useMutation({
    mutationFn: async (photo: string): Promise<{
      plantName: string;
      scientificName: string;
      confidence: number;
      careInstructions: string[];
    }> => {
      try {
        const { data, error } = await supabase.functions.invoke('plant-identification', {
          body: { photo },
        });

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Plant identification failed:', error);
        
        // Fallback response
        return {
          plantName: 'Unknown Plant',
          scientificName: 'Species not identified',
          confidence: 0.3,
          careInstructions: [
            'Unable to identify plant from photo',
            'Try taking a clearer photo of leaves and flowers',
            'Consider asking in the community forum',
            'Check our plant library for similar-looking plants',
          ],
        };
      }
    },
  });
};

// Hook for seasonal gardening advice
export const useSeasonalAdvice = () => {
  return useMutation({
    mutationFn: async (month: number): Promise<{
      tasks: string[];
      plants: string[];
      tips: string[];
    }> => {
      // This could call an AI service or use local seasonal data
      const seasonalData = getSeasonalData(month);
      return Promise.resolve(seasonalData);
    },
  });
};

const getSeasonalData = (month: number) => {
  const seasons = {
    spring: [3, 4, 5],
    summer: [6, 7, 8],
    autumn: [9, 10, 11],
    winter: [12, 1, 2],
  };
  
  let season = 'spring';
  for (const [seasonName, months] of Object.entries(seasons)) {
    if (months.includes(month)) {
      season = seasonName;
      break;
    }
  }
  
  const seasonalAdvice = {
    spring: {
      tasks: [
        'Prepare seed beds',
        'Start seeds indoors',
        'Plant potatoes',
        'Prune fruit trees',
        'Begin regular watering',
      ],
      plants: [
        'Tomatoes (indoors)',
        'Lettuce',
        'Radishes',
        'Peas',
        'Broad beans',
      ],
      tips: [
        'Watch for late frosts',
        'Gradually acclimatize seedlings',
        'Begin pest monitoring',
        'Apply mulch to retain moisture',
      ],
    },
    summer: {
      tasks: [
        'Regular watering',
        'Harvest vegetables',
        'Deadhead flowers',
        'Monitor for pests',
        'Successive sowing',
      ],
      plants: [
        'Courgettes',
        'Beans',
        'Sweetcorn',
        'Summer herbs',
        'Annual flowers',
      ],
      tips: [
        'Water early morning or evening',
        'Provide shade for cool-season crops',
        'Harvest regularly to encourage growth',
        'Take cuttings of herbs',
      ],
    },
    autumn: {
      tasks: [
        'Harvest and store crops',
        'Plant spring bulbs',
        'Collect seeds',
        'Prepare for winter',
        'Plant bare-root trees',
      ],
      plants: [
        'Winter vegetables',
        'Garlic',
        'Broad beans',
        'Fruit trees',
        'Spring bulbs',
      ],
      tips: [
        'Reduce watering frequency',
        'Mulch tender plants',
        'Clean and store tools',
        'Plan next year\'s garden',
      ],
    },
    winter: {
      tasks: [
        'Plan next year',
        'Order seeds',
        'Maintain tools',
        'Protect tender plants',
        'Force rhubarb',
      ],
      plants: [
        'Indoor herbs',
        'Microgreens',
        'Sprouting seeds',
        'Forced bulbs',
        'Winter vegetables',
      ],
      tips: [
        'Avoid walking on frozen soil',
        'Insulate outdoor containers',
        'Plan crop rotations',
        'Study gardening resources',
      ],
    },
  };
  
  return seasonalAdvice[season as keyof typeof seasonalAdvice];
};