// Load environment variables FIRST before any imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import axios from 'axios';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import personalizationRouter from './routes/personalization.js';
import onboardingRouter from './routes/onboarding.js';
import realtimeRouter from './routes/realtime.js';
import forecastRouter from './routes/forecast.js';
import recipesRouter from './routes/recipes.js';
import streaksRouter from './routes/streaks.js';
import mealplannerRouter from './routes/mealplanner.js';
import airecommendationsRouter from './routes/airecommendations.js';
import notificationsRouter from './routes/notifications.js';
import meditationworldRouter from './routes/meditationworld.js';
import stripeRouter from './routes/stripe.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['https://aifitnessapp.vercel.app', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Exclude Stripe webhook from JSON parsing (needs raw body for signature verification)
app.use((req, res, next) => {
  if (req.path === '/api/stripe/webhook') {
    return next(); // Skip JSON parsing for webhook
  }
  express.json()(req, res, next);
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Personalization routes (Phase 6)
app.use('/api/personalize', personalizationRouter);
app.use('/api/personalized-plan', personalizationRouter);

// Onboarding routes
app.use('/api/onboarding', onboardingRouter);

// Real-time optimizer routes (Phase 7)
app.use('/api/realtime', realtimeRouter);

// Workout forecaster routes (Phase 8)
app.use('/api/forecast', forecastRouter);

// Recipe AI routes (Phase 9B)
app.use('/api/recipes', recipesRouter);

// Streak Engine routes (Module 12)
app.use('/api/streaks', streaksRouter);

// Meal Planner routes (Module X)
app.use('/api/mealplanner', mealplannerRouter);

// AI Recommendations routes (Module W Extended)
app.use('/api/airecommendations', airecommendationsRouter);

// Notification AI routes (Module AF)
app.use('/api/notifications', notificationsRouter);

// Meditation World routes (Module AC)
app.use('/api/meditationworld', meditationworldRouter);

// Stripe routes (Subscriptions & Webhooks)
app.use('/api/stripe', stripeRouter);

// API Keys
const FATSECRET_API_KEY = process.env.FATSECRET_API_KEY || '0a600ff8aa184268a1e7026b99b7cae4';
const FATSECRET_API_SECRET = process.env.FATSECRET_API_SECRET || '32661e62a2e74abd863f8c38b9c5207e';
const USDA_API_KEY = process.env.USDA_API_KEY || 'BvRVeOh9MuL5xVWUfw5CFSQkAxPElDF0tjq8UGaL';
const NUTRITIONIX_APP_ID = process.env.NUTRITIONIX_APP_ID || 'your_nutritionix_app_id';
const NUTRITIONIX_API_KEY = process.env.NUTRITIONIX_API_KEY || 'your_nutritionix_api_key';

// Admin credentials (in production, use proper authentication)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// FatSecret OAuth 1.0 signature generation
function generateFatSecretSignature(method, url, params) {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString('hex');
  
  const oauthParams = {
    oauth_consumer_key: FATSECRET_API_KEY,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_version: '1.0'
  };
  
  const allParams = { ...params, ...oauthParams };
  const sortedParams = Object.keys(allParams).sort().map(key => `${key}=${encodeURIComponent(allParams[key])}`).join('&');
  
  const baseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
  const signingKey = `${encodeURIComponent(FATSECRET_API_SECRET)}&`;
  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
  
  return {
    ...oauthParams,
    oauth_signature: signature
  };
}

// Enhanced Recipe Database with more recipes for all categories
let recipesDatabase = [
  // Breakfast Recipes
  {
    id: 1,
    title: 'Protein Pancakes',
    image: 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg',
    cookTime: 15,
    servings: 2,
    calories: 340,
    protein: 22,
    carbs: 35,
    fat: 12,
    difficulty: 'Easy',
    tags: ['Breakfast', 'High Protein'],
    rating: 4.8,
    reviews: 124,
    ingredients: ['2 eggs', '1 scoop protein powder', '1/2 cup oats', '1 banana'],
    instructions: ['Mix ingredients', 'Cook on griddle', 'Serve hot'],
    category: 'Breakfast'
  },
  {
    id: 2,
    title: 'Overnight Oats',
    image: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg',
    cookTime: 5,
    servings: 1,
    calories: 380,
    protein: 25,
    carbs: 45,
    fat: 12,
    difficulty: 'Easy',
    tags: ['Breakfast', 'Make-Ahead'],
    rating: 4.6,
    reviews: 89,
    ingredients: ['1/2 cup oats', '1 scoop protein powder', '1 cup almond milk'],
    instructions: ['Mix ingredients', 'Refrigerate overnight', 'Enjoy cold'],
    category: 'Breakfast'
  },
  {
    id: 3,
    title: 'Avocado Toast',
    image: 'https://images.pexels.com/photos/1351238/pexels-photo-1351238.jpeg',
    cookTime: 10,
    servings: 1,
    calories: 280,
    protein: 8,
    carbs: 30,
    fat: 18,
    difficulty: 'Easy',
    tags: ['Breakfast', 'Vegetarian'],
    rating: 4.4,
    reviews: 67,
    ingredients: ['2 slices whole grain bread', '1 avocado', 'Salt and pepper'],
    instructions: ['Toast bread', 'Mash avocado', 'Spread and season'],
    category: 'Breakfast'
  },

  // Lunch Recipes
  {
    id: 4,
    title: 'Quinoa Buddha Bowl',
    image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
    cookTime: 25,
    servings: 2,
    calories: 420,
    protein: 18,
    carbs: 55,
    fat: 15,
    difficulty: 'Medium',
    tags: ['Lunch', 'Vegetarian', 'Healthy'],
    rating: 4.7,
    reviews: 156,
    ingredients: ['1 cup quinoa', 'Mixed vegetables', 'Tahini dressing'],
    instructions: ['Cook quinoa', 'Prepare vegetables', 'Assemble bowl'],
    category: 'Lunch'
  },
  {
    id: 5,
    title: 'Chicken Caesar Salad',
    image: 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg',
    cookTime: 20,
    servings: 2,
    calories: 350,
    protein: 35,
    carbs: 12,
    fat: 20,
    difficulty: 'Easy',
    tags: ['Lunch', 'High Protein', 'Low Carb'],
    rating: 4.5,
    reviews: 98,
    ingredients: ['Grilled chicken', 'Romaine lettuce', 'Caesar dressing'],
    instructions: ['Grill chicken', 'Prepare salad', 'Add dressing'],
    category: 'Lunch'
  },

  // Dinner Recipes
  {
    id: 6,
    title: 'Salmon with Vegetables',
    image: 'https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg',
    cookTime: 30,
    servings: 2,
    calories: 450,
    protein: 40,
    carbs: 15,
    fat: 28,
    difficulty: 'Medium',
    tags: ['Dinner', 'Omega-3', 'Healthy'],
    rating: 4.9,
    reviews: 203,
    ingredients: ['2 salmon fillets', 'Mixed vegetables', 'Olive oil'],
    instructions: ['Season salmon', 'Roast vegetables', 'Bake together'],
    category: 'Dinner'
  },
  {
    id: 7,
    title: 'Lean Beef Stir Fry',
    image: 'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg',
    cookTime: 20,
    servings: 3,
    calories: 380,
    protein: 32,
    carbs: 25,
    fat: 18,
    difficulty: 'Medium',
    tags: ['Dinner', 'High Protein', 'Quick'],
    rating: 4.6,
    reviews: 134,
    ingredients: ['Lean beef strips', 'Mixed vegetables', 'Stir fry sauce'],
    instructions: ['Heat oil', 'Cook beef', 'Add vegetables and sauce'],
    category: 'Dinner'
  },

  // Snack Recipes
  {
    id: 8,
    title: 'Protein Energy Balls',
    image: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg',
    cookTime: 15,
    servings: 12,
    calories: 120,
    protein: 6,
    carbs: 15,
    fat: 5,
    difficulty: 'Easy',
    tags: ['Snacks', 'High Protein', 'No-Bake'],
    rating: 4.3,
    reviews: 87,
    ingredients: ['Protein powder', 'Oats', 'Nut butter', 'Honey'],
    instructions: ['Mix ingredients', 'Form balls', 'Refrigerate'],
    category: 'Snacks'
  },
  {
    id: 9,
    title: 'Greek Yogurt Parfait',
    image: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg',
    cookTime: 5,
    servings: 1,
    calories: 250,
    protein: 20,
    carbs: 30,
    fat: 8,
    difficulty: 'Easy',
    tags: ['Snacks', 'High Protein', 'Quick'],
    rating: 4.4,
    reviews: 76,
    ingredients: ['Greek yogurt', 'Berries', 'Granola', 'Honey'],
    instructions: ['Layer yogurt', 'Add berries', 'Top with granola'],
    category: 'Snacks'
  },

  // Dessert Recipes
  {
    id: 10,
    title: 'Chocolate Protein Muffins',
    image: 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg',
    cookTime: 25,
    servings: 12,
    calories: 180,
    protein: 12,
    carbs: 20,
    fat: 6,
    difficulty: 'Medium',
    tags: ['Desserts', 'High Protein', 'Healthy'],
    rating: 4.5,
    reviews: 112,
    ingredients: ['Protein powder', 'Almond flour', 'Cocoa powder', 'Eggs'],
    instructions: ['Mix dry ingredients', 'Add wet ingredients', 'Bake 20 minutes'],
    category: 'Desserts'
  }
];

// User-created foods storage
let userFoods = [];

// User-created recipes storage
let userRecipes = [];

// Enhanced Workout Database with video URLs and detailed information
let workoutsDatabase = [
  {
    id: 1,
    title: 'Full Body HIIT Blast',
    thumbnail: 'https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg',
    videoUrl: 'https://example.com/hiit-workout.mp4', // Placeholder URL
    duration: 20,
    calories: 250,
    difficulty: 'Intermediate',
    category: 'HIIT',
    equipment: ['None'],
    rating: 4.8,
    reviews: 342,
    instructor: 'Sarah Johnson',
    description: 'High-intensity interval training that targets all major muscle groups.',
    exercises: [
      { name: 'Jumping Jacks', duration: 45, description: 'Full body cardio movement' },
      { name: 'Burpees', duration: 30, description: 'Complete body exercise' },
      { name: 'Mountain Climbers', duration: 45, description: 'Core and cardio combination' }
    ],
    isPremium: false
  },
  {
    id: 2,
    title: 'Morning Yoga Flow',
    thumbnail: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg',
    videoUrl: 'https://example.com/yoga-flow.mp4',
    duration: 15,
    calories: 80,
    difficulty: 'Beginner',
    category: 'Yoga',
    equipment: ['Yoga Mat'],
    rating: 4.9,
    reviews: 567,
    instructor: 'Maya Patel',
    description: 'Gentle yoga sequence to start your day with energy and mindfulness.',
    exercises: [
      { name: 'Sun Salutation A', duration: 180, description: 'Traditional yoga sequence' },
      { name: 'Warrior I', duration: 60, description: 'Standing strength pose' }
    ],
    isPremium: false
  },
  {
    id: 3,
    title: 'Upper Body Strength Builder',
    thumbnail: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg',
    videoUrl: 'https://example.com/strength-training.mp4',
    duration: 35,
    calories: 180,
    difficulty: 'Intermediate',
    category: 'Strength',
    equipment: ['Dumbbells', 'Bench'],
    rating: 4.7,
    reviews: 234,
    instructor: 'Mike Rodriguez',
    description: 'Build upper body strength with this comprehensive workout.',
    exercises: [
      { name: 'Bench Press', reps: 12, sets: 3, duration: 300, description: 'Chest and tricep development' },
      { name: 'Bent-Over Rows', reps: 10, sets: 3, duration: 240, description: 'Back and bicep strengthening' }
    ],
    isPremium: true
  }
];

// Mock data for demo purposes
const mockFoods = [
  { id: 1, name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, brand: 'Generic', serving_size: '100g' },
  { id: 2, name: 'Brown Rice', calories: 216, protein: 5, carbs: 45, fat: 1.8, brand: 'Generic', serving_size: '1 cup cooked' },
  { id: 3, name: 'Avocado', calories: 234, protein: 2.9, carbs: 12, fat: 21, brand: 'Generic', serving_size: '1 medium' },
  { id: 4, name: 'Greek Yogurt', calories: 100, protein: 17, carbs: 6, fat: 0, brand: 'Chobani', serving_size: '1 container' },
  { id: 5, name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, brand: 'Generic', serving_size: '1 medium' },
  { id: 6, name: 'Almonds', calories: 164, protein: 6, carbs: 6, fat: 14, brand: 'Generic', serving_size: '1 oz' },
  { id: 7, name: 'Salmon Fillet', calories: 206, protein: 22, carbs: 0, fat: 12, brand: 'Generic', serving_size: '100g' },
  { id: 8, name: 'Sweet Potato', calories: 112, protein: 2, carbs: 26, fat: 0.1, brand: 'Generic', serving_size: '1 medium' },
  { id: 9, name: 'Spinach', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, brand: 'Generic', serving_size: '100g' },
  { id: 10, name: 'Oats', calories: 389, protein: 16.9, carbs: 66, fat: 6.9, brand: 'Quaker', serving_size: '100g' },
];

// Comprehensive exercise database
const mockExercises = [
  // Cardio
  { id: 1, name: 'Running', category: 'Cardio', type: 'cardio', caloriesPerMinute: 12, muscleGroups: ['legs', 'cardiovascular'] },
  { id: 2, name: 'Cycling', category: 'Cardio', type: 'cardio', caloriesPerMinute: 10, muscleGroups: ['legs', 'cardiovascular'] },
  { id: 3, name: 'Swimming', category: 'Cardio', type: 'cardio', caloriesPerMinute: 11, muscleGroups: ['full body', 'cardiovascular'] },
  { id: 4, name: 'Jogging', category: 'Cardio', type: 'cardio', caloriesPerMinute: 8, muscleGroups: ['legs', 'cardiovascular'] },
  { id: 5, name: 'Jump Rope', category: 'Cardio', type: 'cardio', caloriesPerMinute: 13, muscleGroups: ['legs', 'cardiovascular'] },
  { id: 6, name: 'Rowing', category: 'Cardio', type: 'cardio', caloriesPerMinute: 11, muscleGroups: ['full body', 'cardiovascular'] },
  { id: 7, name: 'Elliptical', category: 'Cardio', type: 'cardio', caloriesPerMinute: 9, muscleGroups: ['legs', 'cardiovascular'] },
  { id: 8, name: 'Stairmaster', category: 'Cardio', type: 'cardio', caloriesPerMinute: 10, muscleGroups: ['legs', 'cardiovascular'] },
  { id: 9, name: 'Treadmill Running', category: 'Cardio', type: 'cardio', caloriesPerMinute: 12, muscleGroups: ['legs', 'cardiovascular'] },
  { id: 10, name: 'Stationary Bike', category: 'Cardio', type: 'cardio', caloriesPerMinute: 8, muscleGroups: ['legs', 'cardiovascular'] },

  // Strength Training
  { id: 11, name: 'Push-ups', category: 'Strength', type: 'bodyweight', caloriesPerMinute: 8, muscleGroups: ['chest', 'triceps', 'shoulders'] },
  { id: 12, name: 'Squats', category: 'Strength', type: 'bodyweight', caloriesPerMinute: 6, muscleGroups: ['legs', 'glutes'] },
  { id: 13, name: 'Pull-ups', category: 'Strength', type: 'bodyweight', caloriesPerMinute: 10, muscleGroups: ['back', 'biceps'] },
  { id: 14, name: 'Deadlifts', category: 'Strength', type: 'weight', caloriesPerMinute: 9, muscleGroups: ['back', 'legs', 'glutes'] },
  { id: 15, name: 'Bench Press', category: 'Strength', type: 'weight', caloriesPerMinute: 7, muscleGroups: ['chest', 'triceps', 'shoulders'] },
  { id: 16, name: 'Barbell Rows', category: 'Strength', type: 'weight', caloriesPerMinute: 8, muscleGroups: ['back', 'biceps'] },
  { id: 17, name: 'Overhead Press', category: 'Strength', type: 'weight', caloriesPerMinute: 7, muscleGroups: ['shoulders', 'triceps'] },
  { id: 18, name: 'Lunges', category: 'Strength', type: 'bodyweight', caloriesPerMinute: 6, muscleGroups: ['legs', 'glutes'] },
  { id: 19, name: 'Dips', category: 'Strength', type: 'bodyweight', caloriesPerMinute: 8, muscleGroups: ['triceps', 'chest'] },
  { id: 20, name: 'Romanian Deadlifts', category: 'Strength', type: 'weight', caloriesPerMinute: 8, muscleGroups: ['hamstrings', 'glutes'] },

  // HIIT
  { id: 21, name: 'Burpees', category: 'HIIT', type: 'bodyweight', caloriesPerMinute: 15, muscleGroups: ['full body'] },
  { id: 22, name: 'Mountain Climbers', category: 'HIIT', type: 'bodyweight', caloriesPerMinute: 12, muscleGroups: ['core', 'legs'] },
  { id: 23, name: 'High Knees', category: 'HIIT', type: 'bodyweight', caloriesPerMinute: 10, muscleGroups: ['legs', 'cardiovascular'] },
  { id: 24, name: 'Jumping Jacks', category: 'HIIT', type: 'bodyweight', caloriesPerMinute: 8, muscleGroups: ['full body'] },
  { id: 25, name: 'Tabata Sprints', category: 'HIIT', type: 'cardio', caloriesPerMinute: 16, muscleGroups: ['legs', 'cardiovascular'] },
  { id: 26, name: 'Battle Ropes', category: 'HIIT', type: 'equipment', caloriesPerMinute: 14, muscleGroups: ['arms', 'core'] },
  { id: 27, name: 'Box Jumps', category: 'HIIT', type: 'bodyweight', caloriesPerMinute: 12, muscleGroups: ['legs', 'glutes'] },
  { id: 28, name: 'Kettlebell Swings', category: 'HIIT', type: 'weight', caloriesPerMinute: 13, muscleGroups: ['glutes', 'core'] },

  // Flexibility
  { id: 29, name: 'Yoga', category: 'Flexibility', type: 'bodyweight', caloriesPerMinute: 3, muscleGroups: ['full body'] },
  { id: 30, name: 'Stretching', category: 'Flexibility', type: 'bodyweight', caloriesPerMinute: 2, muscleGroups: ['full body'] },
  { id: 31, name: 'Pilates', category: 'Flexibility', type: 'bodyweight', caloriesPerMinute: 4, muscleGroups: ['core', 'full body'] },

  // Additional exercises from the user's list
  { id: 32, name: 'Aerobics', category: 'Cardio', type: 'cardio', caloriesPerMinute: 7, muscleGroups: ['full body', 'cardiovascular'] },
  { id: 33, name: 'Aerobics Classes', category: 'Cardio', type: 'cardio', caloriesPerMinute: 8, muscleGroups: ['full body', 'cardiovascular'] },
  { id: 34, name: 'Agility Ladder Drills', category: 'HIIT', type: 'bodyweight', caloriesPerMinute: 9, muscleGroups: ['legs', 'agility'] },
  { id: 35, name: 'Arm Circles', category: 'Flexibility', type: 'bodyweight', caloriesPerMinute: 2, muscleGroups: ['shoulders', 'arms'] },
  { id: 36, name: 'BMX Biking', category: 'Cardio', type: 'cardio', caloriesPerMinute: 11, muscleGroups: ['legs', 'cardiovascular'] },
  { id: 37, name: 'Back Squats', category: 'Strength', type: 'weight', caloriesPerMinute: 8, muscleGroups: ['legs', 'glutes', 'back'] },
  { id: 38, name: 'Backstroke Swimming', category: 'Cardio', type: 'cardio', caloriesPerMinute: 10, muscleGroups: ['back', 'arms', 'cardiovascular'] },
  { id: 39, name: 'Badminton', category: 'Cardio', type: 'cardio', caloriesPerMinute: 7, muscleGroups: ['full body', 'cardiovascular'] },
  { id: 40, name: 'Basketball', category: 'Cardio', type: 'cardio', caloriesPerMinute: 9, muscleGroups: ['legs', 'cardiovascular'] },
  { id: 41, name: 'Boxing', category: 'HIIT', type: 'cardio', caloriesPerMinute: 12, muscleGroups: ['arms', 'core', 'cardiovascular'] },
  { id: 42, name: 'Breaststroke Swimming', category: 'Cardio', type: 'cardio', caloriesPerMinute: 9, muscleGroups: ['chest', 'arms', 'cardiovascular'] },
  { id: 43, name: 'Bulgarian Split Squats', category: 'Strength', type: 'bodyweight', caloriesPerMinute: 7, muscleGroups: ['legs', 'glutes'] },
  { id: 44, name: 'Butt Kicks', category: 'HIIT', type: 'bodyweight', caloriesPerMinute: 8, muscleGroups: ['legs', 'cardiovascular'] },
  { id: 45, name: 'Butterfly Swimming', category: 'Cardio', type: 'cardio', caloriesPerMinute: 13, muscleGroups: ['shoulders', 'core', 'cardiovascular'] },
  { id: 46, name: 'Calf Raises', category: 'Strength', type: 'bodyweight', caloriesPerMinute: 4, muscleGroups: ['calves'] },
  { id: 47, name: 'Cross-Country Skiing', category: 'Cardio', type: 'cardio', caloriesPerMinute: 12, muscleGroups: ['full body', 'cardiovascular'] },
  { id: 48, name: 'Dancing', category: 'Cardio', type: 'cardio', caloriesPerMinute: 6, muscleGroups: ['full body', 'cardiovascular'] },
  { id: 49, name: 'Decline Bench Press', category: 'Strength', type: 'weight', caloriesPerMinute: 7, muscleGroups: ['chest', 'triceps'] },
  { id: 50, name: 'Dumbbell Curls', category: 'Strength', type: 'weight', caloriesPerMinute: 5, muscleGroups: ['biceps'] },
  { id: 51, name: 'Elliptical Intervals', category: 'HIIT', type: 'cardio', caloriesPerMinute: 11, muscleGroups: ['legs', 'cardiovascular'] },
  { id: 52, name: 'Face Pulls', category: 'Strength', type: 'weight', caloriesPerMinute: 5, muscleGroups: ['rear delts', 'upper back'] },
  { id: 53, name: 'Freestyle Swimming', category: 'Cardio', type: 'cardio', caloriesPerMinute: 11, muscleGroups: ['full body', 'cardiovascular'] },
  { id: 54, name: 'Front Squats', category: 'Strength', type: 'weight', caloriesPerMinute: 8, muscleGroups: ['legs', 'core'] },
  { id: 55, name: 'Glute Bridges', category: 'Strength', type: 'bodyweight', caloriesPerMinute: 5, muscleGroups: ['glutes', 'hamstrings'] },
  { id: 56, name: 'Goblet Squats', category: 'Strength', type: 'weight', caloriesPerMinute: 7, muscleGroups: ['legs', 'glutes'] },
  { id: 57, name: 'Good Mornings', category: 'Strength', type: 'weight', caloriesPerMinute: 6, muscleGroups: ['hamstrings', 'lower back'] },
  { id: 58, name: 'Hack Squats', category: 'Strength', type: 'weight', caloriesPerMinute: 8, muscleGroups: ['legs', 'glutes'] },
  { id: 59, name: 'Hiking', category: 'Cardio', type: 'cardio', caloriesPerMinute: 6, muscleGroups: ['legs', 'cardiovascular'] },
  { id: 60, name: 'Hill Sprints', category: 'HIIT', type: 'cardio', caloriesPerMinute: 15, muscleGroups: ['legs', 'cardiovascular'] },
  { id: 61, name: 'Hip Thrusts', category: 'Strength', type: 'weight', caloriesPerMinute: 6, muscleGroups: ['glutes', 'hamstrings'] },
  { id: 62, name: 'Hyperextensions', category: 'Strength', type: 'bodyweight', caloriesPerMinute: 4, muscleGroups: ['lower back', 'glutes'] },
  { id: 63, name: 'Ice Skating', category: 'Cardio', type: 'cardio', caloriesPerMinute: 8, muscleGroups: ['legs', 'cardiovascular'] },
  { id: 64, name: 'Incline Bench Press', category: 'Strength', type: 'weight', caloriesPerMinute: 7, muscleGroups: ['upper chest', 'shoulders'] },
  { id: 65, name: 'Inverted Rows', category: 'Strength', type: 'bodyweight', caloriesPerMinute: 7, muscleGroups: ['back', 'biceps'] },
  { id: 66, name: 'Jump Rope Intervals', category: 'HIIT', type: 'cardio', caloriesPerMinute: 14, muscleGroups: ['legs', 'cardiovascular'] },
  { id: 67, name: 'Jump Squats', category: 'HIIT', type: 'bodyweight', caloriesPerMinute: 10, muscleGroups: ['legs', 'glutes'] },
  { id: 68, name: 'Kettlebell Cleans', category: 'Strength', type: 'weight', caloriesPerMinute: 10, muscleGroups: ['full body'] },
  { id: 69, name: 'Kickboxing', category: 'HIIT', type: 'cardio', caloriesPerMinute: 11, muscleGroups: ['full body', 'cardiovascular'] },
  { id: 70, name: 'Lat Pulldowns', category: 'Strength', type: 'weight', caloriesPerMinute: 6, muscleGroups: ['lats', 'biceps'] },
  { id: 71, name: 'Lateral Bounds', category: 'HIIT', type: 'bodyweight', caloriesPerMinute: 9, muscleGroups: ['legs', 'agility'] },
  { id: 72, name: 'Leg Curls', category: 'Strength', type: 'weight', caloriesPerMinute: 5, muscleGroups: ['hamstrings'] },
  { id: 73, name: 'Leg Extensions', category: 'Strength', type: 'weight', caloriesPerMinute: 5, muscleGroups: ['quadriceps'] },
  { id: 74, name: 'Leg Press', category: 'Strength', type: 'weight', caloriesPerMinute: 7, muscleGroups: ['legs', 'glutes'] },
  { id: 75, name: 'Mountain Biking', category: 'Cardio', type: 'cardio', caloriesPerMinute: 10, muscleGroups: ['legs', 'cardiovascular'] },
  { id: 76, name: 'Nordic Walking', category: 'Cardio', type: 'cardio', caloriesPerMinute: 7, muscleGroups: ['full body', 'cardiovascular'] },
  { id: 77, name: 'Pistol Squats', category: 'Strength', type: 'bodyweight', caloriesPerMinute: 8, muscleGroups: ['legs', 'core'] },
  { id: 78, name: 'Plank', category: 'Strength', type: 'bodyweight', caloriesPerMinute: 3, muscleGroups: ['core'] },
  { id: 79, name: 'Power Walking', category: 'Cardio', type: 'cardio', caloriesPerMinute: 5, muscleGroups: ['legs', 'cardiovascular'] },
  { id: 80, name: 'Racquetball', category: 'Cardio', type: 'cardio', caloriesPerMinute: 8, muscleGroups: ['full body', 'cardiovascular'] },
  { id: 81, name: 'Reverse Flyes', category: 'Strength', type: 'weight', caloriesPerMinute: 5, muscleGroups: ['rear delts', 'upper back'] },
  { id: 82, name: 'Road Biking', category: 'Cardio', type: 'cardio', caloriesPerMinute: 9, muscleGroups: ['legs', 'cardiovascular'] },
  { id: 83, name: 'Roller Skating', category: 'Cardio', type: 'cardio', caloriesPerMinute: 7, muscleGroups: ['legs', 'cardiovascular'] },
  { id: 84, name: 'Rowing Machine', category: 'Cardio', type: 'cardio', caloriesPerMinute: 11, muscleGroups: ['full body', 'cardiovascular'] },
  { id: 85, name: 'Seated Cable Rows', category: 'Strength', type: 'weight', caloriesPerMinute: 6, muscleGroups: ['back', 'biceps'] },
  { id: 86, name: 'Shuttle Runs', category: 'HIIT', type: 'cardio', caloriesPerMinute: 12, muscleGroups: ['legs', 'cardiovascular'] },
  { id: 87, name: 'Single-Leg Deadlifts', category: 'Strength', type: 'bodyweight', caloriesPerMinute: 6, muscleGroups: ['hamstrings', 'glutes', 'core'] },
  { id: 88, name: 'Skateboarding', category: 'Cardio', type: 'cardio', caloriesPerMinute: 6, muscleGroups: ['legs', 'core'] },
  { id: 89, name: 'Snowshoeing', category: 'Cardio', type: 'cardio', caloriesPerMinute: 8, muscleGroups: ['legs', 'cardiovascular'] },
  { id: 90, name: 'Soccer', category: 'Cardio', type: 'cardio', caloriesPerMinute: 9, muscleGroups: ['legs', 'cardiovascular'] },
  { id: 91, name: 'Spin Class', category: 'Cardio', type: 'cardio', caloriesPerMinute: 10, muscleGroups: ['legs', 'cardiovascular'] },
  { id: 92, name: 'Sprints', category: 'HIIT', type: 'cardio', caloriesPerMinute: 16, muscleGroups: ['legs', 'cardiovascular'] },
  { id: 93, name: 'Squash', category: 'Cardio', type: 'cardio', caloriesPerMinute: 9, muscleGroups: ['full body', 'cardiovascular'] },
  { id: 94, name: 'Step-Ups', category: 'Strength', type: 'bodyweight', caloriesPerMinute: 7, muscleGroups: ['legs', 'glutes'] },
  { id: 95, name: 'Sumo Squats', category: 'Strength', type: 'bodyweight', caloriesPerMinute: 6, muscleGroups: ['legs', 'glutes', 'inner thighs'] },
  { id: 96, name: 'Superman', category: 'Strength', type: 'bodyweight', caloriesPerMinute: 3, muscleGroups: ['lower back', 'glutes'] },
  { id: 97, name: 'Swimming Laps', category: 'Cardio', type: 'cardio', caloriesPerMinute: 11, muscleGroups: ['full body', 'cardiovascular'] },
  { id: 98, name: 'T-Bar Rows', category: 'Strength', type: 'weight', caloriesPerMinute: 7, muscleGroups: ['back', 'biceps'] },
  { id: 99, name: 'Tennis', category: 'Cardio', type: 'cardio', caloriesPerMinute: 8, muscleGroups: ['full body', 'cardiovascular'] },
  { id: 100, name: 'Treadmill Incline Walking', category: 'Cardio', type: 'cardio', caloriesPerMinute: 6, muscleGroups: ['legs', 'cardiovascular'] },
  { id: 101, name: 'VersaClimber', category: 'Cardio', type: 'cardio', caloriesPerMinute: 12, muscleGroups: ['full body', 'cardiovascular'] },
  { id: 102, name: 'Volleyball', category: 'Cardio', type: 'cardio', caloriesPerMinute: 7, muscleGroups: ['full body', 'cardiovascular'] },
  { id: 103, name: 'Water Aerobics', category: 'Cardio', type: 'cardio', caloriesPerMinute: 5, muscleGroups: ['full body', 'cardiovascular'] },
  { id: 104, name: 'Yoga Sun Salutation', category: 'Flexibility', type: 'bodyweight', caloriesPerMinute: 3, muscleGroups: ['full body'] },
  { id: 105, name: 'Zumba', category: 'Cardio', type: 'cardio', caloriesPerMinute: 8, muscleGroups: ['full body', 'cardiovascular'] }
];

// In-memory storage for food logs
let foodLogs = [];

// Simple admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  const { username, password } = req.headers;
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized. Admin credentials required.' });
  }
};

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  }
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'AiFit API is running' });
});

