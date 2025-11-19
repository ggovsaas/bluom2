import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Play, 
  Clock, 
  Zap, 
  Target,
  Star,
  Bookmark,
  Filter,
  Plus,
  X,
  ArrowLeft,
  Dumbbell,
  Heart,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Workout {
  id: number;
  title: string;
  thumbnail: string;
  videoUrl?: string;
  duration: number;
  calories: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  equipment: string[];
  rating: number;
  reviews: number;
  instructor: string;
  description: string;
  exercises: Exercise[];
  saved: boolean;
  isPremium: boolean;
}

interface Exercise {
  name: string;
  duration: number;
  reps?: number;
  sets?: number;
  description: string;
}

const Workouts: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [savedWorkouts, setSavedWorkouts] = useState<number[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const categories = ['All', 'Strength', 'Cardio', 'HIIT', 'Yoga', 'Pilates', 'Flexibility', 'Core'];

  // Fetch workouts from Supabase
  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        setLoading(true);
        let query = supabase.from('workouts').select('*');
        
        if (selectedCategory !== 'All') {
          query = query.eq('category', selectedCategory);
        }
        
        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        setWorkouts(data || []);
      } catch (error) {
        console.error('Error fetching workouts:', error);
        setWorkouts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, [selectedCategory, searchQuery]);

  const toggleSaveWorkout = (workoutId: number) => {
    setSavedWorkouts(prev => 
      prev.includes(workoutId) 
        ? prev.filter(id => id !== workoutId)
        : [...prev, workoutId]
    );
  };

  const handlePlayVideo = () => {
    if (selectedWorkout?.videoUrl) {
      setShowVideoModal(true);
    } else {
      alert('Video tutorial coming soon! This is a demo feature.');
    }
  };

  if (selectedWorkout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Workout Detail View */}
        <div className="px-6 pt-12 pb-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <button
              onClick={() => setSelectedWorkout(null)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft size={20} />
              <span>Back to Workouts</span>
            </button>
            <button
              onClick={() => toggleSaveWorkout(selectedWorkout.id)}
              className={`p-3 rounded-full shadow-lg transition-colors ${
                savedWorkouts.includes(selectedWorkout.id)
                  ? 'bg-red-500 text-white'
                  : 'bg-white text-gray-600 hover:text-red-500'
              }`}
            >
              <Bookmark size={20} fill={savedWorkouts.includes(selectedWorkout.id) ? 'currentColor' : 'none'} />
            </button>
          </motion.div>

          {/* Workout Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-lg mb-6"
          >
            <div className="relative mb-4">
              <img
                src={selectedWorkout.thumbnail}
                alt={selectedWorkout.title}
                className="w-full h-48 object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 rounded-xl flex items-center justify-center">
                <button 
                  onClick={handlePlayVideo}
                  className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
                >
                  <Play className="text-green-600 ml-1" size={24} />
                </button>
              </div>
              {selectedWorkout.isPremium && (
                <div className="absolute top-3 left-3 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  Premium
                </div>
              )}
              {!selectedWorkout.videoUrl && (
                <div className="absolute top-3 right-3 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                  <AlertCircle size={12} />
                  <span>Demo</span>
                </div>
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-2">{selectedWorkout.title}</h1>
            <p className="text-gray-600 mb-4">{selectedWorkout.description}</p>
            
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-1">
                <Star className="text-yellow-500 fill-current" size={16} />
                <span className="text-sm font-medium">{selectedWorkout.rating}</span>
                <span className="text-sm text-gray-500">({selectedWorkout.reviews} reviews)</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="text-gray-500" size={16} />
                <span className="text-sm text-gray-600">{selectedWorkout.duration} min</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap className="text-gray-500" size={16} />
                <span className="text-sm text-gray-600">{selectedWorkout.calories} cal</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Instructor: <span className="font-medium">{selectedWorkout.instructor}</span></p>
                <p className="text-sm text-gray-600">Equipment: <span className="font-medium">{selectedWorkout.equipment.join(', ')}</span></p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedWorkout.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                selectedWorkout.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {selectedWorkout.difficulty}
              </span>
            </div>
          </motion.div>

          {/* Exercise List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-lg mb-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Workout Breakdown</h3>
            <div className="space-y-4">
              {selectedWorkout.exercises.map((exercise, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{exercise.name}</h4>
                    <p className="text-sm text-gray-600">{exercise.description}</p>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    {exercise.reps && exercise.sets ? (
                      <p>{exercise.sets} sets × {exercise.reps} reps</p>
                    ) : (
                      <p>{Math.floor(exercise.duration / 60)}:{(exercise.duration % 60).toString().padStart(2, '0')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Start Workout Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link
              to="/move"
              className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center space-x-2 hover:bg-green-700 transition-colors"
            >
              <Play size={24} />
              <span>Start Workout</span>
            </Link>
          </motion.div>
        </div>

        {/* Video Modal */}
        {showVideoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">{selectedWorkout.title}</h3>
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <X size={16} className="text-gray-600" />
                </button>
              </div>
              
              <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center mb-4">
                <div className="text-center text-white">
                  <Play size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Video Player</p>
                  <p className="text-sm opacity-75">Video tutorials coming soon!</p>
                  <p className="text-xs opacity-50 mt-2">This is a demo interface</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button className="bg-green-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-green-700 transition-colors">
                    Play
                  </button>
                  <span className="text-sm text-gray-600">{selectedWorkout.duration} minutes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                    <Heart size={16} className="text-gray-600" />
                  </button>
                  <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                    <Bookmark size={16} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
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
            <h1 className="text-2xl font-bold text-gray-800">Workouts</h1>
            <p className="text-gray-600">Video tutorials & guided routines</p>
          </div>
          <Link
            to="/move"
            className="bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={24} />
          </Link>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search workouts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
            />
          </div>

          <div className="flex space-x-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading amazing workouts...</p>
          </div>
        )}

        {/* Workout Grid */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {workouts.map((workout) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer"
                onClick={() => setSelectedWorkout(workout)}
              >
                <div className="relative">
                  <img
                    src={workout.thumbnail}
                    alt={workout.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                      <Play className="text-green-600 ml-1" size={20} />
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSaveWorkout(workout.id);
                    }}
                    className={`absolute top-3 right-3 w-10 h-10 rounded-full shadow-lg transition-colors ${
                      savedWorkouts.includes(workout.id)
                        ? 'bg-red-500 text-white'
                        : 'bg-white text-gray-600 hover:text-red-500'
                    }`}
                  >
                    <Bookmark size={16} fill={savedWorkouts.includes(workout.id) ? 'currentColor' : 'none'} className="mx-auto" />
                  </button>
                  {workout.isPremium && (
                    <div className="absolute top-3 left-3 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Premium
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      workout.difficulty === 'Beginner' ? 'bg-green-500 text-white' :
                      workout.difficulty === 'Intermediate' ? 'bg-yellow-500 text-white' :
                      'bg-red-500 text-white'
                    }`}>
                      {workout.difficulty}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{workout.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{workout.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock size={14} />
                        <span>{workout.duration}m</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Zap size={14} />
                        <span>{workout.calories} cal</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="text-yellow-500 fill-current" size={14} />
                      <span className="text-sm font-medium">{workout.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">by {workout.instructor}</p>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      {workout.category}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {!loading && workouts.length === 0 && (
          <div className="text-center py-12">
            <Dumbbell className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No workouts found matching your criteria</p>
            <p className="text-sm text-gray-500 mt-2">Try adjusting your search or category filter</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Workouts;