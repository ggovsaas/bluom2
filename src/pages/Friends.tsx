import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Share2, 
  Users, 
  Plus, 
  MessageCircle, 
  Trophy,
  Target,
  Heart,
  Copy,
  Check,
  Facebook,
  Twitter,
  Instagram,
  Mail,
  Link as LinkIcon,
  QrCode,
  Gift,
  Crown,
  Zap
} from 'lucide-react';

const Friends: React.FC = () => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'friends' | 'leaderboard' | 'challenges'>('friends');

  const friends = [
    { id: 1, name: 'Sarah Johnson', avatar: '👩‍💼', streak: 12, calories: 1847, status: 'online' },
    { id: 2, name: 'Mike Chen', avatar: '👨‍💻', streak: 8, calories: 2156, status: 'offline' },
    { id: 3, name: 'Emma Wilson', avatar: '👩‍🎨', streak: 15, calories: 1923, status: 'online' },
    { id: 4, name: 'Alex Rodriguez', avatar: '👨‍🏫', streak: 6, calories: 2034, status: 'online' },
  ];

  const leaderboard = [
    { rank: 1, name: 'Emma Wilson', points: 2847, badge: '🏆' },
    { rank: 2, name: 'You', points: 2156, badge: '🥈' },
    { rank: 3, name: 'Sarah Johnson', points: 1923, badge: '🥉' },
    { rank: 4, name: 'Mike Chen', points: 1847, badge: '🏅' },
    { rank: 5, name: 'Alex Rodriguez', points: 1634, badge: '⭐' },
  ];

  const challenges = [
    { 
      id: 1, 
      title: '7-Day Water Challenge', 
      description: 'Drink 8 glasses of water daily for a week',
      participants: 12,
      daysLeft: 3,
      progress: 71,
      reward: '50 points'
    },
    { 
      id: 2, 
      title: 'Step Master', 
      description: 'Walk 10,000 steps every day this month',
      participants: 8,
      daysLeft: 12,
      progress: 45,
      reward: '100 points'
    },
    { 
      id: 3, 
      title: 'Mindful Eating', 
      description: 'Log all meals for 14 consecutive days',
      participants: 15,
      daysLeft: 7,
      progress: 86,
      reward: '75 points'
    },
  ];

  const shareOptions = [
    { name: 'Facebook', icon: Facebook, color: 'bg-blue-600', action: () => shareToSocial('facebook') },
    { name: 'Twitter', icon: Twitter, color: 'bg-sky-500', action: () => shareToSocial('twitter') },
    { name: 'Instagram', icon: Instagram, color: 'bg-pink-500', action: () => shareToSocial('instagram') },
    { name: 'WhatsApp', icon: MessageCircle, color: 'bg-green-500', action: () => shareToSocial('whatsapp') },
    { name: 'Email', icon: Mail, color: 'bg-gray-600', action: () => shareToSocial('email') },
    { name: 'Copy Link', icon: LinkIcon, color: 'bg-purple-600', action: copyInviteLink },
  ];

  const inviteLink = 'https://aifit.app/invite/abc123';

  function copyInviteLink() {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareToSocial(platform: string) {
    const message = "Join me on AiFit! Let's crush our fitness goals together 💪";
    const url = inviteLink;
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(message)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`,
      instagram: `https://www.instagram.com/`, // Instagram doesn't support direct sharing
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message + ' ' + url)}`,
      email: `mailto:?subject=Join me on AiFit&body=${encodeURIComponent(message + '\n\n' + url)}`
    };

    if (shareUrls[platform as keyof typeof shareUrls]) {
      window.open(shareUrls[platform as keyof typeof shareUrls], '_blank');
    }
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
            <h1 className="text-2xl font-bold text-gray-800">Friends</h1>
            <p className="text-gray-600">Connect & compete with friends</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowShareModal(true)}
              className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            >
              <Share2 size={20} />
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
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
              onClick={() => setSelectedTab('friends')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
                selectedTab === 'friends' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Users size={20} />
              <span>Friends ({friends.length})</span>
            </button>
            <button
              onClick={() => setSelectedTab('leaderboard')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
                selectedTab === 'leaderboard' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Trophy size={20} />
              <span>Leaderboard</span>
            </button>
            <button
              onClick={() => setSelectedTab('challenges')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
                selectedTab === 'challenges' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Target size={20} />
              <span>Challenges</span>
            </button>
          </div>
        </motion.div>

        {/* Friends Tab */}
        {selectedTab === 'friends' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {friends.map((friend) => (
              <div key={friend.id} className="bg-white rounded-2xl p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl">
                        {friend.avatar}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{friend.name}</h3>
                      <p className="text-sm text-gray-600">{friend.streak} day streak</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">{friend.calories}</p>
                    <p className="text-xs text-gray-500">calories today</p>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <button className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-xl font-medium hover:bg-blue-200 transition-colors">
                    Message
                  </button>
                  <button className="flex-1 bg-green-100 text-green-700 py-2 rounded-xl font-medium hover:bg-green-200 transition-colors">
                    Challenge
                  </button>
                </div>
              </div>
            ))}

            {friends.length === 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
                <Users className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No friends yet</h3>
                <p className="text-gray-600 mb-4">Invite friends to make fitness more fun!</p>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  Invite Friends
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Leaderboard Tab */}
        {selectedTab === 'leaderboard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">This Week's Champions</h3>
            <div className="space-y-3">
              {leaderboard.map((user) => (
                <div key={user.rank} className={`flex items-center justify-between p-4 rounded-xl ${
                  user.name === 'You' ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {user.rank}
                    </div>
                    <span className="text-2xl">{user.badge}</span>
                    <div>
                      <h4 className={`font-semibold ${user.name === 'You' ? 'text-blue-700' : 'text-gray-800'}`}>
                        {user.name}
                      </h4>
                      <p className="text-sm text-gray-600">{user.points} points</p>
                    </div>
                  </div>
                  {user.name === 'You' && (
                    <Crown className="text-blue-600" size={20} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Challenges Tab */}
        {selectedTab === 'challenges' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {challenges.map((challenge) => (
              <div key={challenge.id} className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{challenge.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{challenge.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{challenge.participants} participants</span>
                      <span>{challenge.daysLeft} days left</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium mb-2">
                      {challenge.reward}
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{challenge.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${challenge.progress}%` }}
                    />
                  </div>
                </div>

                <button className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors">
                  Join Challenge
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
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
            <h3 className="text-xl font-bold text-gray-800 mb-4">Invite Friends</h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Your invite link:</p>
                    <p className="text-sm font-mono text-gray-800 break-all">{inviteLink}</p>
                  </div>
                  <button
                    onClick={copyInviteLink}
                    className="ml-3 p-2 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    {copied ? <Check className="text-green-600" size={16} /> : <Copy className="text-blue-600" size={16} />}
                  </button>
                </div>
              </div>

              <div className="text-center">
                <QrCode className="mx-auto text-gray-400 mb-2" size={48} />
                <p className="text-sm text-gray-600">Show QR code to friends</p>
              </div>

              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Gift className="text-green-600" size={20} />
                  <h4 className="font-semibold text-green-800">Referral Bonus</h4>
                </div>
                <p className="text-sm text-green-700">
                  You and your friend both get 1 week of Premium when they join!
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setShowShareModal(true);
                }}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium"
              >
                Share Link
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Share Modal */}
      {showShareModal && (
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
            <h3 className="text-xl font-bold text-gray-800 mb-4">Share with Friends</h3>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              {shareOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={option.action}
                  className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-12 h-12 ${option.color} rounded-full flex items-center justify-center mb-2`}>
                    <option.icon className="text-white" size={20} />
                  </div>
                  <span className="text-sm text-gray-700">{option.name}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-3 border border-gray-300 rounded-xl font-medium text-gray-700"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Friends;