import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Brain, Moon, Sun, Target, Heart, Shield, Play, Pause, X, Clock, Sparkles } from 'lucide-react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

interface MeditationSession {
  id: number;
  title: string;
  category: string;
  duration: number;
  description?: string;
  audioUrl?: string;
}

interface MeditationHubProps {
  userId: number;
  onClose: () => void;
}

const MeditationHub: React.FC<MeditationHubProps> = ({ userId, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const [activeSession, setActiveSession] = useState<MeditationSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const categories = [
    { id: 'sleep', name: 'Better Sleep', icon: Moon, color: 'from-indigo-500 to-purple-600', description: 'Bedtime audio sessions' },
    { id: 'morning', name: 'Morning Boost', icon: Sun, color: 'from-yellow-400 to-orange-500', description: 'Energizing meditations' },
    { id: 'focus', name: 'Focus', icon: Target, color: 'from-blue-500 to-cyan-600', description: 'Concentration & breathing' },
    { id: 'self-love', name: 'Self-Love', icon: Heart, color: 'from-pink-400 to-rose-500', description: 'Affirmations & compassion' },
    { id: 'anxiety', name: 'Anxiety Relief', icon: Shield, color: 'from-green-500 to-emerald-600', description: 'Guided relaxation' },
  ];

  // Fetch meditations from API
  useEffect(() => {
    const fetchMeditations = async () => {
      try {
        const categoryParam = selectedCategory ? `?category=${selectedCategory}` : '';
        const response = await axios.get(`${API_ENDPOINTS.AIMIND_MEDITATION_LIBRARY}${categoryParam}`);
        if (response.data.success) {
          const meditations = response.data.meditations.map((m: any) => ({
            id: m.id,
            title: m.title,
            category: m.category,
            duration: m.duration,
            description: m.description,
            audioUrl: m.audio_url
          }));
          setSessions(meditations);
        }
      } catch (error) {
        console.error('Error fetching meditations:', error);
        // Fallback to mock data if API fails
        const mockSessions: MeditationSession[] = [
          { id: 1, title: 'Deep Sleep Journey', category: 'sleep', duration: 10, description: 'Drift into peaceful sleep' },
          { id: 2, title: 'Calm Night', category: 'sleep', duration: 15, description: 'Unwind and relax' },
          { id: 3, title: 'Morning Energy', category: 'morning', duration: 5, description: 'Start your day refreshed' },
          { id: 4, title: 'Focus Flow', category: 'focus', duration: 10, description: 'Enhance concentration' },
          { id: 5, title: 'Self-Compassion', category: 'self-love', duration: 12, description: 'Practice kindness to yourself' },
          { id: 6, title: 'Anxiety Relief', category: 'anxiety', duration: 8, description: 'Release tension and worry' },
        ];
        if (selectedCategory) {
          setSessions(mockSessions.filter(s => s.category === selectedCategory));
        } else {
          setSessions(mockSessions);
        }
      }
    };
    fetchMeditations();
  }, [selectedCategory]);

  useEffect(() => {
    if (isPlaying && activeSession) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => {
          const newTime = prev + 1;
          if (newTime >= activeSession.duration * 60) {
            setIsPlaying(false);
            completeSession();
            return activeSession.duration * 60;
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, activeSession]);

  const startSession = async (session: MeditationSession) => {
    setActiveSession(session);
    setTimeElapsed(0);
    setIsPlaying(false); // Start paused, user clicks play

    try {
      const response = await axios.post(API_ENDPOINTS.AIMIND_MEDITATION_START, {
        userId,
        title: session.title,
        duration: session.duration
      });
      if (response.data.success) {
        setSessionId(response.data.session?.id || null);
      }
    } catch (error) {
      console.error('Error starting meditation session:', error);
      // Continue anyway - session can still work offline
    }

    // Auto-play audio if available (after a small delay to ensure ref is set)
    setTimeout(() => {
      if (audioRef.current && session.audioUrl) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(err => {
            console.error('Audio autoplay failed (user interaction required):', err);
            // User will need to click play button
          });
      }
    }, 300);
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const completeSession = async () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (sessionId) {
      try {
        await axios.post(API_ENDPOINTS.AIMIND_MEDITATION_COMPLETE, {
          sessionId,
          userId
        });
      } catch (error) {
        console.error('Error completing session:', error);
      }
    }
    setActiveSession(null);
    setTimeElapsed(0);
    setSessionId(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">🧘 Meditation Hub</h2>
            <p className="text-sm text-gray-600">Choose your path to inner calm</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Daily Quote */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-6 mb-6">
            <Sparkles className="mb-2" size={24} />
            <p className="text-lg font-medium mb-1">Take a deep breath, you deserve calm.</p>
            <p className="text-sm opacity-90">Start your meditation journey today</p>
          </div>

          {/* Categories */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Browse by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedCategory === null
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Brain className="mx-auto mb-2 text-indigo-600" size={24} />
                <p className="text-xs font-medium text-gray-700">All</p>
              </button>
              {categories.map((cat) => {
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedCategory === cat.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className="mx-auto mb-2 text-gray-700" size={24} />
                    <p className="text-xs font-medium text-gray-700">{cat.name}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Session Player */}
          {activeSession && (
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 mb-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-xl font-bold">{activeSession.title}</h4>
                  <p className="text-sm opacity-90">{activeSession.description}</p>
                </div>
                <button
                  onClick={() => {
                    setActiveSession(null);
                    setIsPlaying(false);
                    setTimeElapsed(0);
                  }}
                  className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="text-center mb-4">
                <div className="text-5xl font-bold mb-2">
                  {formatTime(activeSession.duration * 60 - timeElapsed)}
                </div>
                <p className="text-sm opacity-75">Remaining</p>
              </div>
              {activeSession.audioUrl && (
                <audio
                  ref={audioRef}
                  src={activeSession.audioUrl}
                  onTimeUpdate={() => {
                    if (audioRef.current) {
                      setTimeElapsed(Math.floor(audioRef.current.currentTime));
                    }
                  }}
                  onEnded={() => {
                    completeSession();
                  }}
                  className="hidden"
                />
              )}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={togglePlayPause}
                  className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                </button>
                <button
                  onClick={completeSession}
                  className="px-6 py-3 bg-white bg-opacity-20 rounded-full font-medium hover:bg-opacity-30 transition-all"
                >
                  Complete
                </button>
              </div>
            </div>
          )}

          {/* Sessions List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'All Sessions'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions.map((session) => {
                const category = categories.find(c => c.id === session.category);
                return (
                  <motion.div
                    key={session.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-all cursor-pointer"
                    onClick={() => startSession(session)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 bg-gradient-to-br ${category?.color || 'from-gray-400 to-gray-600'} rounded-lg flex items-center justify-center`}>
                          {category && <category.icon className="text-white" size={24} />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{session.title}</h4>
                          <p className="text-xs text-gray-600">{category?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock size={14} />
                        <span className="text-xs">{session.duration} min</span>
                      </div>
                    </div>
                    {session.description && (
                      <p className="text-sm text-gray-600 mb-3">{session.description}</p>
                    )}
                    <button className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium hover:bg-indigo-100 transition-colors">
                      Start Session
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MeditationHub;