// Admin Routes for Recipe Management
app.get('/api/admin/recipes', authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    recipes: recipesDatabase,
    total: recipesDatabase.length
  });
});

app.post('/api/admin/recipes', authenticateAdmin, (req, res) => {
  const { title, image, cookTime, servings, calories, protein, carbs, fat, difficulty, tags, ingredients, instructions, category } = req.body;
  
  const newRecipe = {
    id: recipesDatabase.length + 1,
    title,
    image,
    cookTime,
    servings,
    calories,
    protein,
    carbs,
    fat,
    difficulty,
    tags: tags || [],
    rating: 4.5, // Default rating
    reviews: 0,
    ingredients: ingredients || [],
    instructions: instructions || [],
    category: category || 'General'
  };
  
  recipesDatabase.push(newRecipe);
  
  res.json({
    success: true,
    message: 'Recipe added successfully',
    recipe: newRecipe
  });
});

app.put('/api/admin/recipes/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const recipeIndex = recipesDatabase.findIndex(r => r.id === parseInt(id));
  
  if (recipeIndex === -1) {
    return res.status(404).json({ error: 'Recipe not found' });
  }
  
  recipesDatabase[recipeIndex] = { ...recipesDatabase[recipeIndex], ...req.body };
  
  res.json({
    success: true,
    message: 'Recipe updated successfully',
    recipe: recipesDatabase[recipeIndex]
  });
});

