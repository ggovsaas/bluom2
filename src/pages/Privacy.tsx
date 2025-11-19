import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Lock, 
  Users, 
  Download, 
  Trash2,
  Key,
  Smartphone,
  Globe,
  Database,
  AlertTriangle,
  Check,
  X,
  ChevronRight
} from 'lucide-react';

const Privacy: React.FC = () => {
  const [settings, setSettings] = useState({
    profileVisibility: 'friends',
    activitySharing: true,
    dataCollection: true,
    analyticsSharing: false,
    marketingEmails: false,
    twoFactorAuth: false,
    biometricAuth: false,
    autoLogout: true,
    locationTracking: false
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);

  const updateSetting = (key: string, value: boolean | string) => {
    setSettings({ ...settings, [key]: value });
  };

  const privacyGroups = [
    {
      title: 'Profile Privacy',
      icon: Eye,
      items: [
        {
          type: 'select',
          key: 'profileVisibility',
          label: 'Profile Visibility',
          description: 'Who can see your profile information',
          options: [
            { value: 'public', label: 'Everyone' },
            { value: 'friends', label: 'Friends Only' },
            { value: 'private', label: 'Only Me' }
          ]
        },
        {
          type: 'toggle',
          key: 'activitySharing',
          label: 'Activity Sharing',
          description: 'Share your workouts and achievements with friends',
          icon: Users
        }
      ]
    },
    {
      title: 'Data & Analytics',
      icon: Database,
      items: [
        {
          type: 'toggle',
          key: 'dataCollection',
          label: 'Usage Analytics',
          description: 'Help improve the app by sharing anonymous usage data',
          icon: Database
        },
        {
          type: 'toggle',
          key: 'analyticsSharing',
          label: 'Third-party Analytics',
          description: 'Share data with analytics partners',
          icon: Globe
        },
        {
          type: 'toggle',
          key: 'marketingEmails',
          label: 'Marketing Communications',
          description: 'Receive promotional emails and offers',
          icon: Globe
        },
        {
          type: 'toggle',
          key: 'locationTracking',
          label: 'Location Services',
          description: 'Use location for workout tracking and local features',
          icon: Globe
        }
      ]
    },
    {
      title: 'Security',
      icon: Lock,
      items: [
        {
          type: 'toggle',
          key: 'twoFactorAuth',
          label: 'Two-Factor Authentication',
          description: 'Add an extra layer of security to your account',
          icon: Key
        },
        {
          type: 'toggle',
          key: 'biometricAuth',
          label: 'Biometric Login',
          description: 'Use fingerprint or face recognition to log in',
          icon: Smartphone
        },
        {
          type: 'toggle',
          key: 'autoLogout',
          label: 'Auto Logout',
          description: 'Automatically log out after 30 minutes of inactivity',
          icon: Lock
        }
      ]
    }
  ];

  const dataActions = [
    {
      title: 'Download Your Data',
      description: 'Get a copy of all your personal data',
      icon: Download,
      action: () => setShowDataModal(true),
      color: 'bg-blue-100 text-blue-700'
    },
    {
      title: 'Delete Account',
      description: 'Permanently delete your account and all data',
      icon: Trash2,
      action: () => setShowDeleteModal(true),
      color: 'bg-red-100 text-red-700'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-800">Privacy & Security</h1>
          <p className="text-gray-600">Control your data and privacy settings</p>
        </motion.div>

        {/* Privacy Groups */}
        <div className="space-y-6">
          {privacyGroups.map((group, groupIndex) => (
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
                {group.items.map((item) => (
                  <div key={item.key} className="p-4">
                    {item.type === 'toggle' ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <item.icon className="text-gray-600" size={16} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{item.label}</p>
                            <p className="text-sm text-gray-500">{item.description}</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings[item.key as keyof typeof settings] as boolean}
                            onChange={(e) => updateSetting(item.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium text-gray-800">{item.label}</p>
                            <p className="text-sm text-gray-500">{item.description}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {item.options?.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => updateSetting(item.key, option.value)}
                              className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                                settings[item.key as keyof typeof settings] === option.value
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Data Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg mt-6 overflow-hidden"
        >
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Database className="text-orange-600" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Data Management</h3>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {dataActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center`}>
                    <action.icon size={16} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800">{action.title}</p>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-400" size={20} />
              </button>
            ))}
          </div>
        </motion.div>

        {/* Privacy Policy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-lg mt-6"
        >
          <div className="text-center">
            <Shield className="mx-auto text-blue-600 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Your Privacy Matters</h3>
            <p className="text-gray-600 text-sm mb-4">
              We're committed to protecting your personal information and being transparent about how we use it.
            </p>
            <div className="flex justify-center space-x-4">
              <button className="text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors">
                Privacy Policy
              </button>
              <button className="text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors">
                Terms of Service
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
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
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="text-red-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Account</h3>
              <p className="text-gray-600">
                This action cannot be undone. All your data will be permanently deleted.
              </p>
            </div>

            <div className="bg-red-50 rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-red-800 mb-2">What will be deleted:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Your profile and account information</li>
                <li>• All workout and nutrition data</li>
                <li>• Friends and social connections</li>
                <li>• Achievements and progress history</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700"
              >
                Cancel
              </button>
              <button className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium">
                Delete Account
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Data Download Modal */}
      {showDataModal && (
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
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Download Your Data</h3>
              <p className="text-gray-600">
                We'll prepare a file with all your personal data and send it to your email.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-blue-800 mb-2">Your data package will include:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Profile information and settings</li>
                <li>• Workout history and statistics</li>
                <li>• Nutrition logs and meal data</li>
                <li>• Progress photos and measurements</li>
                <li>• Social connections and messages</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDataModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowDataModal(false)}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium"
              >
                Request Data
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Privacy;