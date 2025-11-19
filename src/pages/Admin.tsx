import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { API_ENDPOINTS, API_BASE_URL } from '../config/api';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  ChefHat, 
  Dumbbell,
  Eye,
  Upload,
  Settings,
  Users,
  BarChart3,
  Shield
} from 'lucide-react';
import axios from 'axios';

interface Recipe {
  id: number;
  title: string;
  image: string;
  cookTime: number;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  difficulty: string;
  tags: string[];
  ingredients: string[];
  instructions: string[];
  category: string;
  rating: number;
  reviews: number;
}

interface Workout {
  id: number;
  title: string;
  thumbnail: string;
  videoUrl?: string;
  duration: number;
  calories: number;
  difficulty: string;
  category: string;
  equipment: string[];
  instructor: string;
  description: string;
  exercises: any[];
  isPremium: boolean;
  rating: number;
  reviews: number;
}

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'recipes' | 'workouts' | 'meditations' | 'analytics'>('recipes');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [meditations, setMeditations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showMeditationModal, setShowMeditationModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [editingMeditation, setEditingMeditation] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  // File upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  // Meditation form state
  const [meditationForm, setMeditationForm] = useState({
    title: '',
    category: 'sleep',
    duration: 10,
    description: '',
    audioUrl: ''
  });

  // Recipe form state
  const [recipeForm, setRecipeForm] = useState({
    title: '',
    image: '',
    cookTime: 0,
    servings: 0,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    difficulty: 'Easy',
    tags: '',
    ingredients: '',
    instructions: '',
    category: 'Breakfast'
  });

  // Workout form state
  const [workoutForm, setWorkoutForm] = useState({
    title: '',
    thumbnail: '',
    videoUrl: '',
    duration: 0,
    calories: 0,
    difficulty: 'Beginner',
    category: 'Strength',
    equipment: '',
    instructor: '',
    description: '',
    exercises: '',
    isPremium: false
  });

  const adminHeaders = {
    username: 'admin',
    password: 'admin123'
  };

  // File upload functions
  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await axios.post(`${API_BASE_URL}/api/admin/upload/image`, formData, {
        headers: {
          ...adminHeaders,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setRecipeForm({ ...recipeForm, image: response.data.file.url });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleVideoUpload = async (file: File) => {
    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append('video', file);
      
      const response = await axios.post(`${API_BASE_URL}/api/admin/upload/video`, formData, {
        headers: {
          ...adminHeaders,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setWorkoutForm({ ...workoutForm, videoUrl: response.data.file.url });
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Error uploading video');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleThumbnailUpload = async (file: File) => {
    setUploadingThumbnail(true);
    try {
      const formData = new FormData();
      formData.append('thumbnail', file);
      
      const response = await axios.post(`${API_BASE_URL}/api/admin/upload/thumbnail`, formData, {
        headers: {
          ...adminHeaders,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setWorkoutForm({ ...workoutForm, thumbnail: response.data.file.url });
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      alert('Error uploading thumbnail');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleAudioUpload = async (file: File) => {
    setUploadingAudio(true);
    try {
      // For now, create a local URL - in production, upload to cloud storage (S3, Cloudinary, etc.)
      // For Vercel, you'd need to use a service like Cloudinary or AWS S3
      const audioUrl = URL.createObjectURL(file);
      
      // In production, upload to cloud storage and get the URL
      // const formData = new FormData();
      // formData.append('audio', file);
      // const response = await axios.post(`${API_BASE_URL}/api/admin/upload/audio`, formData, {...});
      // audioUrl = response.data.file.url;
      
      setMeditationForm({ ...meditationForm, audioUrl });
      alert('Audio selected. Note: For production, integrate with cloud storage (AWS S3, Cloudinary, etc.)');
    } catch (error) {
      console.error('Error uploading audio:', error);
      alert('Error uploading audio');
    } finally {
      setUploadingAudio(false);
    }
  };

  // Authentication check
  const handleLogin = () => {
    if (credentials.username === 'admin' && credentials.password === 'admin123') {
      setIsAuthenticated(true);
      fetchData();
    } else {
      alert('Invalid credentials');
    }
  };

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [recipesRes, workoutsRes, meditationsRes] = await Promise.all([
        axios.get(API_ENDPOINTS.ADMIN_RECIPES, { headers: adminHeaders }),
        axios.get(API_ENDPOINTS.ADMIN_WORKOUTS, { headers: adminHeaders }),
        axios.get(`${API_BASE_URL}/api/aimind/meditation/library`)
      ]);
      setRecipes(recipesRes.data.recipes || []);
      setWorkouts(workoutsRes.data.workouts || []);
      setMeditations(meditationsRes.data.meditations || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  // Recipe operations
  const handleSaveRecipe = async () => {
    try {
      const recipeData = {
        ...recipeForm,
        tags: recipeForm.tags.split(',').map(tag => tag.trim()),
        ingredients: recipeForm.ingredients.split('\n').filter(item => item.trim()),
        instructions: recipeForm.instructions.split('\n').filter(item => item.trim())
      };

      if (editingRecipe) {
        await axios.put(`${API_ENDPOINTS.ADMIN_RECIPES}/${editingRecipe.id}`, recipeData, { headers: adminHeaders });
      } else {
        await axios.post(API_ENDPOINTS.ADMIN_RECIPES, recipeData, { headers: adminHeaders });
      }

      fetchData();
      setShowRecipeModal(false);
      setEditingRecipe(null);
      resetRecipeForm();
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('Error saving recipe');
    }
  };

  const handleDeleteRecipe = async (id: number) => {
    if (confirm('Are you sure you want to delete this recipe?')) {
      try {
        await axios.delete(`${API_ENDPOINTS.ADMIN_RECIPES}/${id}`, { headers: adminHeaders });
        fetchData();
      } catch (error) {
        console.error('Error deleting recipe:', error);
        alert('Error deleting recipe');
      }
    }
  };

  const resetRecipeForm = () => {
    setRecipeForm({
      title: '',
      image: '',
      cookTime: 0,
      servings: 0,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      difficulty: 'Easy',
      tags: '',
      ingredients: '',
      instructions: '',
      category: 'Breakfast'
    });
  };

  // Workout operations
  const handleSaveWorkout = async () => {
    try {
      const workoutData = {
        ...workoutForm,
        equipment: workoutForm.equipment.split(',').map(item => item.trim()),
        exercises: workoutForm.exercises.split('\n').filter(item => item.trim()).map(exercise => ({
          name: exercise,
          duration: 60,
          description: exercise
        }))
      };

      if (editingWorkout) {
        await axios.put(`${API_ENDPOINTS.ADMIN_WORKOUTS}/${editingWorkout.id}`, workoutData, { headers: adminHeaders });
      } else {
        await axios.post(API_ENDPOINTS.ADMIN_WORKOUTS, workoutData, { headers: adminHeaders });
      }

      fetchData();
      setShowWorkoutModal(false);
      setEditingWorkout(null);
      resetWorkoutForm();
    } catch (error) {
      console.error('Error saving workout:', error);
      alert('Error saving workout');
    }
  };

  const handleDeleteWorkout = async (id: number) => {
    if (confirm('Are you sure you want to delete this workout?')) {
      try {
        await axios.delete(`${API_ENDPOINTS.ADMIN_WORKOUTS}/${id}`, { headers: adminHeaders });
        fetchData();
      } catch (error) {
        console.error('Error deleting workout:', error);
        alert('Error deleting workout');
      }
    }
  };

  const resetWorkoutForm = () => {
    setWorkoutForm({
      title: '',
      thumbnail: '',
      videoUrl: '',
      duration: 0,
      calories: 0,
      difficulty: 'Beginner',
      category: 'Strength',
      equipment: '',
      instructor: '',
      description: '',
      exercises: '',
      isPremium: false
    });
  };

  const editRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setRecipeForm({
      title: recipe.title,
      image: recipe.image,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      calories: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat,
      difficulty: recipe.difficulty,
      tags: recipe.tags.join(', '),
      ingredients: recipe.ingredients.join('\n'),
      instructions: recipe.instructions.join('\n'),
      category: recipe.category
    });
    setShowRecipeModal(true);
  };

  const editWorkout = (workout: Workout) => {
    setEditingWorkout(workout);
    setWorkoutForm({
      title: workout.title,
      thumbnail: workout.thumbnail,
      videoUrl: workout.videoUrl || '',
      duration: workout.duration,
      calories: workout.calories,
      difficulty: workout.difficulty,
      category: workout.category,
      equipment: workout.equipment.join(', '),
      instructor: workout.instructor,
      description: workout.description,
      exercises: workout.exercises.map(ex => ex.name).join('\n'),
      isPremium: workout.isPremium
    });
    setShowWorkoutModal(true);
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-xl w-full max-w-md"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="text-blue-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Login</h1>
            <p className="text-gray-600">Access the management dashboard</p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Login
            </button>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600 text-center">
              <strong>Demo Credentials:</strong><br />
              Username: admin<br />
              Password: admin123
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600">Manage recipes, workouts & content</p>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="bg-red-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('recipes')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'recipes' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ChefHat size={20} />
              <span>Recipes ({recipes.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('workouts')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'workouts' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Dumbbell size={20} />
              <span>Workouts ({workouts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('meditations')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'meditations' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Brain size={20} />
              <span>Meditations ({meditations.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <BarChart3 size={20} />
              <span>Analytics</span>
            </button>
          </div>
        </motion.div>

        {/* Content */}
        {activeTab === 'recipes' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Recipe Management</h2>
              <button
                onClick={() => {
                  resetRecipeForm();
                  setEditingRecipe(null);
                  setShowRecipeModal(true);
                }}
                className="bg-orange-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-orange-700 transition-colors flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Add Recipe</span>
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading recipes...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map((recipe) => (
                  <div key={recipe.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <img src={recipe.image} alt={recipe.title} className="w-full h-48 object-cover" />
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">{recipe.title}</h3>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                        <span>{recipe.category}</span>
                        <span>{recipe.cookTime} min</span>
                        <span>{recipe.calories} cal</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => editRecipe(recipe)}
                          className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg font-medium hover:bg-blue-200 transition-colors flex items-center justify-center space-x-1"
                        >
                          <Edit3 size={16} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteRecipe(recipe.id)}
                          className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg font-medium hover:bg-red-200 transition-colors flex items-center justify-center space-x-1"
                        >
                          <Trash2 size={16} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'workouts' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Workout Management</h2>
              <button
                onClick={() => {
                  resetWorkoutForm();
                  setEditingWorkout(null);
                  setShowWorkoutModal(true);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Add Workout</span>
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading workouts...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workouts.map((workout) => (
                  <div key={workout.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <img src={workout.thumbnail} alt={workout.title} className="w-full h-48 object-cover" />
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">{workout.title}</h3>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                        <span>{workout.category}</span>
                        <span>{workout.duration} min</span>
                        <span>{workout.calories} cal</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">by {workout.instructor}</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => editWorkout(workout)}
                          className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg font-medium hover:bg-blue-200 transition-colors flex items-center justify-center space-x-1"
                        >
                          <Edit3 size={16} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteWorkout(workout.id)}
                          className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg font-medium hover:bg-red-200 transition-colors flex items-center justify-center space-x-1"
                        >
                          <Trash2 size={16} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'meditations' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Meditation Management</h2>
              <button
                onClick={() => {
                  setMeditationForm({ title: '', category: 'sleep', duration: 10, description: '', audioUrl: '' });
                  setEditingMeditation(null);
                  setShowMeditationModal(true);
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Add Meditation</span>
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading meditations...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meditations.map((meditation) => (
                  <div key={meditation.id} className="bg-white rounded-2xl shadow-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">{meditation.title}</h3>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      <span>{meditation.category}</span>
                      <span>{meditation.duration} min</span>
                    </div>
                    {meditation.description && (
                      <p className="text-sm text-gray-600 mb-3">{meditation.description}</p>
                    )}
                    {meditation.audio_url && (
                      <audio controls className="w-full mb-3" src={meditation.audio_url} />
                    )}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingMeditation(meditation);
                          setMeditationForm({
                            title: meditation.title,
                            category: meditation.category,
                            duration: meditation.duration,
                            description: meditation.description || '',
                            audioUrl: meditation.audio_url || ''
                          });
                          setShowMeditationModal(true);
                        }}
                        className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg font-medium hover:bg-blue-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Delete this meditation?')) {
                            try {
                              // Add delete endpoint if needed
                              fetchData();
                            } catch (error) {
                              alert('Error deleting meditation');
                            }
                          }
                        }}
                        className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg font-medium hover:bg-red-200 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-6">Platform Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-orange-50 rounded-xl p-6 text-center">
                <ChefHat className="text-orange-600 mx-auto mb-2" size={32} />
                <p className="text-2xl font-bold text-gray-800">{recipes.length}</p>
                <p className="text-gray-600">Total Recipes</p>
              </div>
              <div className="bg-green-50 rounded-xl p-6 text-center">
                <Dumbbell className="text-green-600 mx-auto mb-2" size={32} />
                <p className="text-2xl font-bold text-gray-800">{workouts.length}</p>
                <p className="text-gray-600">Total Workouts</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-6 text-center">
                <Users className="text-blue-600 mx-auto mb-2" size={32} />
                <p className="text-2xl font-bold text-gray-800">1,247</p>
                <p className="text-gray-600">Active Users</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Content Distribution</h3>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Recipes by Category</span>
                  </div>
                  <div className="space-y-2">
                    {['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Desserts'].map(category => {
                      const count = recipes.filter(r => r.category === category).length;
                      const percentage = recipes.length > 0 ? (count / recipes.length) * 100 : 0;
                      return (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{category}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-orange-500 h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 w-8">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Workouts by Category</span>
                  </div>
                  <div className="space-y-2">
                    {['Strength', 'Cardio', 'HIIT', 'Yoga', 'Flexibility'].map(category => {
                      const count = workouts.filter(w => w.category === category).length;
                      const percentage = workouts.length > 0 ? (count / workouts.length) * 100 : 0;
                      return (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{category}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 w-8">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Recipe Modal */}
      {showRecipeModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingRecipe ? 'Edit Recipe' : 'Add New Recipe'}
              </h3>
              <button
                onClick={() => setShowRecipeModal(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X size={16} className="text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Recipe Title"
                value={recipeForm.title}
                onChange={(e) => setRecipeForm({ ...recipeForm, title: e.target.value })}
                className="p-3 border border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
              />
              <div className="space-y-2">
              <input
                type="url"
                  placeholder="Image URL (from Pexels) or upload file below"
                value={recipeForm.image}
                onChange={(e) => setRecipeForm({ ...recipeForm, image: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
              />
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                  />
                  {uploadingImage && (
                    <div className="text-sm text-orange-600">Uploading...</div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <input
                type="number"
                placeholder="Cook Time (min)"
                value={recipeForm.cookTime || ''}
                onChange={(e) => setRecipeForm({ ...recipeForm, cookTime: Number(e.target.value) })}
                className="p-3 border border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
              />
              <input
                type="number"
                placeholder="Servings"
                value={recipeForm.servings || ''}
                onChange={(e) => setRecipeForm({ ...recipeForm, servings: Number(e.target.value) })}
                className="p-3 border border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
              />
              <input
                type="number"
                placeholder="Calories"
                value={recipeForm.calories || ''}
                onChange={(e) => setRecipeForm({ ...recipeForm, calories: Number(e.target.value) })}
                className="p-3 border border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
              />
              <select
                value={recipeForm.difficulty}
                onChange={(e) => setRecipeForm({ ...recipeForm, difficulty: e.target.value })}
                className="p-3 border border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <input
                type="number"
                placeholder="Protein (g)"
                value={recipeForm.protein || ''}
                onChange={(e) => setRecipeForm({ ...recipeForm, protein: Number(e.target.value) })}
                className="p-3 border border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
              />
              <input
                type="number"
                placeholder="Carbs (g)"
                value={recipeForm.carbs || ''}
                onChange={(e) => setRecipeForm({ ...recipeForm, carbs: Number(e.target.value) })}
                className="p-3 border border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
              />
              <input
                type="number"
                placeholder="Fat (g)"
                value={recipeForm.fat || ''}
                onChange={(e) => setRecipeForm({ ...recipeForm, fat: Number(e.target.value) })}
                className="p-3 border border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
              />
              <select
                value={recipeForm.category}
                onChange={(e) => setRecipeForm({ ...recipeForm, category: e.target.value })}
                className="p-3 border border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Snacks">Snacks</option>
                <option value="Desserts">Desserts</option>
              </select>
            </div>

            <input
              type="text"
              placeholder="Tags (comma separated)"
              value={recipeForm.tags}
              onChange={(e) => setRecipeForm({ ...recipeForm, tags: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none mb-4"
            />

            <textarea
              placeholder="Ingredients (one per line)"
              value={recipeForm.ingredients}
              onChange={(e) => setRecipeForm({ ...recipeForm, ingredients: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none mb-4 h-24 resize-none"
            />

            <textarea
              placeholder="Instructions (one per line)"
              value={recipeForm.instructions}
              onChange={(e) => setRecipeForm({ ...recipeForm, instructions: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none mb-6 h-32 resize-none"
            />

            <div className="flex space-x-3">
              <button
                onClick={() => setShowRecipeModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRecipe}
                className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Save size={20} />
                <span>{editingRecipe ? 'Update Recipe' : 'Save Recipe'}</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Workout Modal */}
      {showWorkoutModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingWorkout ? 'Edit Workout' : 'Add New Workout'}
              </h3>
              <button
                onClick={() => setShowWorkoutModal(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X size={16} className="text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Workout Title"
                value={workoutForm.title}
                onChange={(e) => setWorkoutForm({ ...workoutForm, title: e.target.value })}
                className="p-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
              />
              <div className="space-y-2">
              <input
                type="url"
                  placeholder="Thumbnail URL or upload file below"
                value={workoutForm.thumbnail}
                onChange={(e) => setWorkoutForm({ ...workoutForm, thumbnail: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
              />
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleThumbnailUpload(file);
                    }}
                    className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                  {uploadingThumbnail && (
                    <div className="text-sm text-green-600">Uploading...</div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
            <input
              type="url"
                placeholder="Video URL (YouTube, Vimeo, etc.) or upload file below"
              value={workoutForm.videoUrl}
              onChange={(e) => setWorkoutForm({ ...workoutForm, videoUrl: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
              />
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleVideoUpload(file);
                  }}
                  className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
                {uploadingVideo && (
                  <div className="text-sm text-green-600">Uploading...</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <input
                type="number"
                placeholder="Duration (min)"
                value={workoutForm.duration || ''}
                onChange={(e) => setWorkoutForm({ ...workoutForm, duration: Number(e.target.value) })}
                className="p-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
              />
              <input
                type="number"
                placeholder="Calories"
                value={workoutForm.calories || ''}
                onChange={(e) => setWorkoutForm({ ...workoutForm, calories: Number(e.target.value) })}
                className="p-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
              />
              <select
                value={workoutForm.difficulty}
                onChange={(e) => setWorkoutForm({ ...workoutForm, difficulty: e.target.value })}
                className="p-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
              <select
                value={workoutForm.category}
                onChange={(e) => setWorkoutForm({ ...workoutForm, category: e.target.value })}
                className="p-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
              >
                <option value="Strength">Strength</option>
                <option value="Cardio">Cardio</option>
                <option value="HIIT">HIIT</option>
                <option value="Yoga">Yoga</option>
                <option value="Pilates">Pilates</option>
                <option value="Flexibility">Flexibility</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Instructor Name"
                value={workoutForm.instructor}
                onChange={(e) => setWorkoutForm({ ...workoutForm, instructor: e.target.value })}
                className="p-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Equipment (comma separated)"
                value={workoutForm.equipment}
                onChange={(e) => setWorkoutForm({ ...workoutForm, equipment: e.target.value })}
                className="p-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
              />
            </div>

            <textarea
              placeholder="Workout Description"
              value={workoutForm.description}
              onChange={(e) => setWorkoutForm({ ...workoutForm, description: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none mb-4 h-20 resize-none"
            />

            <textarea
              placeholder="Exercises (one per line)"
              value={workoutForm.exercises}
              onChange={(e) => setWorkoutForm({ ...workoutForm, exercises: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none mb-4 h-24 resize-none"
            />

            <div className="flex items-center space-x-2 mb-6">
              <input
                type="checkbox"
                id="isPremium"
                checked={workoutForm.isPremium}
                onChange={(e) => setWorkoutForm({ ...workoutForm, isPremium: e.target.checked })}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="isPremium" className="text-sm text-gray-700">Premium Content</label>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowWorkoutModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWorkout}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Save size={20} />
                <span>{editingWorkout ? 'Update Workout' : 'Save Workout'}</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Meditation Modal */}
      {showMeditationModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {editingMeditation ? 'Edit Meditation' : 'Add New Meditation'}
              </h3>
              <button
                onClick={() => setShowMeditationModal(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X size={16} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Meditation Title"
                value={meditationForm.title}
                onChange={(e) => setMeditationForm({ ...meditationForm, title: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
              />

              <select
                value={meditationForm.category}
                onChange={(e) => setMeditationForm({ ...meditationForm, category: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
              >
                <option value="sleep">Better Sleep</option>
                <option value="morning">Morning Boost</option>
                <option value="focus">Focus</option>
                <option value="self-love">Self-Love</option>
                <option value="anxiety">Anxiety Relief</option>
              </select>

              <input
                type="number"
                placeholder="Duration (minutes)"
                value={meditationForm.duration || ''}
                onChange={(e) => setMeditationForm({ ...meditationForm, duration: Number(e.target.value) })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
              />

              <textarea
                placeholder="Description"
                value={meditationForm.description}
                onChange={(e) => setMeditationForm({ ...meditationForm, description: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none h-24 resize-none"
              />

              <div className="space-y-2">
                <input
                  type="url"
                  placeholder="Audio URL (or upload file below)"
                  value={meditationForm.audioUrl}
                  onChange={(e) => setMeditationForm({ ...meditationForm, audioUrl: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAudioUpload(file);
                    }}
                    className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  {uploadingAudio && (
                    <div className="text-sm text-purple-600">Uploading...</div>
                  )}
                </div>
                {meditationForm.audioUrl && (
                  <audio controls className="w-full" src={meditationForm.audioUrl} />
                )}
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowMeditationModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await axios.post(`${API_BASE_URL}/api/admin/meditation`, meditationForm, {
                      headers: adminHeaders
                    });
                    fetchData();
                    setShowMeditationModal(false);
                    setMeditationForm({ title: '', category: 'sleep', duration: 10, description: '', audioUrl: '' });
                  } catch (error) {
                    console.error('Error saving meditation:', error);
                    alert('Error saving meditation');
                  }
                }}
                className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
              >
                {editingMeditation ? 'Update' : 'Save'} Meditation
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Admin;