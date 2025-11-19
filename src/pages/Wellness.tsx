import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Moon, 
  Smile, 
  Heart, 
  Brain, 
  Plus,
  Calendar,
  TrendingUp,
  Clock,
  Sun,
  Target,
  Droplets,
  Pill,
  Book,
  Leaf,
  Zap,
  Coffee,
  Apple,
  Dumbbell,
  Phone,
  Users,
  Music,
  Camera,
  CheckCircle,
  Circle,
  Edit3,
  Trash2,
  X,
  Sparkles,
  PenTool,
  Gamepad2,
  BarChart3
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import MeditationHub from '../components/MeditationHub';
import GamesHub from '../components/GamesHub';

interface Habit {
  id: string;
  name: string;
  icon: string;
  category: string;
  streak: number;
  completedToday: boolean;
  completedDates: string[];
  target?: number;
  unit?: string;
  isCustom: boolean;
}

const Wellness: React.FC = () => {
  const { profile, dailyData, updateDailyData, getCurrentDate } = useUser();
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [sleepInput, setSleepInput] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState({
    name: '',
    icon: 'Target',
    category: 'Health'
  });

  // AIMind state
  const [showMeditationHub, setShowMeditationHub] = useState(false);
  const [showGratitudeModal, setShowGratitudeModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [showGamesHub, setShowGamesHub] = useState(false);
  const [gratitudeEntry, setGratitudeEntry] = useState('');
  const [gratitudeEntries, setGratitudeEntries] = useState<any[]>([]);
  const [journalContent, setJournalContent] = useState('');
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Get userId from localStorage or default to 1
  const getUserId = () => {
    try {
      const userStr = localStorage.getItem('aifit_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id || 1;
      }
    } catch (e) {
      console.error('Error getting user ID:', e);
    }
    return 1;
  };

  const currentDate = getCurrentDate();

  const moods = [
    { emoji: '😄', label: 'Excellent', value: 'excellent', color: 'bg-green-500' },
    { emoji: '😊', label: 'Good', value: 'good', color: 'bg-blue-500' },
    { emoji: '😐', label: 'Okay', value: 'okay', color: 'bg-yellow-500' },
    { emoji: '😔', label: 'Low', value: 'low', color: 'bg-orange-500' },
    { emoji: '😢', label: 'Poor', value: 'poor', color: 'bg-red-500' },
  ];

  const habitCategories = ['Health', 'Fitness', 'Mindfulness', 'Productivity', 'Social', 'Learning'];

  const iconOptions = [
    { name: 'Target', icon: Target },
    { name: 'Droplets', icon: Droplets },
    { name: 'Pill', icon: Pill },
    { name: 'Book', icon: Book },
    { name: 'Leaf', icon: Leaf },
    { name: 'Zap', icon: Zap },
    { name: 'Coffee', icon: Coffee },
    { name: 'Apple', icon: Apple },
    { name: 'Dumbbell', icon: Dumbbell },
    { name: 'Phone', icon: Phone },
    { name: 'Users', icon: Users },
    { name: 'Music', icon: Music },
    { name: 'Camera', icon: Camera },
    { name: 'Heart', icon: Heart },
    { name: 'Brain', icon: Brain },
    { name: 'Sun', icon: Sun },
    { name: 'Moon', icon: Moon }
  ];

  const defaultHabits: Habit[] = [
    {
      id: 'water',
      name: 'Drink 8 glasses of water',
      icon: 'Droplets',
      category: 'Health',
      streak: 7,
      completedToday: dailyData.water >= 64,
      completedDates: [],
      target: 8,
      unit: 'glasses',
      isCustom: false
    },
    {
      id: 'vitamins',
      name: 'Take daily vitamins',
      icon: 'Pill',
      category: 'Health',
      streak: 12,
      completedToday: false,
      completedDates: [],
      isCustom: false
    },
    {
      id: 'meditation',
      name: 'Meditate for 10 minutes',
      icon: 'Brain',
      category: 'Mindfulness',
      streak: 3,
      completedToday: false,
      completedDates: [],
      target: 10,
      unit: 'minutes',
      isCustom: false
    },
    {
      id: 'gratitude',
      name: 'Practice gratitude',
      icon: 'Heart',
      category: 'Mindfulness',
      streak: 5,
      completedToday: false,
      completedDates: [],
      isCustom: false
    },
    {
      id: 'nature',
      name: 'Spend time in nature',
      icon: 'Leaf',
      category: 'Health',
      streak: 2,
      completedToday: false,
      completedDates: [],
      target: 30,
      unit: 'minutes',
      isCustom: false
    },
    {
      id: 'reading',
      name: 'Read for 30 minutes',
      icon: 'Book',
      category: 'Learning',
      streak: 0,
      completedToday: false,
      completedDates: [],
      target: 30,
      unit: 'minutes',
      isCustom: false
    },
    {
      id: 'exercise',
      name: 'Exercise for 30 minutes',
      icon: 'Dumbbell',
      category: 'Fitness',
      streak: 0,
      completedToday: false,
      completedDates: [],
      target: 30,
      unit: 'minutes',
      isCustom: false
    },
    {
      id: 'sleep',
      name: 'Get 8 hours of sleep',
      icon: 'Moon',
      category: 'Health',
      streak: 0,
      completedToday: dailyData.sleepHours >= 8,
      completedDates: [],
      target: 8,
      unit: 'hours',
      isCustom: false
    },
    {
      id: 'social',
      name: 'Connect with friends/family',
      icon: 'Users',
      category: 'Social',
      streak: 0,
      completedToday: false,
      completedDates: [],
      isCustom: false
    },
    {
      id: 'screen-time',
      name: 'Limit screen time',
      icon: 'Phone',
      category: 'Health',
      streak: 0,
      completedToday: false,
      completedDates: [],
      target: 2,
      unit: 'hours max',
      isCustom: false
    }
  ];

  const sleepQuality = [
    { night: 'Mon', quality: 85, hours: 7.5 },
    { night: 'Tue', quality: 92, hours: 8.2 },
    { night: 'Wed', quality: 78, hours: 6.8 },
    { night: 'Thu', quality: 88, hours: 7.8 },
    { night: 'Fri', quality: 90, hours: 8.0 },
    { night: 'Sat', quality: 95, hours: 8.5 },
    { night: 'Sun', quality: 87, hours: 7.9 },
  ];

  // Load habits from localStorage
  useEffect(() => {
    const savedHabits = localStorage.getItem('aifit_habits');
    if (savedHabits) {
      setHabits(JSON.parse(savedHabits));
    } else {
      setHabits(defaultHabits);
    }
  }, []);

  // Load AIMind data
  useEffect(() => {
    const userId = getUserId();
    fetchGratitudeEntries(userId);
    fetchJournalEntries(userId);
    fetchInsights(userId);
  }, []);

  // Fetch gratitude entries
  const fetchGratitudeEntries = async (userId: number) => {
    try {
      const { data, error } = await supabase
        .from('gratitude_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setGratitudeEntries(data || []);
    } catch (error) {
      console.error('Error fetching gratitude entries:', error);
    }
  };

  // Fetch journal entries
  const fetchJournalEntries = async (userId: number) => {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      setJournalEntries(data || []);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
    }
  };

  // Fetch insights
  const fetchInsights = async (userId: number) => {
    setLoadingInsights(true);
    try {
      const { data, error } = await supabase
        .from('wellness_insights')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      setInsights(data);
    } catch (error) {
      console.error('Error fetching insights:', error);
      setInsights(null);
    } finally {
      setLoadingInsights(false);
    }
  };

  // Save gratitude entry
  const saveGratitude = async () => {
    if (!gratitudeEntry.trim()) return;
    
    const userId = getUserId();
    try {
      const { error } = await supabase
        .from('gratitude_entries')
        .insert({
          user_id: userId,
          entry: gratitudeEntry,
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      setGratitudeEntry('');
      setShowGratitudeModal(false);
      fetchGratitudeEntries(userId);
    } catch (error) {
      console.error('Error saving gratitude:', error);
      alert('Failed to save gratitude entry');
    }
  };

  // Save journal entry
  const saveJournal = async () => {
    if (!journalContent.trim()) return;
    
    const userId = getUserId();
    try {
      const { error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: userId,
          content: journalContent,
          mood_tag: dailyData.mood || null,
          created_at: new Date().toISOString()
        });
      setJournalContent('');
      setShowJournalModal(false);
      fetchJournalEntries(userId);
      fetchInsights(userId); // Refresh insights
    } catch (error) {
      console.error('Error saving journal:', error);
      alert('Failed to save journal entry');
    }
  };

  // Open meditation hub
  const startMeditation = () => {
    setShowMeditationHub(true);
  };

  // Open games hub
  const startGame = () => {
    setShowGamesHub(true);
  };

  // Handle game completion
  const handleGameComplete = async (result: any) => {
    const userId = getUserId();
    try {
      // Save game results (you can add API endpoint later)
      console.log('Game result:', result);
      // Could save to backend here
    } catch (error) {
      console.error('Error saving game result:', error);
    }
  };

  // Save habits to localStorage
  const saveHabits = (updatedHabits: Habit[]) => {
    setHabits(updatedHabits);
    localStorage.setItem('aifit_habits', JSON.stringify(updatedHabits));
  };

  const addSleep = () => {
    if (sleepInput) {
      updateDailyData({ sleepHours: parseFloat(sleepInput) });
      
      // Update sleep habit if it exists
      const updatedHabits = habits.map(habit => {
        if (habit.id === 'sleep') {
          return {
            ...habit,
            completedToday: parseFloat(sleepInput) >= (habit.target || 8)
          };
        }
        return habit;
      });
      saveHabits(updatedHabits);
      
      setSleepInput('');
      setShowSleepModal(false);
    }
  };

  const addMood = (mood: string) => {
    updateDailyData({ mood });
    setShowMoodModal(false);
  };

  const toggleHabit = (habitId: string) => {
    const updatedHabits = habits.map(habit => {
      if (habit.id === habitId) {
        const wasCompleted = habit.completedToday;
        const newCompletedToday = !wasCompleted;
        
        let newStreak = habit.streak;
        let newCompletedDates = [...habit.completedDates];
        
        if (newCompletedToday) {
          // Mark as completed
          if (!newCompletedDates.includes(currentDate)) {
            newCompletedDates.push(currentDate);
            newStreak = habit.streak + 1;
          }
        } else {
          // Mark as not completed
          newCompletedDates = newCompletedDates.filter(date => date !== currentDate);
          newStreak = Math.max(0, habit.streak - 1);
        }
        
        return {
          ...habit,
          completedToday: newCompletedToday,
          streak: newStreak,
          completedDates: newCompletedDates
        };
      }
      return habit;
    });
    
    saveHabits(updatedHabits);
  };

  const addCustomHabit = () => {
    if (!newHabit.name.trim()) return;
    
    const customHabit: Habit = {
      id: `custom-${Date.now()}`,
      name: newHabit.name,
      icon: newHabit.icon,
      category: newHabit.category,
      streak: 0,
      completedToday: false,
      completedDates: [],
      isCustom: true
    };
    
    saveHabits([...habits, customHabit]);
    setNewHabit({ name: '', icon: 'Target', category: 'Health' });
    setShowHabitModal(false);
  };

  const deleteHabit = (habitId: string) => {
    const updatedHabits = habits.filter(habit => habit.id !== habitId);
    saveHabits(updatedHabits);
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find(option => option.name === iconName);
    return iconOption ? iconOption.icon : Target;
  };

  const getHabitsByCategory = (category: string) => {
    return habits.filter(habit => habit.category === category);
  };

  const completedHabitsToday = habits.filter(habit => habit.completedToday).length;
  const totalHabits = habits.length;
  const completionPercentage = totalHabits > 0 ? Math.round((completedHabitsToday / totalHabits) * 100) : 0;

  const averageSleep = sleepQuality.reduce((sum, night) => sum + night.hours, 0) / sleepQuality.length;

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
            <h1 className="text-2xl font-bold text-gray-800">Wellness</h1>
            <p className="text-gray-600">Track your sleep, mood & daily habits</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowSleepModal(true)}
              className="bg-purple-600 text-white p-3 rounded-full shadow-lg"
            >
              <Moon size={20} />
            </button>
            <button
              onClick={() => setShowMoodModal(true)}
              className="bg-yellow-500 text-white p-3 rounded-full shadow-lg"
            >
              <Smile size={20} />
            </button>
          </div>
        </motion.div>

        {/* Today's Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-6"
        >
          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
              <Moon className="text-purple-600" size={24} />
            </div>
            <p className="text-sm text-gray-600 mb-1">Sleep</p>
            <p className="text-2xl font-bold text-gray-800">{dailyData.sleepHours || 0}h</p>
            <p className="text-xs text-gray-500">Last night</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-3">
              <Smile className="text-yellow-600" size={24} />
            </div>
            <p className="text-sm text-gray-600 mb-1">Mood</p>
            <p className="text-lg font-bold text-gray-800">
              {dailyData.mood ? moods.find(m => m.value === dailyData.mood)?.emoji : '😐'}
            </p>
            <p className="text-xs text-gray-500">Today</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3">
              <Target className="text-green-600" size={24} />
            </div>
            <p className="text-sm text-gray-600 mb-1">Habits</p>
            <p className="text-2xl font-bold text-gray-800">{completedHabitsToday}/{totalHabits}</p>
            <p className="text-xs text-gray-500">{completionPercentage}% complete</p>
          </div>
        </motion.div>

        {/* Enhanced Daily Habits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Daily Habits</h3>
              <p className="text-sm text-gray-600">{completedHabitsToday} of {totalHabits} completed today</p>
            </div>
            <button
              onClick={() => setShowHabitModal(true)}
              className="bg-green-600 text-white p-2 rounded-full shadow-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Today's Progress</span>
              <span>{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full"
              />
            </div>
          </div>

          {/* Habits by Category */}
          <div className="space-y-6">
            {habitCategories.map(category => {
              const categoryHabits = getHabitsByCategory(category);
              if (categoryHabits.length === 0) return null;

              return (
                <div key={category}>
                  <h4 className="font-medium text-gray-800 mb-3 text-sm uppercase tracking-wide">
                    {category}
                  </h4>
                  <div className="space-y-3">
                    {categoryHabits.map((habit) => {
                      const IconComponent = getIconComponent(habit.icon);
                      return (
                        <div key={habit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => toggleHabit(habit.id)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                habit.completedToday 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                              }`}
                            >
                              {habit.completedToday ? <CheckCircle size={16} /> : <Circle size={16} />}
                            </button>
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <IconComponent className="text-blue-600" size={16} />
                            </div>
                            <div>
                              <p className="text-gray-800 font-medium text-sm">{habit.name}</p>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span>{habit.streak} day streak</span>
                                {habit.target && (
                                  <span>• {habit.target} {habit.unit}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              {[...Array(Math.min(habit.streak, 7))].map((_, i) => (
                                <div key={i} className="w-2 h-2 bg-green-500 rounded-full" />
                              ))}
                            </div>
                            {habit.isCustom && (
                              <button
                                onClick={() => deleteHabit(habit.id)}
                                className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
                              >
                                <Trash2 size={12} className="text-red-600" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Sleep Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Sleep Analysis</h3>
            <Moon className="text-purple-600" size={24} />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{averageSleep.toFixed(1)}h</p>
              <p className="text-sm text-gray-600">Avg Sleep</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">87%</p>
              <p className="text-sm text-gray-600">Quality</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">6/7</p>
              <p className="text-sm text-gray-600">Good Nights</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-2">This Week</p>
            {sleepQuality.map((night, index) => (
              <div key={night.night} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700 w-8">{night.night}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${night.quality}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm text-gray-600">{night.hours}h</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Mood Tracking */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Mood Tracker</h3>
            <Heart className="text-red-500" size={24} />
          </div>

          <div className="grid grid-cols-5 gap-2 mb-6">
            {moods.map((mood) => (
              <button
                key={mood.value}
                onClick={() => addMood(mood.value)}
                className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                  dailyData.mood === mood.value ? 'bg-gray-100 scale-110' : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-2xl mb-1">{mood.emoji}</span>
                <span className="text-xs text-gray-600">{mood.label}</span>
              </button>
            ))}
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-2">Weekly Mood Trend</p>
            <div className="flex items-end justify-between h-16">
              {['😊', '😄', '😐', '😊', '😔', '😄', '😊'].map((emoji, index) => (
                <div key={index} className="flex flex-col items-center">
                  <span className="text-lg mb-1">{emoji}</span>
                  <span className="text-xs text-gray-500">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* AIMind Hub */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">🧠 AIMind Hub</h3>
              <p className="text-sm text-gray-600">Meditation, gratitude, journaling & insights</p>
            </div>
            <Brain className="text-indigo-600" size={24} />
          </div>

          {/* AIMind Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                startMeditation();
              }}
              className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-4 rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
            >
              <Brain className="mx-auto mb-2" size={24} />
              <p className="text-xs font-medium">Meditate</p>
            </button>
            
            <button
              onClick={() => setShowGratitudeModal(true)}
              className="bg-gradient-to-br from-pink-400 to-rose-500 text-white p-4 rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
            >
              <Heart className="mx-auto mb-2" size={24} />
              <p className="text-xs font-medium">Gratitude</p>
            </button>
            
            <button
              onClick={() => setShowJournalModal(true)}
              className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white p-4 rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
            >
              <PenTool className="mx-auto mb-2" size={24} />
              <p className="text-xs font-medium">Journal</p>
            </button>
            
            <button
              onClick={() => setShowInsightsModal(true)}
              className="bg-gradient-to-br from-teal-400 to-green-500 text-white p-4 rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
            >
              <BarChart3 className="mx-auto mb-2" size={24} />
              <p className="text-xs font-medium">Insights</p>
            </button>
            
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                startGame();
              }}
              className="bg-gradient-to-br from-purple-400 to-indigo-500 text-white p-4 rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
            >
              <Gamepad2 className="mx-auto mb-2" size={24} />
              <p className="text-xs font-medium">Games</p>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-indigo-50 rounded-xl p-3">
              <p className="text-lg font-bold text-indigo-600">{gratitudeEntries.length}</p>
              <p className="text-xs text-gray-600">Gratitude Entries</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-3">
              <p className="text-lg font-bold text-yellow-600">{journalEntries.length}</p>
              <p className="text-xs text-gray-600">Journal Entries</p>
            </div>
            <div className="bg-teal-50 rounded-xl p-3">
              <p className="text-lg font-bold text-teal-600">
                {insights ? `${insights.calmnessScore}%` : '--'}
              </p>
              <p className="text-xs text-gray-600">Calmness Score</p>
            </div>
          </div>
        </motion.div>

        {/* Mindfulness */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold mb-2">aiMind Session</h3>
              <p className="text-sm opacity-90">Guided meditation for better sleep</p>
            </div>
            <Brain className="text-white" size={24} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-75">Tonight's Session</p>
              <p className="font-semibold">Deep Sleep Journey</p>
            </div>
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                startMeditation();
              }}
              className="bg-white bg-opacity-20 px-6 py-2 rounded-full font-medium hover:bg-opacity-30 transition-all"
            >
              Start 10 min
            </button>
          </div>
        </motion.div>

        {/* Premium Insights */}
        {!profile?.isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl p-6 shadow-lg border-2 border-yellow-200"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="text-yellow-600" size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Unlock Wellness Insights</h3>
              <p className="text-gray-600 text-sm mb-4">
                Get personalized sleep recommendations, mood analysis, and wellness coaching
              </p>
              <button className="bg-yellow-500 text-white px-6 py-3 rounded-xl font-medium">
                Upgrade to Premium
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Add Custom Habit Modal */}
      {showHabitModal && (
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Add Custom Habit</h3>
              <button
                onClick={() => setShowHabitModal(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X size={16} className="text-gray-600" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Habit Name</label>
                <input
                  type="text"
                  placeholder="e.g., Drink green tea"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={newHabit.category}
                  onChange={(e) => setNewHabit({ ...newHabit, category: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
                >
                  {habitCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                <div className="grid grid-cols-6 gap-2">
                  {iconOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <button
                        key={option.name}
                        onClick={() => setNewHabit({ ...newHabit, icon: option.name })}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          newHabit.icon === option.name
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <IconComponent size={20} className={newHabit.icon === option.name ? 'text-green-600' : 'text-gray-600'} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowHabitModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={addCustomHabit}
                disabled={!newHabit.name.trim()}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium disabled:bg-gray-300"
              >
                Add Habit
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Sleep Modal */}
      {showSleepModal && (
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
            <h3 className="text-xl font-bold text-gray-800 mb-4">Log Sleep</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How many hours did you sleep?
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="e.g., 7.5"
                value={sleepInput}
                onChange={(e) => setSleepInput(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowSleepModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={addSleep}
                className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium"
              >
                Log Sleep
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Mood Modal */}
      {showMoodModal && (
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
            <h3 className="text-xl font-bold text-gray-800 mb-4">How are you feeling today?</h3>
            
            <div className="grid grid-cols-5 gap-3 mb-6">
              {moods.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => addMood(mood.value)}
                  className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-all"
                >
                  <span className="text-3xl mb-2">{mood.emoji}</span>
                  <span className="text-xs text-gray-600 text-center">{mood.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowMoodModal(false)}
              className="w-full py-3 border border-gray-300 rounded-xl font-medium text-gray-700"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Meditation Hub */}
      {showMeditationHub && (
        <MeditationHub
          userId={getUserId()}
          onClose={() => setShowMeditationHub(false)}
        />
      )}

      {/* Gratitude Modal */}
      {showGratitudeModal && (
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">💗 Gratitude</h3>
              <button
                onClick={() => setShowGratitudeModal(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X size={16} className="text-gray-600" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What are you grateful for today?
              </label>
              <textarea
                placeholder="I'm grateful for..."
                value={gratitudeEntry}
                onChange={(e) => setGratitudeEntry(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:border-pink-500 focus:outline-none h-24 resize-none"
              />
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Entries</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {gratitudeEntries.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No entries yet</p>
                ) : (
                  gratitudeEntries.map((entry) => (
                    <div key={entry.id} className="bg-pink-50 rounded-lg p-3">
                      <p className="text-sm text-gray-800">{entry.entry}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowGratitudeModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={saveGratitude}
                disabled={!gratitudeEntry.trim()}
                className="flex-1 py-3 bg-pink-500 text-white rounded-xl font-medium disabled:bg-gray-300"
              >
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Journal Modal */}
      {showJournalModal && (
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">✍️ Journal</h3>
              <button
                onClick={() => setShowJournalModal(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X size={16} className="text-gray-600" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How are you feeling today?
              </label>
              <textarea
                placeholder="Write your thoughts..."
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:border-yellow-500 focus:outline-none h-32 resize-none"
              />
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Entries</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {journalEntries.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No entries yet</p>
                ) : (
                  journalEntries.map((entry) => (
                    <div key={entry.id} className="bg-yellow-50 rounded-lg p-3">
                      <p className="text-sm text-gray-800">{entry.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowJournalModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={saveJournal}
                disabled={!journalContent.trim()}
                className="flex-1 py-3 bg-yellow-500 text-white rounded-xl font-medium disabled:bg-gray-300"
              >
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Insights Modal */}
      {showInsightsModal && (
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
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">📊 Wellness Insights</h3>
              <button
                onClick={() => setShowInsightsModal(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X size={16} className="text-gray-600" />
              </button>
            </div>

            {loadingInsights ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading insights...</p>
              </div>
            ) : insights ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl p-6 text-center">
                  <p className="text-4xl font-bold mb-2">{insights.calmnessScore}%</p>
                  <p className="text-sm opacity-90">Calmness Score</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{insights.avgSleep}h</p>
                    <p className="text-xs text-gray-600">Avg Sleep</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">{insights.moodStability}%</p>
                    <p className="text-xs text-gray-600">Mood Stability</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Activity Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Meditations</span>
                      <span className="font-medium">{insights.meditationCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Gratitude Entries</span>
                      <span className="font-medium">{insights.gratitudeCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Journal Entries</span>
                      <span className="font-medium">{insights.journalCount}</span>
                    </div>
                  </div>
                </div>

                {insights.recommendations && insights.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Recommendations</h4>
                    <div className="space-y-3">
                      {insights.recommendations.map((rec: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-xl p-4">
                          <p className="text-sm text-gray-800 mb-1">{rec.message}</p>
                          <p className="text-xs text-gray-600">{rec.action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No insights available yet</p>
                <p className="text-sm text-gray-500 mt-2">Start tracking your wellness to see insights</p>
              </div>
            )}

            <button
              onClick={() => {
                setShowInsightsModal(false);
                fetchInsights(getUserId());
              }}
              className="w-full mt-6 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
            >
              Refresh Insights
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Games Hub */}
      {showGamesHub && (
        <GamesHub
          userId={getUserId()}
          onClose={() => setShowGamesHub(false)}
          onGameComplete={handleGameComplete}
        />
      )}
    </div>
  );
};

export default Wellness;