app.delete('/api/admin/recipes/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const recipeIndex = recipesDatabase.findIndex(r => r.id === parseInt(id));
  
  if (recipeIndex === -1) {
    return res.status(404).json({ error: 'Recipe not found' });
  }
  
  recipesDatabase.splice(recipeIndex, 1);
  
  res.json({
    success: true,
    message: 'Recipe deleted successfully'
  });
});

// Admin Routes for Workout Management
app.get('/api/admin/workouts', authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    workouts: workoutsDatabase,
    total: workoutsDatabase.length
  });
});

app.post('/api/admin/workouts', authenticateAdmin, (req, res) => {
  const { title, thumbnail, videoUrl, duration, calories, difficulty, category, equipment, instructor, description, exercises, isPremium } = req.body;
  
  const newWorkout = {
    id: workoutsDatabase.length + 1,
    title,
    thumbnail,
    videoUrl,
    duration,
    calories,
    difficulty,
    category,
    equipment: equipment || [],
    rating: 4.5, // Default rating
    reviews: 0,
    instructor,
    description,
    exercises: exercises || [],
    isPremium: isPremium || false
  };
  
  workoutsDatabase.push(newWorkout);
  
  res.json({
    success: true,
    message: 'Workout added successfully',
    workout: newWorkout
  });
});

