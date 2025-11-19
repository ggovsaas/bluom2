import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Dumbbell, 
  Target, 
  Timer, 
  Zap,
  Play,
  Star,
  TrendingUp,
  Search,
  ChevronDown,
  Weight,
  RotateCcw,
  Activity,
  Calendar,
  Award
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';

interface Exercise {
  id: number;
  name: string;
  category: string;
  type: 'weight' | 'bodyweight' | 'cardio';
  caloriesPerMinute: number;
  muscleGroups: string[];
}

interface ExerciseEntry {
  id: string;
  exerciseId: number;
  name: string;
  duration: number;
  calories: number;
  sets?: number;
  reps?: number;
  weight?: number;
  type: string;
  date: string;
  timestamp: Date;
}

interface StepsEntry {
  id: string;
  steps: number;
  calories: number;
  date: string;
  timestamp: Date;
}

const Move: React.FC = () => {
  const { profile, dailyData, updateDailyData, addExerciseEntry, getExerciseEntriesForDate, getCurrentDate } = useUser();
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showStepsModal, setShowStepsModal] = useState(false);
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const [showCustomExercise, setShowCustomExercise] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  
  const [workoutForm, setWorkoutForm] = useState({
    duration: '',
    sets: '',
    reps: '',
    weight: '',
    calories: ''
  });
  
  const [customExerciseForm, setCustomExerciseForm] = useState({
    name: '',
    description: '',
    duration: '',
    calories: ''
  });
  
  const [stepsInput, setStepsInput] = useState('');
  const [stepsEntries, setStepsEntries] = useState<StepsEntry[]>([]);

  const currentDate = getCurrentDate();
  const todayExercises = getExerciseEntriesForDate(currentDate);
  const todayStepsEntries = stepsEntries.filter(entry => entry.date === currentDate);
  
  // Calculate today's totals from exercise entries
  const todayTotals = todayExercises.reduce((total, exercise) => ({
    workouts: total.workouts + 1,
    minutes: total.minutes + exercise.duration,
    calories: total.calories + exercise.calories
  }), { workouts: 0, minutes: 0, calories: 0 });

  const workoutCategories = ['All', 'Strength', 'Cardio', 'HIIT', 'Flexibility'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const searchExercises = async (query: string, category?: string) => {
    if (!query.trim() && !category) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      let queryBuilder = supabase.from('exercise_library').select('*');
      
      if (query) {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
      }
      
      if (category && category !== 'All') {
        queryBuilder = queryBuilder.eq('category', category);
      }
      
      const { data, error } = await queryBuilder.limit(50);
      
      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Exercise search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchExercises(searchQuery, selectedCategory);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedCategory]);

  // Load steps entries from localStorage
  useEffect(() => {
    const savedStepsEntries = localStorage.getItem('aifit_steps_entries');
    if (savedStepsEntries) {
      setStepsEntries(JSON.parse(savedStepsEntries));
    }
  }, []);

  const calculateCalories = (exercise: Exercise, duration: number, sets?: number, reps?: number, weight?: number) => {
    let baseCalories = exercise.caloriesPerMinute * duration;
    
    // Adjust for weight training
    if (exercise.type === 'weight' && sets && reps && weight) {
      const intensityMultiplier = Math.min(weight / 50, 2); // Cap at 2x multiplier
      baseCalories *= intensityMultiplier;
    }
    
    return Math.round(baseCalories);
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setWorkoutForm({
      duration: '30',
      sets: exercise.type === 'weight' ? '3' : '',
      reps: exercise.type === 'weight' ? '10' : '',
      weight: exercise.type === 'weight' ? '50' : '',
      calories: ''
    });
  };

  const logExercise = () => {
    if (!selectedExercise || !workoutForm.duration) return;

    const duration = parseInt(workoutForm.duration);
    const sets = workoutForm.sets ? parseInt(workoutForm.sets) : undefined;
    const reps = workoutForm.reps ? parseInt(workoutForm.reps) : undefined;
    const weight = workoutForm.weight ? parseInt(workoutForm.weight) : undefined;
    
    const calculatedCalories = workoutForm.calories 
      ? parseInt(workoutForm.calories)
      : calculateCalories(selectedExercise, duration, sets, reps, weight);

    const entry: ExerciseEntry = {
      id: `${Date.now()}-${Math.random()}`,
      exerciseId: selectedExercise.id,
      name: selectedExercise.name,
      duration,
      calories: calculatedCalories,
      sets,
      reps,
      weight,
      type: selectedExercise.type,
      date: currentDate,
      timestamp: new Date()
    };

    addExerciseEntry(entry);
    
    // Update daily data
    updateDailyData({
      exerciseMinutes: dailyData.exerciseMinutes + duration,
      caloriesBurned: dailyData.caloriesBurned + calculatedCalories
    });

    // Reset form
    setSelectedExercise(null);
    setWorkoutForm({ duration: '', sets: '', reps: '', weight: '', calories: '' });
    setShowExerciseSearch(false);
    setShowWorkoutModal(false);
  };

  const logCustomExercise = () => {
    if (!customExerciseForm.name || !customExerciseForm.duration || !customExerciseForm.calories) return;

    const entry: ExerciseEntry = {
      id: `${Date.now()}-${Math.random()}`,
      exerciseId: 0,
      name: customExerciseForm.name,
      duration: parseInt(customExerciseForm.duration),
      calories: parseInt(customExerciseForm.calories),
      type: 'custom',
      date: currentDate,
      timestamp: new Date()
    };

    addExerciseEntry(entry);
    
    // Update daily data
    updateDailyData({
      exerciseMinutes: dailyData.exerciseMinutes + parseInt(customExerciseForm.duration),
      caloriesBurned: dailyData.caloriesBurned + parseInt(customExerciseForm.calories)
    });

    // Reset form
    setCustomExerciseForm({ name: '', description: '', duration: '', calories: '' });
    setShowCustomExercise(false);
    setShowWorkoutModal(false);
  };

  const addSteps = () => {
    if (stepsInput) {
      const steps = parseInt(stepsInput);
      const estimatedCalories = Math.round(steps * 0.04); // 0.04 calories per step
      
      // Create steps entry
      const stepsEntry: StepsEntry = {
        id: `steps-${Date.now()}-${Math.random()}`,
        steps,
        calories: estimatedCalories,
        date: currentDate,
        timestamp: new Date()
      };

      // Add to steps entries
      const updatedStepsEntries = [...stepsEntries, stepsEntry];
      setStepsEntries(updatedStepsEntries);
      localStorage.setItem('aifit_steps_entries', JSON.stringify(updatedStepsEntries));
      
      // Update daily data
      updateDailyData({
        steps: dailyData.steps + steps,
        caloriesBurned: dailyData.caloriesBurned + estimatedCalories
      });
      
      setStepsInput('');
      setShowStepsModal(false);
    }
  };

  const weeklyStats = {
    workouts: 16,
    totalTime: 12 * 60, // 12 hours in minutes
    totalCalories: 2400,
    avgPerDay: Math.round(2400 / 7)
  };

  // Combine exercise and steps entries for today's activities
  const todayActivities = [
    ...todayExercises.map(exercise => ({
      ...exercise,
      activityType: 'exercise' as const
    })),
    ...todayStepsEntries.map(stepsEntry => ({
      id: stepsEntry.id,
      name: `${stepsEntry.steps.toLocaleString()} Steps`,
      duration: 0,
      calories: stepsEntry.calories,
      timestamp: stepsEntry.timestamp,
      activityType: 'steps' as const
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

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
            <h1 className="text-2xl font-bold text-gray-800">Move</h1>
            <p className="text-gray-600">Track your workouts & activity</p>
          </div>
          
          {/* Enhanced Add Button with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Plus size={24} />
              <ChevronDown size={16} />
            </button>
            
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 w-48 z-10"
              >
                <button
                  onClick={() => {
                    setShowWorkoutModal(true);
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                >
                  <Dumbbell size={20} className="text-green-600" />
                  <span>Log Workout</span>
                </button>
                <button
                  onClick={() => {
                    setShowStepsModal(true);
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                >
                  <Target size={20} className="text-blue-600" />
                  <span>Add Steps</span>
                </button>
                <button
                  onClick={() => {
                    setShowCustomExercise(true);
                    setShowWorkoutModal(true);
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                >
                  <Plus size={20} className="text-purple-600" />
                  <span>Custom Exercise</span>
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Enhanced Activity Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3">
              <Dumbbell className="text-green-600" size={24} />
            </div>
            <p className="text-sm text-gray-600 mb-1">Workouts</p>
            <p className="text-2xl font-bold text-gray-800">{todayTotals.workouts}</p>
            <p className="text-xs text-gray-500">Today</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
              <Timer className="text-blue-600" size={24} />
            </div>
            <p className="text-sm text-gray-600 mb-1">Minutes</p>
            <p className="text-2xl font-bold text-gray-800">{todayTotals.minutes}</p>
            <p className="text-xs text-gray-500">Exercise time</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-3">
              <Zap className="text-orange-600" size={24} />
            </div>
            <p className="text-sm text-gray-600 mb-1">Calories</p>
            <p className="text-2xl font-bold text-gray-800">{todayTotals.calories}</p>
            <p className="text-xs text-gray-500">Burned today</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
              <Target className="text-purple-600" size={24} />
            </div>
            <p className="text-sm text-gray-600 mb-1">Steps</p>
            <p className="text-2xl font-bold text-gray-800">{dailyData.steps.toLocaleString()}</p>
            <button
              onClick={() => setShowStepsModal(true)}
              className="text-xs text-blue-600 font-medium hover:text-blue-700"
            >
              Add steps
            </button>
          </div>
        </motion.div>

        {/* Weekly Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Weekly Progress</h3>
            <TrendingUp className="text-green-600" size={24} />
          </div>

          <div className="flex items-end justify-between h-32 mb-4">
            {[2, 1, 3, 2, 4, 1, todayTotals.workouts || 1].map((workouts, index) => (
              <div key={index} className="flex flex-col items-center">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${workouts * 25}px` }}
                  transition={{ delay: index * 0.1 }}
                  className="w-6 bg-gradient-to-t from-green-600 to-green-400 rounded-t"
                />
                <span className="text-xs text-gray-500 mt-2">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-gray-800">{weeklyStats.workouts}</p>
              <p className="text-sm text-gray-600">Workouts</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800">{Math.round(weeklyStats.totalTime / 60)}h</p>
              <p className="text-sm text-gray-600">Total time</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800">{weeklyStats.totalCalories}</p>
              <p className="text-sm text-gray-600">Calories</p>
            </div>
          </div>
        </motion.div>

        {/* Today's Activities - Fixed to show both exercises and steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Today's Activities</h3>
            <Activity className="text-blue-600" size={24} />
          </div>
          
          {todayActivities.length > 0 ? (
            <div className="space-y-3">
              {todayActivities.map((activity) => (
                <motion.div 
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      {activity.activityType === 'steps' ? (
                        <Target className="text-blue-600" size={16} />
                      ) : (
                        <Dumbbell className="text-green-600" size={16} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{activity.name}</h4>
                      <p className="text-sm text-gray-600">
                        {activity.activityType === 'exercise' && activity.duration > 0 && `${activity.duration} min • `}
                        {activity.calories} cal
                        {activity.activityType === 'exercise' && 'sets' in activity && activity.sets && activity.reps && (
                          <span> • {activity.sets}x{activity.reps}</span>
                        )}
                        {activity.activityType === 'exercise' && 'weight' in activity && activity.weight && (
                          <span> • {activity.weight}lbs</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="text-gray-400" size={32} />
              </div>
              <p className="text-gray-600 mb-2">No activities logged today</p>
              <p className="text-sm text-gray-500">Start your fitness journey!</p>
            </div>
          )}
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Recent Achievements</h3>
            <Award className="text-yellow-500" size={24} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                <Star className="text-white" size={16} />
              </div>
              <div>
                <p className="font-medium text-gray-800">First Workout</p>
                <p className="text-sm text-gray-600">Completed your first exercise session!</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Target className="text-white" size={16} />
              </div>
              <div>
                <p className="font-medium text-gray-800">Step Goal</p>
                <p className="text-sm text-gray-600">Reached 10,000 steps in a day!</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

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
            className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            {showCustomExercise ? (
              <>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Create Custom Exercise</h3>
                
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Exercise name"
                    value={customExerciseForm.name}
                    onChange={(e) => setCustomExerciseForm({ ...customExerciseForm, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
                  />
                  
                  <textarea
                    placeholder="Description (optional)"
                    value={customExerciseForm.description}
                    onChange={(e) => setCustomExerciseForm({ ...customExerciseForm, description: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none h-20 resize-none"
                  />
                  
                  <input
                    type="number"
                    placeholder="Duration (minutes)"
                    value={customExerciseForm.duration}
                    onChange={(e) => setCustomExerciseForm({ ...customExerciseForm, duration: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
                  />
                  
                  <input
                    type="number"
                    placeholder="Calories burned"
                    value={customExerciseForm.calories}
                    onChange={(e) => setCustomExerciseForm({ ...customExerciseForm, calories: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
                  />
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCustomExercise(false);
                      setShowWorkoutModal(false);
                    }}
                    className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={logCustomExercise}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium"
                  >
                    Log Exercise
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Log Workout</h3>
                
                <button
                  onClick={() => setShowExerciseSearch(true)}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 transition-colors mb-4 flex items-center justify-center space-x-2"
                >
                  <Search size={20} className="text-gray-600" />
                  <span className="text-gray-600">Search Exercise Database</span>
                </button>

                {selectedExercise && (
                  <div className="mb-4 p-4 bg-green-50 rounded-xl">
                    <h4 className="font-semibold text-gray-800 mb-2">{selectedExercise.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{selectedExercise.category} • {selectedExercise.type}</p>
                    
                    <div className="space-y-3">
                      <input
                        type="number"
                        placeholder="Duration (minutes)"
                        value={workoutForm.duration}
                        onChange={(e) => setWorkoutForm({ ...workoutForm, duration: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
                      />
                      
                      {selectedExercise.type === 'weight' && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="number"
                              placeholder="Sets"
                              value={workoutForm.sets}
                              onChange={(e) => setWorkoutForm({ ...workoutForm, sets: e.target.value })}
                              className="p-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
                            />
                            <input
                              type="number"
                              placeholder="Reps"
                              value={workoutForm.reps}
                              onChange={(e) => setWorkoutForm({ ...workoutForm, reps: e.target.value })}
                              className="p-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
                            />
                          </div>
                          <input
                            type="number"
                            placeholder="Weight (lbs)"
                            value={workoutForm.weight}
                            onChange={(e) => setWorkoutForm({ ...workoutForm, weight: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
                          />
                        </>
                      )}
                      
                      <input
                        type="number"
                        placeholder="Calories burned (optional)"
                        value={workoutForm.calories}
                        onChange={(e) => setWorkoutForm({ ...workoutForm, calories: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
                      />
                      
                      {workoutForm.duration && (
                        <p className="text-sm text-gray-600">
                          Estimated calories: {calculateCalories(
                            selectedExercise, 
                            parseInt(workoutForm.duration) || 0,
                            workoutForm.sets ? parseInt(workoutForm.sets) : undefined,
                            workoutForm.reps ? parseInt(workoutForm.reps) : undefined,
                            workoutForm.weight ? parseInt(workoutForm.weight) : undefined
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowWorkoutModal(false)}
                    className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={logExercise}
                    disabled={!selectedExercise || !workoutForm.duration}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium disabled:bg-gray-300"
                  >
                    Log Workout
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Exercise Search Modal */}
      {showExerciseSearch && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="bg-white w-full h-3/4 rounded-t-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Search Exercises</h3>
              <button
                onClick={() => setShowExerciseSearch(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <span className="text-gray-600">✕</span>
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
              />
            </div>

            <div className="flex space-x-2 mb-6 overflow-x-auto">
              {workoutCategories.map((category) => (
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

            <div className="space-y-3 overflow-y-auto custom-scrollbar">
              {loading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Searching exercises...</p>
                </div>
              )}

              {searchResults.map((exercise) => (
                <motion.div
                  key={exercise.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    handleExerciseSelect(exercise);
                    setShowExerciseSearch(false);
                  }}
                >
                  <div>
                    <h4 className="font-medium text-gray-800">{exercise.name}</h4>
                    <p className="text-sm text-gray-600">
                      {exercise.category} • {exercise.type} • {exercise.caloriesPerMinute} cal/min
                    </p>
                    <p className="text-xs text-gray-500">
                      {exercise.muscleGroups.join(', ')}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Plus className="text-green-600" size={16} />
                  </div>
                </motion.div>
              ))}

              {!loading && searchQuery && searchResults.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No exercises found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Steps Modal */}
      {showStepsModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add Steps</h3>
            
            <input
              type="number"
              placeholder="Number of steps"
              value={stepsInput}
              onChange={(e) => setStepsInput(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none mb-4"
            />

            {stepsInput && (
              <p className="text-sm text-gray-600 mb-6">
                Estimated calories: {Math.round(parseInt(stepsInput) * 0.04)}
              </p>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setShowStepsModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={addSteps}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium"
              >
                Add Steps
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Move;