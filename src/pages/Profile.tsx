import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut,
  Edit3,
  Crown,
  Target,
  Calendar,
  Award,
  ChevronRight,
  Scale,
  Ruler
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { openCustomerPortal } from '../utils/stripe';
import { checkPremiumStatus } from '../utils/premium';

const Profile: React.FC = () => {
  const { profile, updateProfile } = useUser();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: profile?.name || '',
    age: profile?.age || 0,
    weight: profile?.weight || 0,
    height: profile?.height || 0,
    weightUnit: profile?.weightUnit || 'lbs',
    heightUnit: profile?.heightUnit || 'ft'
  });

  const profileStats = [
    { 
      label: 'Days Active', 
      value: '47', 
      icon: Calendar,
      color: 'bg-blue-100 text-blue-600' 
    },
    { 
      label: 'Goal Progress', 
      value: '68%', 
      icon: Target,
      color: 'bg-green-100 text-green-600' 
    },
    { 
      label: 'Achievements', 
      value: '12', 
      icon: Award,
      color: 'bg-yellow-100 text-yellow-600' 
    },
  ];

  const menuItems = [
    { 
      icon: Settings, 
      label: 'Settings', 
      subtitle: 'App preferences and units',
      action: () => console.log('Settings') 
    },
    { 
      icon: Bell, 
      label: 'Notifications', 
      subtitle: 'Manage reminders and alerts',
      action: () => console.log('Notifications') 
    },
    { 
      icon: Shield, 
      label: 'Privacy & Security', 
      subtitle: 'Data and account security',
      action: () => console.log('Privacy') 
    },
    { 
      icon: HelpCircle, 
      label: 'Help & Support', 
      subtitle: 'FAQ and customer support',
      action: () => console.log('Help') 
    },
  ];

  const handleEditSave = () => {
    // Convert units if needed
    let weightInKg = editForm.weight;
    let heightInCm = editForm.height;

    if (editForm.weightUnit === 'lbs') {
      weightInKg = editForm.weight * 0.453592;
    }

    if (editForm.heightUnit === 'ft') {
      heightInCm = (Math.floor(editForm.height) * 30.48) + ((editForm.height % 1) * 12 * 2.54);
    }

    updateProfile({
      ...editForm,
      weightInKg,
      heightInCm
    });
    setShowEditModal(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem('aifit_onboarding_completed');
    window.location.reload();
  };

  const formatHeight = (height: number, unit: string) => {
    if (unit === 'ft') {
      const feet = Math.floor(height);
      const inches = Math.round((height % 1) * 12);
      return `${feet}'${inches}"`;
    }
    return `${height} cm`;
  };

  const formatWeight = (weight: number, unit: string) => {
    return `${weight} ${unit}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="relative mb-4">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto text-white text-2xl font-bold">
              {profile?.name?.charAt(0) || 'U'}
            </div>
            {profile?.isPremium && (
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <Crown className="text-white" size={16} />
              </div>
            )}
            <button
              onClick={() => setShowEditModal(true)}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center"
            >
              <Edit3 className="text-gray-600" size={16} />
            </button>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            {profile?.name || 'User'}
          </h1>
          <p className="text-gray-600 mb-2">
            {profile?.age} years old • {profile?.gender}
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 mb-2">
            <span className="flex items-center space-x-1">
              <Scale size={14} />
              <span>{profile?.weight ? formatWeight(profile.weight, profile.weightUnit || 'lbs') : 'Not set'}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Ruler size={14} />
              <span>{profile?.height ? formatHeight(profile.height, profile.heightUnit || 'ft') : 'Not set'}</span>
            </span>
          </div>
          {profile?.isPremium && (
            <div className="inline-flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              <Crown size={14} />
              <span>Premium Member</span>
            </div>
          )}
        </motion.div>

        {/* Enhanced Stats with BMR/TDEE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          {profileStats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-lg text-center">
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <stat.icon size={24} />
              </div>
              <p className="text-xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Enhanced Goals Summary with Metabolic Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Profile</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-gray-800">Primary Goal</p>
                <p className="text-sm text-gray-600">{profile?.fitnessGoal || 'Not set'}</p>
              </div>
              <div>
                <p className="font-medium text-gray-800">Experience</p>
                <p className="text-sm text-gray-600">{profile?.experience || 'Not set'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-gray-800">Daily Calories</p>
                <p className="text-sm text-gray-600">{profile?.dailyCalories || 2000} cal</p>
              </div>
              <div>
                <p className="font-medium text-gray-800">Activity Level</p>
                <p className="text-sm text-gray-600">{profile?.activityLevel?.split('(')[0] || 'Not set'}</p>
              </div>
            </div>

            {profile?.bmr && profile?.tdee && (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                <div>
                  <p className="font-medium text-gray-800">BMR</p>
                  <p className="text-sm text-gray-600">{profile.bmr} cal/day</p>
                </div>
                <div>
                  <p className="font-medium text-gray-800">TDEE</p>
                  <p className="text-sm text-gray-600">{profile.tdee} cal/day</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <div>
                <p className="font-medium text-gray-800">Nutrition Style</p>
                <p className="text-sm text-gray-600">{profile?.nutritionPreference || 'Not set'}</p>
              </div>
              <button className="text-blue-600 text-sm font-medium">Edit</button>
            </div>
          </div>
        </motion.div>

        {/* Premium Upgrade */}
        {!profile?.isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="premium-gradient rounded-2xl p-6 text-white mb-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">Upgrade to Premium</h3>
                <p className="text-sm opacity-90">
                  Unlock unlimited features and personalized coaching
                </p>
              </div>
              <Crown className="text-white" size={32} />
            </div>
            <button className="w-full bg-white bg-opacity-20 py-3 rounded-xl font-medium mt-4">
              View Plans
            </button>
          </motion.div>
        )}

        {/* Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3 mb-6"
        >
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="w-full bg-white rounded-2xl p-4 shadow-lg flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <item.icon className="text-gray-600" size={24} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">{item.label}</p>
                  <p className="text-sm text-gray-600">{item.subtitle}</p>
                </div>
              </div>
              <ChevronRight className="text-gray-400" size={20} />
            </button>
          ))}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <button
            onClick={resetOnboarding}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-medium"
          >
            Restart Onboarding
          </button>
          
          <button className="w-full bg-white text-red-600 py-4 rounded-2xl font-medium shadow-lg flex items-center justify-center space-x-2">
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </motion.div>
      </div>

      {/* Enhanced Edit Profile Modal */}
      {showEditModal && (
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
            <h3 className="text-xl font-bold text-gray-800 mb-6">Edit Profile</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                <input
                  type="number"
                  value={editForm.age}
                  onChange={(e) => setEditForm({ ...editForm, age: Number(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weight</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.weight}
                    onChange={(e) => setEditForm({ ...editForm, weight: Number(e.target.value) })}
                    className="flex-1 p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                  <select
                    value={editForm.weightUnit}
                    onChange={(e) => setEditForm({ ...editForm, weightUnit: e.target.value })}
                    className="p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value="lbs">lbs</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.height}
                    onChange={(e) => setEditForm({ ...editForm, height: Number(e.target.value) })}
                    placeholder={editForm.heightUnit === 'ft' ? "5.8" : "175"}
                    className="flex-1 p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                  <select
                    value={editForm.heightUnit}
                    onChange={(e) => setEditForm({ ...editForm, heightUnit: e.target.value })}
                    className="p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ft">ft</option>
                    <option value="cm">cm</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {editForm.heightUnit === 'ft' ? 'Enter as decimal (e.g., 5.8 for 5\'8")' : 'Enter in centimeters'}
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Profile;