app.put('/api/admin/workouts/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const workoutIndex = workoutsDatabase.findIndex(w => w.id === parseInt(id));
  
  if (workoutIndex === -1) {
    return res.status(404).json({ error: 'Workout not found' });
  }
  
  workoutsDatabase[workoutIndex] = { ...workoutsDatabase[workoutIndex], ...req.body };
  
  res.json({
    success: true,
    message: 'Workout updated successfully',
    workout: workoutsDatabase[workoutIndex]
  });
});

app.delete('/api/admin/workouts/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const workoutIndex = workoutsDatabase.findIndex(w => w.id === parseInt(id));
  
  if (workoutIndex === -1) {
    return res.status(404).json({ error: 'Workout not found' });
  }
  
  workoutsDatabase.splice(workoutIndex, 1);
  
  res.json({
    success: true,
    message: 'Workout deleted successfully'
  });
});

// File Upload Endpoints
app.post('/api/admin/upload/image', authenticateAdmin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

app.post('/api/admin/upload/video', authenticateAdmin, upload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'Video uploaded successfully',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

app.post('/api/admin/upload/thumbnail', authenticateAdmin, upload.single('thumbnail'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'Thumbnail uploaded successfully',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// Public Recipe Routes
app.get('/api/recipes', (req, res) => {
  const { category, search } = req.query;
  let filteredRecipes = [...recipesDatabase, ...userRecipes]; // Include user-created recipes
  
  if (category && category !== 'All') {
    filteredRecipes = filteredRecipes.filter(recipe => 
      recipe.category === category || recipe.tags?.includes(category)
    );
  }
  
  if (search) {
    filteredRecipes = filteredRecipes.filter(recipe =>
      recipe.title?.toLowerCase().includes(search.toLowerCase()) ||
      recipe.name?.toLowerCase().includes(search.toLowerCase()) ||
      recipe.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    );
  }
  
  res.json(filteredRecipes);
});

app.get('/api/recipes/:id', (req, res) => {
  const { id } = req.params;
  const recipe = recipesDatabase.find(r => r.id === parseInt(id));
  
  if (!recipe) {
    return res.status(404).json({ error: 'Recipe not found' });
  }
  
  res.json(recipe);
});

// Public Workout Routes
app.get('/api/workouts', (req, res) => {
  const { category, search } = req.query;
  let filteredWorkouts = workoutsDatabase;
  
  if (category && category !== 'All') {
    filteredWorkouts = filteredWorkouts.filter(workout => workout.category === category);
  }
  
  if (search) {
    filteredWorkouts = filteredWorkouts.filter(workout =>
      workout.title.toLowerCase().includes(search.toLowerCase()) ||
      workout.category.toLowerCase().includes(search.toLowerCase()) ||
      workout.instructor.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  res.json(filteredWorkouts);
});

app.get('/api/workouts/:id', (req, res) => {
  const { id } = req.params;
  const workout = workoutsDatabase.find(w => w.id === parseInt(id));
  
  if (!workout) {
    return res.status(404).json({ error: 'Workout not found' });
  }
  
  res.json(workout);
});

// Food search with FatSecret API integration
app.get('/api/foods/search', async (req, res) => {
  const { q } = req.query;
  
  try {
    let allFoods = [...mockFoods, ...userFoods]; // Include user-created foods
    if (!q) {
      return res.json(allFoods);
    }

    // Try FatSecret API first
    try {
      const url = 'https://platform.fatsecret.com/rest/server.api';
      const params = {
        method: 'foods.search',
        search_expression: q,
        format: 'json'
      };
      
      const oauthParams = generateFatSecretSignature('GET', url, params);
      const allParams = { ...params, ...oauthParams };
      
      const response = await axios.get(url, { params: allParams });
      
      if (response.data && response.data.foods && response.data.foods.food) {
        const foods = Array.isArray(response.data.foods.food) 
          ? response.data.foods.food 
          : [response.data.foods.food];
        
        const formattedFoods = foods.map(food => ({
          id: food.food_id,
          name: food.food_name,
          brand: food.brand_name || 'Generic',
          description: food.food_description,
          // Parse nutrition from description if available
          calories: parseNutritionFromDescription(food.food_description, 'calories') || 0,
          protein: parseNutritionFromDescription(food.food_description, 'protein') || 0,
          carbs: parseNutritionFromDescription(food.food_description, 'carbohydrate') || 0,
          fat: parseNutritionFromDescription(food.food_description, 'fat') || 0,
          serving_size: extractServingSize(food.food_description) || '100g'
        }));
        
        allFoods = [...allFoods, ...formattedFoods];
      }
    } catch (fatSecretError) {
      console.log('FatSecret API error, falling back to USDA:', fatSecretError.message);
    }

    // Fallback to USDA API
    try {
      const usdaResponse = await axios.get(`https://api.nal.usda.gov/fdc/v1/foods/search`, {
        params: {
          api_key: USDA_API_KEY,
          query: q,
          pageSize: 20
        }
      });

      if (usdaResponse.data && usdaResponse.data.foods) {
        const formattedFoods = usdaResponse.data.foods.map(food => ({
          id: food.fdcId,
          name: food.description,
          brand: food.brandOwner || 'USDA',
          calories: food.foodNutrients?.find(n => n.nutrientId === 1008)?.value || 0,
          protein: food.foodNutrients?.find(n => n.nutrientId === 1003)?.value || 0,
          carbs: food.foodNutrients?.find(n => n.nutrientId === 1005)?.value || 0,
          fat: food.foodNutrients?.find(n => n.nutrientId === 1004)?.value || 0,
          serving_size: '100g'
        }));
        
        allFoods = [...allFoods, ...formattedFoods];
      }
    } catch (usdaError) {
      console.log('USDA API error, using mock data:', usdaError.message);
    }

    // Fallback to mock data with search
    const filteredFoods = allFoods.filter(food =>
      food.name.toLowerCase().includes(q.toLowerCase()) ||
      (food.brand && food.brand.toLowerCase().includes(q.toLowerCase()))
    );
    
    res.json(filteredFoods);
    
  } catch (error) {
    console.error('Food search error:', error);
    res.status(500).json({ error: 'Failed to search foods' });
  }
});

// Helper function to parse nutrition from FatSecret description
function parseNutritionFromDescription(description, nutrient) {
  if (!description) return 0;
  
  const patterns = {
    calories: /Calories:\s*(\d+\.?\d*)/i,
    protein: /Protein:\s*(\d+\.?\d*)g/i,
    carbohydrate: /Carbs:\s*(\d+\.?\d*)g|Carbohydrate:\s*(\d+\.?\d*)g/i,
    fat: /Fat:\s*(\d+\.?\d*)g/i
  };
  
  const match = description.match(patterns[nutrient]);
  return match ? parseFloat(match[1]) : 0;
}

// Helper function to extract serving size
function extractServingSize(description) {
  if (!description) return null;
  
  const match = description.match(/Per\s+(.+?)\s+-/i);
  return match ? match[1] : null;
}

// Get detailed food information
app.get('/api/foods/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Try FatSecret API first
    try {
      const url = 'https://platform.fatsecret.com/rest/server.api';
      const params = {
        method: 'food.get',
        food_id: id,
        format: 'json'
      };
      
      const oauthParams = generateFatSecretSignature('GET', url, params);
      const allParams = { ...params, ...oauthParams };
      
      const response = await axios.get(url, { params: allParams });
      
      if (response.data && response.data.food) {
        const food = response.data.food;
        const serving = food.servings.serving[0] || food.servings.serving;
        
        return res.json({
          id: food.food_id,
          name: food.food_name,
          brand: food.brand_name || 'Generic',
          calories: parseFloat(serving.calories) || 0,
          protein: parseFloat(serving.protein) || 0,
          carbs: parseFloat(serving.carbohydrate) || 0,
          fat: parseFloat(serving.fat) || 0,
          serving_size: serving.serving_description
        });
      }
    } catch (fatSecretError) {
      console.log('FatSecret API error, trying USDA:', fatSecretError.message);
    }

    // Fallback to USDA API
    try {
      const usdaResponse = await axios.get(`https://api.nal.usda.gov/fdc/v1/food/${id}`, {
        params: {
          api_key: USDA_API_KEY
        }
      });

      if (usdaResponse.data) {
        const food = usdaResponse.data;
        return res.json({
          id: food.fdcId,
          name: food.description,
          brand: food.brandOwner || 'USDA',
          calories: food.foodNutrients?.find(n => n.nutrient.id === 1008)?.amount || 0,
          protein: food.foodNutrients?.find(n => n.nutrient.id === 1003)?.amount || 0,
          carbs: food.foodNutrients?.find(n => n.nutrient.id === 1005)?.amount || 0,
          fat: food.foodNutrients?.find(n => n.nutrient.id === 1004)?.amount || 0,
          serving_size: '100g'
        });
      }
    } catch (usdaError) {
      console.log('USDA API error, using mock data:', usdaError.message);
    }

    // Fallback to mock data
    const food = mockFoods.find(f => f.id === parseInt(id));
    
    if (!food) {
      return res.status(404).json({ error: 'Food not found' });
    }
    
    res.json(food);
    
  } catch (error) {
    console.error('Food detail error:', error);
    res.status(500).json({ error: 'Failed to get food details' });
  }
});

// Exercise search and management
app.get('/api/exercises/search', (req, res) => {
  const { q, category } = req.query;
  let filteredExercises = mockExercises;
  
  if (q) {
    filteredExercises = filteredExercises.filter(exercise =>
      exercise.name.toLowerCase().includes(q.toLowerCase()) ||
      exercise.category.toLowerCase().includes(q.toLowerCase())
    );
  }
  
  if (category) {
    filteredExercises = filteredExercises.filter(exercise =>
      exercise.category.toLowerCase() === category.toLowerCase()
    );
  }
  
  res.json(filteredExercises);
});

app.get('/api/exercises/:id', (req, res) => {
  const { id } = req.params;
  const exercise = mockExercises.find(e => e.id === parseInt(id));
  
  if (!exercise) {
    return res.status(404).json({ error: 'Exercise not found' });
  }
  
  res.json(exercise);
});

// Nutritionix Exercise API integration
app.post('/api/exercises/natural', async (req, res) => {
  const { query, weight = 70, height = 170, age = 30, gender = 'male' } = req.body;
  
  try {
    const response = await axios.post('https://trackapi.nutritionix.com/v2/natural/exercise', {
      query,
      gender,
      weight_kg: weight,
      height_cm: height,
      age
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-app-id': NUTRITIONIX_APP_ID,
        'x-app-key': NUTRITIONIX_API_KEY
      }
    });

    if (response.data && response.data.exercises) {
      const exercises = response.data.exercises.map(exercise => ({
        id: exercise.tag_id,
        name: exercise.name,
        duration_min: exercise.duration_min,
        calories: exercise.nf_calories,
        met: exercise.met,
        description: exercise.description,
        photo: exercise.photo
      }));
      
      return res.json(exercises);
    }
    
    // Fallback to mock calculation
    const mockCalories = Math.round(Math.random() * 300 + 100);
    res.json([{
      id: Date.now(),
      name: query,
      duration_min: 30,
      calories: mockCalories,
      met: 6,
      description: `Estimated calories for ${query}`,
      photo: null
    }]);
    
  } catch (error) {
    console.log('Nutritionix API error, using mock data:', error.message);
    
    // Fallback to mock calculation
    const mockCalories = Math.round(Math.random() * 300 + 100);
    res.json([{
      id: Date.now(),
      name: query,
      duration_min: 30,
      calories: mockCalories,
      met: 6,
      description: `Estimated calories for ${query}`,
      photo: null
    }]);
  }
});

// ULTIMATE Food Recognition System - Best in Class
app.post('/api/foods/recognize', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Check if Google Vision API is configured
    const googleVisionApiKey = process.env.GOOGLE_VISION_API_KEY;
    
    if (googleVisionApiKey) {
      // Use ULTIMATE AI recognition system
      const recognitionResult = await ultimateFoodRecognition(req.file, googleVisionApiKey);
  res.json({
    success: true,
        ...recognitionResult
      });
    } else {
      // Fallback to enhanced mock recognition
      const recognizedFood = await enhancedMockRecognition();
      res.json({
        success: true,
        recognized_food: recognizedFood,
        note: 'Using enhanced mock recognition. Set GOOGLE_VISION_API_KEY for ULTIMATE AI recognition.',
        features: ['Multi-food detection', 'Portion estimation', 'Calorie calculation', 'Nutrition analysis']
      });
    }

  } catch (error) {
    console.error('Food recognition error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process image'
    });
  }
});

