export interface Plant {
  id: string;
  name: string;
  scientificName: string;
  category: 'vegetables' | 'fruits' | 'herbs' | 'flowers' | 'trees';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  sowingMonths: number[];
  harvestMonths: number[];
  description: string;
  careInstructions: string[];
  spacing: string;
  soilType: string;
  sunRequirement: 'full_sun' | 'partial_shade' | 'shade';
  wateringNeeds: 'low' | 'medium' | 'high';
  companionPlants: string[];
  pests: string[];
  diseases: string[];
  tips: string[];
  imageUrl?: string;
}

export const ukPlants: Plant[] = [
  {
    id: 'tomato',
    name: 'Tomato',
    scientificName: 'Solanum lycopersicum',
    category: 'vegetables',
    difficulty: 'intermediate',
    sowingMonths: [2, 3, 4],
    harvestMonths: [7, 8, 9, 10],
    description: 'Popular warm-season crop that thrives in UK greenhouses and sunny outdoor spots.',
    careInstructions: [
      'Start seeds indoors 6-8 weeks before last frost',
      'Transplant after soil temperature reaches 16°C',
      'Provide support with canes or cages',
      'Remove side shoots regularly',
      'Water consistently at soil level',
    ],
    spacing: '45-60cm apart',
    soilType: 'Well-drained, fertile soil with pH 6.0-6.8',
    sunRequirement: 'full_sun',
    wateringNeeds: 'high',
    companionPlants: ['Basil', 'Marigold', 'Pepper'],
    pests: ['Aphids', 'Whitefly', 'Tomato hornworm'],
    diseases: ['Blight', 'Fusarium wilt', 'Blossom end rot'],
    tips: [
      'Mulch around plants to retain moisture',
      'Feed weekly with tomato fertilizer once fruiting begins',
      'Pick regularly to encourage more fruit',
    ],
  },
  {
    id: 'potato',
    name: 'Potato',
    scientificName: 'Solanum tuberosum',
    category: 'vegetables',
    difficulty: 'beginner',
    sowingMonths: [3, 4, 5],
    harvestMonths: [6, 7, 8, 9],
    description: 'Hardy root vegetable perfect for UK climate, available in early, mid, and late varieties.',
    careInstructions: [
      'Plant seed potatoes 10cm deep',
      'Earth up plants as they grow',
      'Water during dry spells',
      'Harvest when flowers appear',
    ],
    spacing: '30cm apart in rows 60cm apart',
    soilType: 'Well-drained, slightly acidic soil pH 5.5-6.5',
    sunRequirement: 'full_sun',
    wateringNeeds: 'medium',
    companionPlants: ['Beans', 'Peas', 'Sweetcorn'],
    pests: ['Colorado beetle', 'Wireworm', 'Slug'],
    diseases: ['Potato blight', 'Scab', 'Black leg'],
    tips: [
      'Chit seed potatoes in light, frost-free place before planting',
      'Don\'t plant in same spot for 4 years',
      'Store harvested potatoes in dark, cool place',
    ],
  },
  {
    id: 'carrot',
    name: 'Carrot',
    scientificName: 'Daucus carota',
    category: 'vegetables',
    difficulty: 'beginner',
    sowingMonths: [3, 4, 5, 6, 7],
    harvestMonths: [6, 7, 8, 9, 10, 11],
    description: 'Cool-season root vegetable that grows well in UK\'s temperate climate.',
    careInstructions: [
      'Sow seeds directly in fine, stone-free soil',
      'Thin seedlings to 5cm apart',
      'Keep soil moist but not waterlogged',
      'Harvest when shoulders appear above soil',
    ],
    spacing: '5cm apart in rows 15cm apart',
    soilType: 'Deep, sandy, well-drained soil pH 6.0-6.8',
    sunRequirement: 'full_sun',
    wateringNeeds: 'medium',
    companionPlants: ['Onions', 'Leeks', 'Chives'],
    pests: ['Carrot fly', 'Aphids'],
    diseases: ['Carrot rust fly', 'Cavity spot'],
    tips: [
      'Use fine mesh to protect from carrot fly',
      'Successive sowings every 2-3 weeks for continuous harvest',
      'Choose short varieties for shallow soils',
    ],
  },
  {
    id: 'lettuce',
    name: 'Lettuce',
    scientificName: 'Lactuca sativa',
    category: 'vegetables',
    difficulty: 'beginner',
    sowingMonths: [3, 4, 5, 6, 7, 8],
    harvestMonths: [5, 6, 7, 8, 9, 10],
    description: 'Quick-growing leafy green perfect for successive sowings throughout the UK growing season.',
    careInstructions: [
      'Sow seeds in shallow drills',
      'Thin or transplant seedlings',
      'Water regularly in dry weather',
      'Harvest outer leaves or whole heads',
    ],
    spacing: '15-30cm apart depending on variety',
    soilType: 'Fertile, moisture-retentive soil pH 6.0-7.0',
    sunRequirement: 'partial_shade',
    wateringNeeds: 'high',
    companionPlants: ['Radish', 'Carrots', 'Onions'],
    pests: ['Slugs', 'Aphids', 'Cutworms'],
    diseases: ['Downy mildew', 'Grey mould'],
    tips: [
      'Sow little and often for continuous supply',
      'Provide shade in hot summer weather',
      'Choose bolt-resistant varieties for summer sowings',
    ],
  },
  {
    id: 'runner-bean',
    name: 'Runner Bean',
    scientificName: 'Phaseolus coccineus',
    category: 'vegetables',
    difficulty: 'beginner',
    sowingMonths: [5, 6],
    harvestMonths: [7, 8, 9, 10],
    description: 'Climbing legume that produces abundance of pods throughout UK summer and autumn.',
    careInstructions: [
      'Sow seeds 5cm deep after last frost',
      'Provide tall supports (2m minimum)',
      'Water regularly, especially during flowering',
      'Pick pods regularly to encourage more',
    ],
    spacing: '15cm apart along supports',
    soilType: 'Rich, moisture-retentive soil pH 6.0-7.0',
    sunRequirement: 'full_sun',
    wateringNeeds: 'high',
    companionPlants: ['Sweetcorn', 'Squash', 'Lettuce'],
    pests: ['Black bean aphid', 'Red spider mite'],
    diseases: ['Halo blight', 'Rust'],
    tips: [
      'Dig in plenty of compost before planting',
      'Pinch out growing tips when plants reach top of supports',
      'Flowers may not set in very hot weather',
    ],
  },
  {
    id: 'courgette',
    name: 'Courgette',
    scientificName: 'Cucurbita pepo',
    category: 'vegetables',
    difficulty: 'beginner',
    sowingMonths: [4, 5, 6],
    harvestMonths: [7, 8, 9, 10],
    description: 'Prolific summer squash that thrives in UK\'s warm summer months.',
    careInstructions: [
      'Start seeds indoors or sow direct after frost risk',
      'Plant in rich, well-manured soil',
      'Water at base of plant, avoid leaves',
      'Harvest regularly when 15-20cm long',
    ],
    spacing: '90cm apart',
    soilType: 'Rich, well-drained soil pH 6.0-7.0',
    sunRequirement: 'full_sun',
    wateringNeeds: 'high',
    companionPlants: ['Nasturtiums', 'Radish', 'Beans'],
    pests: ['Cucumber beetle', 'Squash bug', 'Aphids'],
    diseases: ['Powdery mildew', 'Cucumber mosaic virus'],
    tips: [
      'Male flowers appear first, female flowers follow',
      'One plant can produce 20+ courgettes',
      'Pick regularly to prevent marrows forming',
    ],
  },
  {
    id: 'strawberry',
    name: 'Strawberry',
    scientificName: 'Fragaria × ananassa',
    category: 'fruits',
    difficulty: 'beginner',
    sowingMonths: [3, 4, 8, 9],
    harvestMonths: [6, 7, 8],
    description: 'Popular soft fruit that produces sweet berries in UK summer. Choose from June-bearing or everbearing varieties.',
    careInstructions: [
      'Plant in raised beds or containers',
      'Mulch around plants with straw',
      'Remove runners unless propagating',
      'Net plants to protect from birds',
    ],
    spacing: '30-45cm apart',
    soilType: 'Well-drained, slightly acidic soil pH 5.5-6.5',
    sunRequirement: 'full_sun',
    wateringNeeds: 'medium',
    companionPlants: ['Thyme', 'Borage', 'Chives'],
    pests: ['Aphids', 'Red spider mite', 'Vine weevil'],
    diseases: ['Grey mould', 'Crown rot', 'Powdery mildew'],
    tips: [
      'Replace plants every 3-4 years',
      'Water at soil level to prevent fruit rot',
      'Remove old leaves after fruiting',
    ],
  },
  {
    id: 'apple',
    name: 'Apple',
    scientificName: 'Malus domestica',
    category: 'fruits',
    difficulty: 'intermediate',
    sowingMonths: [10, 11, 12, 1, 2, 3],
    harvestMonths: [8, 9, 10, 11],
    description: 'Classic UK orchard fruit available in many varieties suited to different climates and uses.',
    careInstructions: [
      'Plant bare-root trees in dormant season',
      'Prune in winter to maintain shape',
      'Thin fruits in June if heavy crop',
      'Water during dry spells in first few years',
    ],
    spacing: '2-4m apart depending on rootstock',
    soilType: 'Well-drained, fertile soil pH 6.0-7.0',
    sunRequirement: 'full_sun',
    wateringNeeds: 'medium',
    companionPlants: ['Nasturtiums', 'Comfrey', 'Chives'],
    pests: ['Codling moth', 'Apple sawfly', 'Aphids'],
    diseases: ['Apple scab', 'Fire blight', 'Canker'],
    tips: [
      'Choose disease-resistant varieties',
      'Most apples need cross-pollination',
      'Store apples in cool, humid conditions',
    ],
  },
  {
    id: 'basil',
    name: 'Basil',
    scientificName: 'Ocimum basilicum',
    category: 'herbs',
    difficulty: 'intermediate',
    sowingMonths: [4, 5, 6],
    harvestMonths: [6, 7, 8, 9],
    description: 'Aromatic herb that loves warmth. Grow in greenhouse or warm, sheltered spot in UK.',
    careInstructions: [
      'Start seeds indoors, transplant after last frost',
      'Pinch out flower spikes to encourage leaves',
      'Water at base, avoid wetting leaves',
      'Harvest regularly for best flavour',
    ],
    spacing: '15-20cm apart',
    soilType: 'Well-drained, fertile soil pH 6.0-7.0',
    sunRequirement: 'full_sun',
    wateringNeeds: 'medium',
    companionPlants: ['Tomatoes', 'Peppers', 'Oregano'],
    pests: ['Aphids', 'Whitefly', 'Red spider mite'],
    diseases: ['Fusarium wilt', 'Bacterial leaf spot'],
    tips: [
      'Grow in pots to move indoors in winter',
      'Take cuttings to overwinter on windowsill',
      'Purple varieties are more cold-tolerant',
    ],
  },
  {
    id: 'rosemary',
    name: 'Rosemary',
    scientificName: 'Rosmarinus officinalis',
    category: 'herbs',
    difficulty: 'beginner',
    sowingMonths: [4, 5, 9, 10],
    harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    description: 'Hardy evergreen herb that provides year-round harvests once established in UK gardens.',
    careInstructions: [
      'Plant in well-drained, sunny spot',
      'Protect young plants in harsh winters',
      'Prune lightly after flowering',
      'Harvest sprigs as needed',
    ],
    spacing: '60-90cm apart',
    soilType: 'Well-drained, alkaline soil pH 6.0-8.0',
    sunRequirement: 'full_sun',
    wateringNeeds: 'low',
    companionPlants: ['Thyme', 'Sage', 'Lavender'],
    pests: ['Rosemary beetle', 'Aphids'],
    diseases: ['Root rot', 'Powdery mildew'],
    tips: [
      'Choose hardy varieties for UK climate',
      'Excellent for containers',
      'Flowers are edible and attract bees',
    ],
  },
  {
    id: 'sunflower',
    name: 'Sunflower',
    scientificName: 'Helianthus annuus',
    category: 'flowers',
    difficulty: 'beginner',
    sowingMonths: [4, 5, 6],
    harvestMonths: [8, 9, 10],
    description: 'Tall, cheerful annual flower that follows the sun and provides seeds for wildlife.',
    careInstructions: [
      'Sow seeds directly in final position',
      'Provide support for tall varieties',
      'Water regularly during growth',
      'Leave seed heads for birds',
    ],
    spacing: '30-45cm apart',
    soilType: 'Well-drained, fertile soil pH 6.0-7.5',
    sunRequirement: 'full_sun',
    wateringNeeds: 'medium',
    companionPlants: ['Beans', 'Squash', 'Nasturtiums'],
    pests: ['Birds', 'Slugs', 'Aphids'],
    diseases: ['Downy mildew', 'Rust'],
    tips: [
      'Choose giant varieties for wow factor',
      'Branching varieties produce more flowers',
      'Seeds can be harvested and eaten',
    ],
  },
  {
    id: 'marigold',
    name: 'Marigold',
    scientificName: 'Tagetes patula',
    category: 'flowers',
    difficulty: 'beginner',
    sowingMonths: [3, 4, 5, 6],
    harvestMonths: [6, 7, 8, 9, 10],
    description: 'Bright, easy-to-grow annual that provides colour and pest-deterrent properties.',
    careInstructions: [
      'Sow seeds indoors or direct after frost',
      'Deadhead regularly for continuous flowers',
      'Water at base of plant',
      'Self-seeds readily',
    ],
    spacing: '15-30cm apart',
    soilType: 'Any well-drained soil pH 6.0-7.0',
    sunRequirement: 'full_sun',
    wateringNeeds: 'low',
    companionPlants: ['Tomatoes', 'Peppers', 'Beans'],
    pests: ['Aphids', 'Spider mites'],
    diseases: ['Powdery mildew', 'Damping off'],
    tips: [
      'French marigolds deter many pests',
      'Flowers are edible with spicy flavour',
      'Save seeds for next year',
    ],
  },
];

export const plantCategories = [
  { id: 'all', name: 'All Plants', icon: 'leaf' },
  { id: 'vegetables', name: 'Vegetables', icon: 'nutrition' },
  { id: 'fruits', name: 'Fruits', icon: 'apple' },
  { id: 'herbs', name: 'Herbs', icon: 'flower' },
  { id: 'flowers', name: 'Flowers', icon: 'rose' },
  { id: 'trees', name: 'Trees', icon: 'tree' },
];

export const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner': return '#22c55e';
    case 'intermediate': return '#f59e0b';
    case 'advanced': return '#ef4444';
    default: return '#6b7280';
  }
};

export const getMonthName = (month: number) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month - 1];
};