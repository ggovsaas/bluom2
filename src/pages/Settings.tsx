import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Moon, 
  Smartphone,
  Scale,
  Target,
  ChevronRight,
  Check,
  X
} from 'lucide-react';
import { useUser } from '../context/UserContext';

const Settings: React.FC = () => {
  const { profile, updateProfile } = useUser();
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [tempUnits, setTempUnits] = useState({
    weight: profile?.weightUnit || 'lbs',
    height: profile?.heightUnit || 'ft',
    distance: 'miles',
    temperature: 'fahrenheit'
  });
  const [tempGoals, setTempGoals] = useState({
    dailyCalories: profile?.dailyCalories || 2000,
    dailyProtein: profile?.dailyProtein || 150,
    dailyCarbs: profile?.dailyCarbs || 225,
    dailyFat: profile?.dailyFat || 67
  });

  const settingsGroups = [
    {
      title: 'Account',
      icon: User,
      items: [
        { label: 'Profile Information', value: profile?.name || 'Not set', action: () => {} },
        { label: 'Email & Password', value: 'Manage account', action: () => {} },
        { label: 'Subscription', value: profile?.isPremium ? 'Premium' : 'Free', action: () => {} },
      ]
    },
    {
      title: 'Preferences',
      icon: SettingsIcon,
      items: [
        { label: 'Units & Measurements', value: `${tempUnits.weight}, ${tempUnits.height}`, action: () => setShowUnitsModal(true) },
        { label: 'Daily Goals', value: `${tempGoals.dailyCalories} cal`, action: () => setShowGoalsModal(true) },
        { label: 'Language', value: 'English', action: () => {} },
        { label: 'Theme', value: 'Light', action: () => {} },
      ]
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        { label: 'Push Notifications', value: 'Enabled', action: () => {} },
        { label: 'Meal Reminders', value: 'Enabled', action: () => {} },
        { label: 'Workout Reminders', value: 'Enabled', action: () => {} },
        { label: 'Weekly Reports', value: 'Enabled', action: () => {} },
      ]
    },
    {
      title: 'Privacy & Security',
      icon: Shield,
      items: [
        { label: 'Data Privacy', value: 'Manage data', action: () => {} },
        { label: 'Activity Visibility', value: 'Friends only', action: () => {} },
        { label: 'Two-Factor Auth', value: 'Disabled', action: () => {} },
        { label: 'Connected Apps', value: '2 connected', action: () => {} },
      ]
    },
    {
      title: 'Support',
      icon: Globe,
      items: [
        { label: 'Help Center', value: 'Get help', action: () => {} },
        { label: 'Contact Support', value: 'Send message', action: () => {} },
        { label: 'Report a Bug', value: 'Report issue', action: () => {} },
        { label: 'Rate App', value: 'Leave review', action: () => {} },
      ]
    }
  ];

  const saveUnits = () => {
    updateProfile({
      weightUnit: tempUnits.weight,
      heightUnit: tempUnits.height
    });
    setShowUnitsModal(false);
  };

  const saveGoals = () => {
    updateProfile({
      dailyCalories: tempGoals.dailyCalories,
      dailyProtein: tempGoals.dailyProtein,
      dailyCarbs: tempGoals.dailyCarbs,
      dailyFat: tempGoals.dailyFat
    });
    setShowGoalsModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-600">Customize your AiFit experience</p>
        </motion.div>

        {/* Settings Groups */}
        <div className="space-y-6">
          {settingsGroups.map((group, groupIndex) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <group.icon className="text-blue-600" size={20} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">{group.title}</h3>
                </div>
              </div>
              
              <div className="divide-y divide-gray-100">
                {group.items.map((item, itemIndex) => (
                  <button
                    key={itemIndex}
                    onClick={item.action}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-left">
                      <p className="font-medium text-gray-800">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.value}</p>
                    </div>
                    <ChevronRight className="text-gray-400" size={20} />
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-lg mt-6"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">Ai</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">AiFit</h3>
            <p className="text-gray-600 text-sm mb-4">Version 1.0.0</p>
            <div className="flex justify-center space-x-4 text-sm text-gray-500">
              <button className="hover:text-blue-600 transition-colors">Terms of Service</button>
              <button className="hover:text-blue-600 transition-colors">Privacy Policy</button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Units Modal */}
      {showUnitsModal && (
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
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Units & Measurements</h3>
              <button
                onClick={() => setShowUnitsModal(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X size={16} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Weight</label>
                <div className="grid grid-cols-2 gap-3">
                  {['lbs', 'kg'].map((unit) => (
                    <button
                      key={unit}
                      onClick={() => setTempUnits({ ...tempUnits, weight: unit })}
                      className={`p-3 rounded-xl border-2 font-medium transition-all ${
                        tempUnits.weight === unit
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {unit.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Height</label>
                <div className="grid grid-cols-2 gap-3">
                  {['ft', 'cm'].map((unit) => (
                    <button
                      key={unit}
                      onClick={() => setTempUnits({ ...tempUnits, height: unit })}
                      className={`p-3 rounded-xl border-2 font-medium transition-all ${
                        tempUnits.height === unit
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {unit === 'ft' ? 'Feet & Inches' : 'Centimeters'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Distance</label>
                <div className="grid grid-cols-2 gap-3">
                  {['miles', 'km'].map((unit) => (
                    <button
                      key={unit}
                      onClick={() => setTempUnits({ ...tempUnits, distance: unit })}
                      className={`p-3 rounded-xl border-2 font-medium transition-all ${
                        tempUnits.distance === unit
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {unit === 'miles' ? 'Miles' : 'Kilometers'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowUnitsModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={saveUnits}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Goals Modal */}
      {showGoalsModal && (
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
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Daily Goals</h3>
              <button
                onClick={() => setShowGoalsModal(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X size={16} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Daily Calories</label>
                <input
                  type="number"
                  value={tempGoals.dailyCalories}
                  onChange={(e) => setTempGoals({ ...tempGoals, dailyCalories: Number(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Daily Protein (g)</label>
                <input
                  type="number"
                  value={tempGoals.dailyProtein}
                  onChange={(e) => setTempGoals({ ...tempGoals, dailyProtein: Number(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Daily Carbs (g)</label>
                <input
                  type="number"
                  value={tempGoals.dailyCarbs}
                  onChange={(e) => setTempGoals({ ...tempGoals, dailyCarbs: Number(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Daily Fat (g)</label>
                <input
                  type="number"
                  value={tempGoals.dailyFat}
                  onChange={(e) => setTempGoals({ ...tempGoals, dailyFat: Number(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowGoalsModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={saveGoals}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium"
              >
                Save Goals
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Settings;