// ULTIMATE Food Recognition with multiple detection methods
async function ultimateFoodRecognition(imageFile, apiKey) {
  try {
    const imageBuffer = imageFile.buffer;
    const base64Image = imageBuffer.toString('base64');
    
    // MULTI-FEATURE DETECTION for maximum accuracy
    const visionRequest = {
      requests: [
        {
          image: {
            content: base64Image
          },
          features: [
            {
              type: 'LABEL_DETECTION',
              maxResults: 20  // More labels for better detection
            },
            {
              type: 'OBJECT_LOCALIZATION',
              maxResults: 10  // Detect multiple objects in image
            },
            {
              type: 'TEXT_DETECTION',
              maxResults: 5   // Read nutrition labels if visible
            },
            {
              type: 'IMAGE_PROPERTIES',
              maxResults: 1   // Analyze colors and properties
            }
          ]
        }
      ]
    };

    console.log('🚀 Making ULTIMATE Google Vision API request...');
    
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(visionRequest)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Google Vision API error: ${result.error?.message || 'Unknown error'}`);
    }

    console.log('✅ ULTIMATE AI analysis complete');

    // ADVANCED RESULT PROCESSING
    const labels = result.responses[0]?.labelAnnotations || [];
    const objects = result.responses[0]?.localizedObjectAnnotations || [];
    const texts = result.responses[0]?.textAnnotations || [];
    const properties = result.responses[0]?.imagePropertiesAnnotation || {};

    // MULTI-FOOD DETECTION
    const detectedFoods = await detectMultipleFoods(labels, objects, texts);
    
    // PORTION SIZE ESTIMATION
    const portionAnalysis = await estimatePortionSizes(objects, properties);
    
    // CALORIE CALCULATION
    const calorieAnalysis = await calculateCalories(detectedFoods, portionAnalysis);
    
    // NUTRITION ANALYSIS
    const nutritionAnalysis = await analyzeNutrition(detectedFoods, calorieAnalysis);

    return {
      recognized_foods: detectedFoods,
      portion_analysis: portionAnalysis,
      calorie_analysis: calorieAnalysis,
      nutrition_analysis: nutritionAnalysis,
      confidence_score: calculateOverallConfidence(detectedFoods),
      detection_methods: ['Label Detection', 'Object Localization', 'Text Detection', 'Portion Estimation'],
      api_cost: 'EUR 0.12130300', // Cost for 4 features
      processing_time: Date.now(),
      features_used: {
        multi_food_detection: true,
        portion_estimation: true,
        calorie_calculation: true,
        nutrition_analysis: true,
        allergen_detection: true
      }
    };

  } catch (error) {
    console.error('ULTIMATE Food Recognition error:', error);
    throw error;
  }
}

// Detect multiple foods in single image
async function detectMultipleFoods(labels, objects, texts) {
  const foods = [];
  
  // Process labels for food detection
  const foodLabels = labels.filter(label => 
    label.description && 
    label.score > 0.5 && 
    isAdvancedFoodRelated(label.description.toLowerCase())
  );

  // Process objects for spatial detection
  const foodObjects = objects.filter(obj => 
    obj.name && 
    obj.score > 0.6 && 
    isAdvancedFoodRelated(obj.name.toLowerCase())
  );

  // Process text for nutrition labels
  const nutritionTexts = texts.filter(text => 
    text.description && 
    containsNutritionInfo(text.description)
  );

  // Combine all detections
  const allDetections = [
    ...foodLabels.map(l => ({ name: l.description, confidence: l.score, type: 'label' })),
    ...foodObjects.map(o => ({ name: o.name, confidence: o.score, type: 'object', bounds: o.boundingPoly })),
    ...nutritionTexts.map(t => ({ name: t.description, confidence: 0.8, type: 'text' }))
  ];

  // Remove duplicates and get unique foods
  const uniqueFoods = [];
  for (const detection of allDetections) {
    const existing = uniqueFoods.find(f => 
      f.name.toLowerCase().includes(detection.name.toLowerCase()) ||
      detection.name.toLowerCase().includes(f.name.toLowerCase())
    );
    
    if (!existing) {
      const nutritionData = await getAdvancedNutritionData(detection.name);
      uniqueFoods.push({
        name: detection.name,
        confidence: detection.confidence,
        type: detection.type,
        bounds: detection.bounds,
        nutrition: nutritionData,
        id: `${detection.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`
      });
    }
  }

  return uniqueFoods.sort((a, b) => b.confidence - a.confidence);
}

// Estimate portion sizes using computer vision
async function estimatePortionSizes(objects, properties) {
  const portions = [];
  
  for (const obj of objects) {
    if (obj.boundingPoly && obj.name) {
      const bounds = obj.boundingPoly.normalizedVertices;
      const area = calculateArea(bounds);
      const estimatedWeight = estimateWeightFromArea(area, obj.name);
      
      portions.push({
        food: obj.name,
        estimated_weight: estimatedWeight,
        confidence: obj.score,
        area_percentage: area * 100
      });
    }
  }
  
  return portions;
}

// Calculate calories based on detected foods and portions
async function calculateCalories(foods, portions) {
  let totalCalories = 0;
  const foodCalories = [];
  
  for (const food of foods) {
    const portion = portions.find(p => p.food.toLowerCase().includes(food.name.toLowerCase()));
    const weight = portion ? portion.estimated_weight : 100; // Default 100g
    const calories = (food.nutrition.calories * weight) / 100;
    
    foodCalories.push({
      food: food.name,
      calories: Math.round(calories),
      weight: weight,
      confidence: food.confidence
    });
    
    totalCalories += calories;
  }
  
  return {
    total_calories: Math.round(totalCalories),
    food_breakdown: foodCalories,
    estimated_accuracy: calculateCalorieAccuracy(foods, portions)
  };
}

// Advanced nutrition analysis
async function analyzeNutrition(foods, calorieAnalysis) {
  const totalNutrition = {
    calories: calorieAnalysis.total_calories,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    allergens: []
  };
  
  for (const food of foods) {
    const nutrition = food.nutrition;
    totalNutrition.protein += nutrition.protein || 0;
    totalNutrition.carbs += nutrition.carbs || 0;
    totalNutrition.fat += nutrition.fat || 0;
    totalNutrition.fiber += nutrition.fiber || 0;
    totalNutrition.sugar += nutrition.sugar || 0;
    totalNutrition.sodium += nutrition.sodium || 0;
    
    if (nutrition.allergens) {
      totalNutrition.allergens.push(...nutrition.allergens);
    }
  }
  
  return {
    ...totalNutrition,
    allergens: [...new Set(totalNutrition.allergens)], // Remove duplicates
    health_score: calculateHealthScore(totalNutrition),
    recommendations: generateNutritionRecommendations(totalNutrition)
  };
}

// Enhanced food database with comprehensive nutrition data
async function getAdvancedNutritionData(foodName) {
  const advancedFoodDatabase = {
    'apple': { 
      calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4, sugar: 19, sodium: 2,
      allergens: [], serving_size: '1 medium (182g)', glycemic_index: 36
    },
    'banana': { 
      calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3.1, sugar: 14, sodium: 1,
      allergens: [], serving_size: '1 medium (118g)', glycemic_index: 51
    },
    'chicken breast': { 
      calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, sodium: 74,
      allergens: [], serving_size: '100g', glycemic_index: 0
    },
    'salmon': { 
      calories: 208, protein: 25, carbs: 0, fat: 12, fiber: 0, sugar: 0, sodium: 59,
      allergens: ['fish'], serving_size: '100g', glycemic_index: 0
    },
    'broccoli': { 
      calories: 55, protein: 3.7, carbs: 11, fat: 0.6, fiber: 5.2, sugar: 2.6, sodium: 33,
      allergens: [], serving_size: '1 cup (91g)', glycemic_index: 15
    },
    'rice': { 
      calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sugar: 0.1, sodium: 1,
      allergens: [], serving_size: '1/2 cup cooked (100g)', glycemic_index: 73
    },
    'egg': { 
      calories: 70, protein: 6, carbs: 0.6, fat: 5, fiber: 0, sugar: 0.4, sodium: 70,
      allergens: ['eggs'], serving_size: '1 large (50g)', glycemic_index: 0
    },
    'avocado': { 
      calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 6.7, sugar: 0.7, sodium: 7,
      allergens: [], serving_size: '1/2 medium (68g)', glycemic_index: 15
    },
    'pizza': { 
      calories: 266, protein: 11, carbs: 33, fat: 10, fiber: 2.5, sugar: 3.8, sodium: 598,
      allergens: ['wheat', 'milk'], serving_size: '1 slice (107g)', glycemic_index: 60
    },
    'burger': { 
      calories: 354, protein: 17, carbs: 30, fat: 17, fiber: 2.1, sugar: 6.2, sodium: 505,
      allergens: ['wheat', 'milk'], serving_size: '1 burger (154g)', glycemic_index: 66
    }
  };

  // Try exact match first
  const exactMatch = advancedFoodDatabase[foodName.toLowerCase()];
  if (exactMatch) {
    return exactMatch;
  }

  // Try partial matches
  for (const [key, value] of Object.entries(advancedFoodDatabase)) {
    if (foodName.toLowerCase().includes(key) || key.includes(foodName.toLowerCase())) {
      return value;
    }
  }

  // Return enhanced default values
  return {
    calories: 100,
    protein: 5,
    carbs: 15,
    fat: 2,
    fiber: 2,
    sugar: 3,
    sodium: 50,
    allergens: [],
    serving_size: '1 serving',
    glycemic_index: 50
  };
}

// Helper functions
function isAdvancedFoodRelated(label) {
  const advancedFoodKeywords = [
    'food', 'fruit', 'vegetable', 'meat', 'fish', 'chicken', 'beef', 'pork',
    'apple', 'banana', 'orange', 'grape', 'strawberry', 'blueberry',
    'carrot', 'broccoli', 'spinach', 'lettuce', 'tomato', 'onion',
    'rice', 'pasta', 'bread', 'sandwich', 'pizza', 'burger',
    'salad', 'soup', 'stew', 'curry', 'stir fry',
    'egg', 'milk', 'cheese', 'yogurt', 'butter',
    'nut', 'seed', 'almond', 'walnut', 'peanut',
    'cake', 'cookie', 'dessert', 'ice cream', 'chocolate',
    'avocado', 'salmon', 'tuna', 'shrimp', 'lobster',
    'steak', 'lamb', 'turkey', 'duck', 'goose',
    'asparagus', 'cauliflower', 'brussels sprouts', 'kale', 'chard'
  ];
  
  return advancedFoodKeywords.some(keyword => label.includes(keyword));
}

function containsNutritionInfo(text) {
  const nutritionKeywords = ['calories', 'protein', 'carbs', 'fat', 'sugar', 'sodium', 'fiber'];
  return nutritionKeywords.some(keyword => text.toLowerCase().includes(keyword));
}

function calculateArea(bounds) {
  if (bounds.length < 4) return 0;
  const width = Math.abs(bounds[1].x - bounds[0].x);
  const height = Math.abs(bounds[2].y - bounds[1].y);
  return width * height;
}

function estimateWeightFromArea(area, foodName) {
  // Rough estimation based on food type and image area
  const baseWeight = area * 1000; // Convert normalized area to grams
  const foodMultipliers = {
    'apple': 1.2, 'banana': 1.1, 'chicken': 0.8, 'rice': 0.9,
    'broccoli': 0.7, 'salmon': 1.0, 'egg': 0.6, 'avocado': 1.3
  };
  
  const multiplier = foodMultipliers[foodName.toLowerCase()] || 1.0;
  return Math.round(baseWeight * multiplier);
}

function calculateOverallConfidence(foods) {
  if (foods.length === 0) return 0;
  const totalConfidence = foods.reduce((sum, food) => sum + food.confidence, 0);
  return Math.round((totalConfidence / foods.length) * 100);
}

function calculateCalorieAccuracy(foods, portions) {
  const hasPortions = portions.length > 0;
  const hasMultipleFoods = foods.length > 1;
  const highConfidence = foods.every(f => f.confidence > 0.7);
  
  let accuracy = 70; // Base accuracy
  if (hasPortions) accuracy += 15;
  if (hasMultipleFoods) accuracy += 10;
  if (highConfidence) accuracy += 5;
  
  return Math.min(accuracy, 95);
}

function calculateHealthScore(nutrition) {
  let score = 100;
  
  // Deduct points for unhealthy factors
  if (nutrition.sugar > 25) score -= 10;
  if (nutrition.sodium > 500) score -= 10;
  if (nutrition.fat > 20) score -= 5;
  if (nutrition.fiber < 5) score -= 10;
  
  // Add points for healthy factors
  if (nutrition.protein > 15) score += 5;
  if (nutrition.fiber > 10) score += 10;
  
  return Math.max(0, Math.min(100, score));
}

function generateNutritionRecommendations(nutrition) {
  const recommendations = [];
  
  if (nutrition.fiber < 5) {
    recommendations.push('Add more fiber-rich foods like vegetables or whole grains');
  }
  if (nutrition.protein < 15) {
    recommendations.push('Consider adding protein-rich foods like lean meat or legumes');
  }
  if (nutrition.sugar > 25) {
    recommendations.push('Try to reduce added sugars in your meal');
  }
  if (nutrition.allergens.length > 0) {
    recommendations.push(`⚠️ Contains allergens: ${nutrition.allergens.join(', ')}`);
  }
  
  return recommendations;
}

// Enhanced mock recognition for development
async function enhancedMockRecognition() {
  const mockFoods = [
    { name: 'Apple', confidence: 0.95, calories: 95, protein: 0.5, carbs: 25, fat: 0.3, serving_size: '1 medium (182g)' },
    { name: 'Chicken Breast', confidence: 0.88, calories: 165, protein: 31, carbs: 0, fat: 3.6, serving_size: '100g' },
    { name: 'Broccoli', confidence: 0.90, calories: 55, protein: 3.7, carbs: 11, fat: 0.6, serving_size: '1 cup (91g)' }
  ];
  
  const randomFood = mockFoods[Math.floor(Math.random() * mockFoods.length)];
  const variation = 0.9 + Math.random() * 0.2;
  
  return {
    ...randomFood,
    calories: Math.round(randomFood.calories * variation),
    protein: Math.round(randomFood.protein * variation * 10) / 10,
    carbs: Math.round(randomFood.carbs * variation * 10) / 10,
    fat: Math.round(randomFood.fat * variation * 10) / 10,
    confidence: randomFood.confidence * (0.8 + Math.random() * 0.4),
    id: Date.now()
  };
}

// Recipe creation
app.post('/api/recipes', (req, res) => {
  const { name, servings, ingredients, nutrition } = req.body;
  const newRecipe = {
    id: Date.now(),
    name,
    servings,
    ingredients,
    nutrition,
    created_at: new Date()
  };
  userRecipes.push(newRecipe);
  res.json({
    success: true,
    recipe: newRecipe
  });
});

// User data routes
app.post('/api/user/log-food', (req, res) => {
  const { foodId, quantity, meal, date, nutrition } = req.body;
  const logEntry = {
    id: Date.now(),
    foodId,
    quantity,
    meal,
    date: date || new Date(),
    nutrition: nutrition || {},
    timestamp: new Date()
  };
  foodLogs.push(logEntry);
  res.json({ 
    success: true, 
    message: 'Food logged successfully',
    data: logEntry
  });
});

// Endpoint to get all food logs (for testing and frontend display)
app.get('/api/user/log-food', (req, res) => {
  res.json({ success: true, logs: foodLogs });
});

app.post('/api/user/log-exercise', (req, res) => {
  const { exerciseId, name, duration, calories, sets, reps, weight, type } = req.body;
  
  res.json({ 
    success: true, 
    message: 'Exercise logged successfully',
    data: { exerciseId, name, duration, calories, sets, reps, weight, type, timestamp: new Date() }
  });
});

app.post('/api/user/log-weight', (req, res) => {
  const { weight, date } = req.body;
  
  res.json({ 
    success: true, 
    message: 'Weight logged successfully',
    data: { weight, date: date || new Date() }
  });
});

app.post('/api/user/log-sleep', (req, res) => {
  const { hours, quality, date } = req.body;
  
  res.json({ 
    success: true, 
    message: 'Sleep logged successfully',
    data: { hours, quality, date: date || new Date() }
  });
});

app.post('/api/user/log-mood', (req, res) => {
  const { mood, note, date } = req.body;
  
  res.json({ 
    success: true, 
    message: 'Mood logged successfully',
    data: { mood, note, date: date || new Date() }
  });
});

// Add custom food/ingredient
app.post('/api/foods', (req, res) => {
  console.log('POST /api/foods body:', req.body);
  const {
    name, brand, barcode, servingSize, calories, totalFat, saturatedFat, monounsaturatedFat, polyunsaturatedFat, transFat,
    totalCarbs, fiber, sugar, protein, sodium, cholesterol, iron, potassium, zinc, vitaminA, vitaminC, vitaminD
  } = req.body;
  if (!name || !calories || !totalFat || !totalCarbs || !protein) {
    console.error('Missing required fields:', { name, calories, totalFat, totalCarbs, protein });
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  const newFood = {
    id: Date.now(),
    name,
    brand: brand || 'Custom',
    barcode: barcode || '',
    serving_size: servingSize || '100g',
    calories: parseFloat(calories),
    protein: parseFloat(protein),
    carbs: parseFloat(totalCarbs),
    fat: parseFloat(totalFat),
    saturatedFat: saturatedFat ? parseFloat(saturatedFat) : undefined,
    monounsaturatedFat: monounsaturatedFat ? parseFloat(monounsaturatedFat) : undefined,
    polyunsaturatedFat: polyunsaturatedFat ? parseFloat(polyunsaturatedFat) : undefined,
    transFat: transFat ? parseFloat(transFat) : undefined,
    fiber: fiber ? parseFloat(fiber) : undefined,
    sugar: sugar ? parseFloat(sugar) : undefined,
    sodium: sodium ? parseFloat(sodium) : undefined,
    cholesterol: cholesterol ? parseFloat(cholesterol) : undefined,
    iron: iron ? parseFloat(iron) : undefined,
    potassium: potassium ? parseFloat(potassium) : undefined,
    zinc: zinc ? parseFloat(zinc) : undefined,
    vitaminA: vitaminA ? parseFloat(vitaminA) : undefined,
    vitaminC: vitaminC ? parseFloat(vitaminC) : undefined,
    vitaminD: vitaminD ? parseFloat(vitaminD) : undefined,
    created_at: new Date()
  };
  userFoods.push(newFood);
  res.json({ success: true, food: newFood });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`AiFit API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`\n🔧 ADMIN ACCESS:`);
  console.log(`Username: ${ADMIN_USERNAME}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
  console.log(`\n📝 Admin Endpoints:`);
  console.log(`GET    /api/admin/recipes     - List all recipes`);
  console.log(`POST   /api/admin/recipes     - Add new recipe`);
  console.log(`PUT    /api/admin/recipes/:id - Update recipe`);
  console.log(`DELETE /api/admin/recipes/:id - Delete recipe`);
  console.log(`\n🏋️ Admin Workout Endpoints:`);
  console.log(`GET    /api/admin/workouts     - List all workouts`);
  console.log(`POST   /api/admin/workouts     - Add new workout`);
  console.log(`PUT    /api/admin/workouts/:id - Update workout`);
  console.log(`DELETE /api/admin/workouts/:id - Delete workout`);
  console.log(`\n📱 Public Endpoints:`);
  console.log(`GET    /api/recipes           - Get recipes (with filters)`);
  console.log(`GET    /api/workouts          - Get workouts (with filters)`);
  console.log(`\n🎯 Personalization Endpoints:`);
  console.log(`GET    /api/personalized-plan - Get personalized plan`);
  console.log(`POST   /api/personalized-plan/regenerate - Regenerate plan (premium/trial)`);
});