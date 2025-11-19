import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Clock, 
  Utensils, 
  Dumbbell, 
  Moon, 
  TrendingUp,
  Smartphone,
  Mail,
  MessageSquare,
  Volume2,
  VolumeX,
  Check,
  X
} from 'lucide-react';

const Notifications: React.FC = () => {
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    mealReminders: true,
    workoutReminders: true,
    sleepReminders: true,
    weeklyReports: true,
    friendActivity: true,
    achievements: true,
    challenges: true,
    sound: true,
    vibration: true,
    quietHours: true,
    quietStart: '22:00',
    quietEnd: '07:00'
  });

  const [showTimeModal, setShowTimeModal] = useState<'start' | 'end' | null>(null);

  const updateSetting = (key: string, value: boolean | string) => {
    setSettings({ ...settings, [key]: value });
  };

  const notificationGroups = [
    {
      title: 'General',
      icon: Bell,
      items: [
        { 
          key: 'pushNotifications', 
          label: 'Push Notifications', 
          description: 'Receive notifications on your device',
          icon: Smartphone
        },
        { 
          key: 'emailNotifications', 
          label: 'Email Notifications', 
          description: 'Receive updates via email',
          icon: Mail
        },
        { 
          key: 'sound', 
          label: 'Sound', 
          description: 'Play sound with notifications',
          icon: Volume2
        },
        { 
          key: 'vibration', 
          label: 'Vibration', 
          description: 'Vibrate device for notifications',
          icon: MessageSquare
        }
      ]
    },
    {
      title: 'Reminders',
      icon: Clock,
      items: [
        { 
          key: 'mealReminders', 
          label: 'Meal Reminders', 
          description: 'Remind me to log my meals',
          icon: Utensils
        },
        { 
          key: 'workoutReminders', 
          label: 'Workout Reminders', 
          description: 'Remind me to exercise',
          icon: Dumbbell
        },
        { 
          key: 'sleepReminders', 
          label: 'Sleep Reminders', 
          description: 'Remind me to get enough sleep',
          icon: Moon
        }
      ]
    },
    {
      title: 'Social & Progress',
      icon: TrendingUp,
      items: [
        { 
          key: 'friendActivity', 
          label: 'Friend Activity', 
          description: 'Updates from friends and challenges',
          icon: MessageSquare
        },
        { 
          key: 'achievements', 
          label: 'Achievements', 
          description: 'Celebrate your milestones',
          icon: TrendingUp
        },
        { 
          key: 'challenges', 
          label: 'Challenge Updates', 
          description: 'Progress on group challenges',
          icon: TrendingUp
        },
        { 
          key: 'weeklyReports', 
          label: 'Weekly Reports', 
          description: 'Summary of your weekly progress',
          icon: TrendingUp
        }
      ]
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
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          <p className="text-gray-600">Manage your notification preferences</p>
        </motion.div>

        {/* Quiet Hours */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Moon className="text-purple-600" size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Quiet Hours</h3>
                <p className="text-sm text-gray-600">Pause notifications during sleep</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.quietHours}
                onChange={(e) => updateSetting('quietHours', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {settings.quietHours && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <button
                  onClick={() => setShowTimeModal('start')}
                  className="w-full p-3 border border-gray-300 rounded-xl text-left hover:border-blue-500 transition-colors"
                >
                  {settings.quietStart}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                <button
                  onClick={() => setShowTimeModal('end')}
                  className="w-full p-3 border border-gray-300 rounded-xl text-left hover:border-blue-500 transition-colors"
                >
                  {settings.quietEnd}
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Notification Groups */}
        <div className="space-y-6">
          {notificationGroups.map((group, groupIndex) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (groupIndex + 1) * 0.1 }}
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
                  <div key={item.key} className="p-4 flex items-center justify-between">
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
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Test Notification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-lg mt-6"
        >
          <div className="text-center">
            <Bell className="mx-auto text-blue-600 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Test Your Settings</h3>
            <p className="text-gray-600 text-sm mb-4">
              Send a test notification to see how your settings work
            </p>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors">
              Send Test Notification
            </button>
          </div>
        </motion.div>
      </div>

      {/* Time Picker Modal */}
      {showTimeModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                Select {showTimeModal === 'start' ? 'Start' : 'End'} Time
              </h3>
              <button
                onClick={() => setShowTimeModal(null)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X size={16} className="text-gray-600" />
              </button>
            </div>

            <input
              type="time"
              value={showTimeModal === 'start' ? settings.quietStart : settings.quietEnd}
              onChange={(e) => updateSetting(
                showTimeModal === 'start' ? 'quietStart' : 'quietEnd', 
                e.target.value
              )}
              className="w-full p-4 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg text-center"
            />

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowTimeModal(null)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowTimeModal(null)}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium"
              >
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Notifications;