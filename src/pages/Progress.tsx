import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  Scale,
  Plus,
  Award,
  Zap,
  Crown
} from 'lucide-react';
import { useUser } from '../context/UserContext';

const Progress: React.FC = () => {
  const { profile, dailyData, updateDailyData } = useUser();
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const weightHistory = [
    { date: '2024-01-01', weight: 175, change: 0 },
    { date: '2024-01-08', weight: 174.2, change: -0.8 },
    { date: '2024-01-15', weight: 173.5, change: -0.7 },
    { date: '2024-01-22', weight: 172.8, change: -0.7 },
    { date: '2024-01-29', weight: 172.1, change: -0.7 },
    { date: '2024-02-05', weight: 171.5, change: -0.6 },
    { date: '2024-02-12', weight: 170.9, change: -0.6 },
  ];

  const achievements = [
    { 
      id: 1, 
      title: 'First Week', 
      description: 'Completed your first week of tracking', 
      earned: true, 
      date: '2024-01-08',
      icon: Target,
      color: 'bg-blue-500'
    },
    { 
      id: 2, 
      title: 'Consistency King', 
      description: 'Logged meals for 7 days straight', 
      earned: true, 
      date: '2024-01-15',
      icon: Calendar,
      color: 'bg-green-500'
    },
    { 
      id: 3, 
      title: 'Weight Loss Warrior', 
      description: 'Lost your first 5 pounds', 
      earned: true, 
      date: '2024-02-12',
      icon: Scale,
      color: 'bg-purple-500'
    },
    { 
      id: 4, 
      title: 'Workout Champion', 
      description: 'Complete 20 workouts', 
      earned: false, 
      progress: 15,
      total: 20,
      icon: Zap,
      color: 'bg-orange-500'
    },
  ];

  const progressStats = [
    {
      label: 'Weight Lost',
      value: '4.1 lbs',
      change: '-0.6 this week',
      positive: true,
      icon: Scale,
    },
    {
      label: 'Avg Calories',
      value: '1,847',
      change: '-153 from goal',
      positive: true,
      icon: Target,
    },
    {
      label: 'Workouts',
      value: '15',
      change: '+3 this week',
      positive: true,
      icon: Zap,
    },
    {
      label: 'Streak',
      value: '21 days',
      change: 'Personal best!',
      positive: true,
      icon: Award,
    },
  ];

  const addWeight = () => {
    if (weightInput) {
      updateDailyData({ weight: parseFloat(weightInput) });
      setWeightInput('');
      setShowWeightModal(false);
    }
  };

  const currentWeight = dailyData.weight || weightHistory[weightHistory.length - 1]?.weight || profile?.weight || 0;
  const startWeight = weightHistory[0]?.weight || profile?.weight || 0;
  const weightLoss = startWeight - currentWeight;

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
            <h1 className="text-2xl font-bold text-gray-800">Progress</h1>
            <p className="text-gray-600">Track your fitness journey</p>
          </div>
          <button
            onClick={() => setShowWeightModal(true)}
            className="bg-blue-600 text-white p-3 rounded-full shadow-lg"
          >
            <Plus size={24} />
          </button>
        </motion.div>

        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Weight Progress</h3>
            <div className="flex items-center justify-center space-x-8">
              <div>
                <p className="text-sm text-gray-600">Start</p>
                <p className="text-xl font-bold text-gray-800">{startWeight} lbs</p>
              </div>
              <div className="text-center">
                <TrendingUp className="text-green-600 mx-auto mb-2" size={32} />
                <p className="text-2xl font-bold text-green-600">-{weightLoss.toFixed(1)} lbs</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current</p>
                <p className="text-xl font-bold text-gray-800">{currentWeight} lbs</p>
              </div>
            </div>
          </div>

          {/* Weight Chart */}
          <div className="mb-4">
            <div className="flex items-end justify-between h-32">
              {weightHistory.map((entry, index) => (
                <div key={entry.date} className="flex flex-col items-center">
                  <div
                    className="w-3 bg-blue-600 rounded-t"
                    style={{ 
                      height: `${Math.max(((startWeight - entry.weight) / weightLoss * 100), 10)}px` 
                    }}
                  />
                  <span className="text-xs text-gray-500 mt-2 transform -rotate-45">
                    {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-blue-600">{profile?.dailyCalories || 2000}</p>
              <p className="text-sm text-gray-600">Daily Goal</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-600">{Math.round(weightLoss / 7 * 10) / 10}</p>
              <p className="text-sm text-gray-600">lbs/week</p>
            </div>
            <div>
              <p className="text-lg font-bold text-purple-600">{Math.round((startWeight - (profile?.weight || startWeight)) / startWeight * 100 * 10) / 10}%</p>
              <p className="text-sm text-gray-600">Goal Progress</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          {progressStats.map((stat, index) => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                <stat.icon className="text-blue-600" size={24} />
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-gray-800">{stat.value}</p>
              <p className={`text-xs ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Time Period Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Progress Timeline</h3>
          
          <div className="flex space-x-2 mb-6">
            {['week', 'month', '3month', 'year'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {period === '3month' ? '3M' : period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800">Average Daily Calories</p>
                <p className="text-sm text-gray-600">This {selectedPeriod}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-800">1,847</p>
                <p className="text-sm text-green-600">-8% from last {selectedPeriod}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800">Workout Frequency</p>
                <p className="text-sm text-gray-600">This {selectedPeriod}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-800">4.2/week</p>
                <p className="text-sm text-green-600">+12% from last {selectedPeriod}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-800">Sleep Quality</p>
                <p className="text-sm text-gray-600">This {selectedPeriod}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-800">87%</p>
                <p className="text-sm text-green-600">+5% from last {selectedPeriod}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Achievements</h3>
            <Award className="text-yellow-500" size={24} />
          </div>

          <div className="space-y-4">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id} 
                className={`flex items-center space-x-4 p-4 rounded-xl ${
                  achievement.earned ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                }`}
              >
                <div className={`w-12 h-12 ${achievement.color} rounded-xl flex items-center justify-center`}>
                  <achievement.icon className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold ${achievement.earned ? 'text-gray-800' : 'text-gray-500'}`}>
                    {achievement.title}
                  </h4>
                  <p className={`text-sm ${achievement.earned ? 'text-gray-600' : 'text-gray-400'}`}>
                    {achievement.description}
                  </p>
                  {!achievement.earned && achievement.progress && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{achievement.progress}/{achievement.total}</span>
                        <span>{Math.round((achievement.progress / achievement.total) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                {achievement.earned && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{achievement.date}</p>
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center mt-1">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Premium Analytics Teaser */}
        {!profile?.isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="premium-gradient rounded-2xl p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2 flex items-center">
                  <Crown className="mr-2" size={20} />
                  Advanced Analytics
                </h3>
                <p className="text-sm opacity-90 mb-4">
                  Get detailed body composition analysis, predictive insights, and personalized recommendations
                </p>
                <ul className="text-sm opacity-90 space-y-1">
                  <li>• Body fat percentage tracking</li>
                  <li>• Muscle mass progression</li>
                  <li>• Goal prediction timeline</li>
                  <li>• Custom progress reports</li>
                </ul>
              </div>
            </div>
            <button className="w-full bg-white bg-opacity-20 py-3 rounded-xl font-medium mt-4">
              Upgrade to Premium
            </button>
          </motion.div>
        )}
      </div>

      {/* Weight Modal */}
      {showWeightModal && (
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
            <h3 className="text-xl font-bold text-gray-800 mb-4">Log Weight</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current weight (lbs)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g., 175.5"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowWeightModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={addWeight}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium"
              >
                Log Weight
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Progress;