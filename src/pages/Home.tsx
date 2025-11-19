import React from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  TrendingUp, 
  Zap, 
  Award, 
  Calendar,
  Crown,
  ChevronRight,
  Heart,
  Utensils,
  Dumbbell,
  Moon,
  Smile,
  Share2,
  Settings
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { Link } from 'react-router-dom';

export default function Home() {
  const { profile, dailyData, getTodayTotals } = useUser();

  // Get today's nutrition totals from food entries
  const todayTotals = getTodayTotals();
  const remainingCalories = (profile?.dailyCalories || 2000) - todayTotals.calories + dailyData.caloriesBurned;

  const todayStats = [
    {
      icon: Target,
      label: 'Steps',
      value: dailyData.steps.toLocaleString(),
      target: '10,000',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: Dumbbell,
      label: 'Exercise',
      value: `${dailyData.exerciseMinutes}min`,
      target: '30min',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: Zap,
      label: 'Calories Burned',
      value: dailyData.caloriesBurned.toString(),
      target: '400',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      icon: Moon,
      label: 'Sleep',
      value: `${dailyData.sleepHours}h`,
      target: '8h',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  const quickActions = [
    { icon: Utensils, label: 'Recipes', path: '/recipes', color: 'bg-orange-500' },
    { icon: Dumbbell, label: 'Workouts', path: '/workouts', color: 'bg-green-500' },
    { icon: Heart, label: 'Habits', path: '/wellness', color: 'bg-pink-500' },
    { icon: Moon, label: 'Sleep', path: '/wellness', color: 'bg-purple-500' },
    { icon: Share2, label: 'Friends', path: '/friends', color: 'bg-blue-500' },
    { icon: Settings, label: 'Settings', path: '/settings', color: 'bg-gray-500' },
  ];

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
            <h1 className="text-2xl font-bold text-gray-800">
              Good morning, {profile?.name || 'User'}!
            </h1>
            <p className="text-gray-600">Ready to crush your goals today?</p>
          </div>
          <Link
            to="/premium"
            className="flex items-center space-x-2 px-4 py-2 premium-gradient text-white rounded-full text-sm font-medium"
          >
            <Crown size={16} />
            <span>Premium</span>
          </Link>
        </motion.div>

        {/* Calorie Balance Card - Updated to use food entry totals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Today's Balance</h3>
            <Target className="text-blue-600" size={24} />
          </div>
          
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Goal</p>
              <p className="text-xl font-bold text-gray-800">{profile?.dailyCalories || 2000}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Food</p>
              <p className="text-xl font-bold text-green-600">{Math.round(todayTotals.calories)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Exercise</p>
              <p className="text-xl font-bold text-orange-600">{dailyData.caloriesBurned}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Remaining</p>
              <p className={`text-xl font-bold ${remainingCalories > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {Math.round(remainingCalories)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Macro Summary - Updated to use food entry totals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Macros Today</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-red-100 flex items-center justify-center">
                <div className="text-red-600 font-bold">{Math.round(todayTotals.protein)}g</div>
              </div>
              <p className="text-sm text-gray-600">Protein</p>
              <p className="text-xs text-gray-500">{profile?.dailyProtein || 150}g goal</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="text-blue-600 font-bold">{Math.round(todayTotals.carbs)}g</div>
              </div>
              <p className="text-sm text-gray-600">Carbs</p>
              <p className="text-xs text-gray-500">{profile?.dailyCarbs || 225}g goal</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-yellow-100 flex items-center justify-center">
                <div className="text-yellow-600 font-bold">{Math.round(todayTotals.fat)}g</div>
              </div>
              <p className="text-sm text-gray-600">Fat</p>
              <p className="text-xs text-gray-500">{profile?.dailyFat || 67}g goal</p>
            </div>
          </div>
        </motion.div>

        {/* Today's Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          {todayStats.map((stat, index) => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-lg">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center mb-3`}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-xs text-gray-500">of {stat.target}</p>
            </div>
          ))}
        </motion.div>

        {/* Weekly Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">This Week</h3>
            <TrendingUp className="text-green-600" size={24} />
          </div>
          
          <div className="flex items-end justify-between h-32 mb-2">
            {[1, 3, 2, 4, 3, 5, 4].map((height, index) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  className="w-6 bg-gradient-to-t from-blue-600 to-purple-600 rounded-t"
                  style={{ height: `${height * 20}px` }}
                />
                <span className="text-xs text-gray-500 mt-2">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
                </span>
              </div>
            ))}
          </div>
          
          <p className="text-sm text-gray-600 text-center">Calories burned this week</p>
        </motion.div>

        {/* Discover Section - Fixed to avoid duplicate links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Discover</h3>
          
          <div className="grid grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.path}
                className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-2`}>
                  <action.icon className="text-white" size={20} />
                </div>
                <span className="text-sm text-gray-700 text-center">{action.label}</span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Premium Promo */}
        {!profile?.isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="premium-gradient rounded-2xl p-6 text-white mb-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">Go Premium</h3>
                <p className="text-sm opacity-90">Unlock unlimited workouts, personalized plans, and advanced analytics</p>
              </div>
              <Link
                to="/premium"
                className="bg-white bg-opacity-20 p-3 rounded-full"
              >
                <ChevronRight className="text-white" size={24} />
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}