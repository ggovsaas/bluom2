import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import { supabase } from '../lib/supabase';
import MeditationPlayerScreen from '../pages/MeditationPlayer';
import { getAllSoundscapes } from '../utils/soundscapes';

const { width } = Dimensions.get('window');

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
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [showMeditationPlayer, setShowMeditationPlayer] = useState(false);
  const [selectedSoundscape, setSelectedSoundscape] = useState<any>(null);

  const categories = [
    { id: 'sleep', name: 'Better Sleep', emoji: '🌙', color: '#6366f1' },
    { id: 'morning', name: 'Morning Boost', emoji: '☀️', color: '#f59e0b' },
    { id: 'focus', name: 'Focus', emoji: '🎯', color: '#3b82f6' },
    { id: 'self-love', name: 'Self-Love', emoji: '💗', color: '#ec4899' },
    { id: 'anxiety', name: 'Anxiety Relief', emoji: '🛡️', color: '#10b981' },
  ];

  // Fetch meditations from Supabase
  useEffect(() => {
    const fetchMeditations = async () => {
      try {
        let query = supabase.from('meditation_sessions').select('*');
        
        if (selectedCategory) {
          query = query.eq('category', selectedCategory);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        const meditations = (data || []).map((m: any) => ({
          id: m.id,
          title: m.title,
          category: m.category,
          duration: m.duration,
          description: m.description,
          audioUrl: m.audio_url
        }));
        setSessions(meditations);
      } catch (error) {
        console.error('Error fetching meditations:', error);
        // Fallback to empty array
        setSessions([]);
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
    setIsPlaying(false);

    try {
      const { data, error } = await supabase
        .from('meditation_logs')
        .insert({
          user_id: userId,
          meditation_id: session.id,
          title: session.title,
          duration: session.duration,
          started_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      setSessionId(data?.id || null);
    } catch (error) {
      console.error('Error starting meditation session:', error);
    }

    // Load and play audio if available
    if (session.audioUrl) {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
        });
        const { sound: audioSound } = await Audio.Sound.createAsync(
          { uri: session.audioUrl },
          { shouldPlay: false }
        );
        setSound(audioSound);
      } catch (error) {
        console.error('Error loading audio:', error);
      }
    }
  };

  const togglePlayPause = async () => {
    if (sound) {
      try {
        if (isPlaying) {
          await sound.pauseAsync();
        } else {
          await sound.playAsync();
        }
        setIsPlaying(!isPlaying);
      } catch (error) {
        console.error('Error toggling playback:', error);
      }
    } else {
      // If no audio, just toggle the timer
      setIsPlaying(!isPlaying);
    }
  };

  const completeSession = async () => {
    setIsPlaying(false);
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      } catch (error) {
        console.error('Error stopping audio:', error);
      }
    }
    if (sessionId) {
      try {
        await supabase
          .from('meditation_logs')
          .update({
            completed_at: new Date().toISOString(),
            duration_completed: Math.floor(timeElapsed / 60)
          })
          .eq('id', sessionId);
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

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sound]);

  return (
    <Modal visible={true} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>🧘 Meditation Hub</Text>
            <Text style={styles.headerSubtitle}>Choose your path to inner calm</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Daily Quote */}
          <View style={styles.quoteCard}>
            <Text style={styles.quoteEmoji}>✨</Text>
            <Text style={styles.quoteText}>Take a deep breath, you deserve calm.</Text>
            <Text style={styles.quoteSubtext}>Start your meditation journey today</Text>
          </View>

          {/* Soundscape Quick Access */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Soundscapes</Text>
            <TouchableOpacity
              style={styles.soundscapeCard}
              onPress={() => {
                const soundscapes = getAllSoundscapes();
                if (soundscapes.length > 0) {
                  setSelectedSoundscape(soundscapes[0]);
                  setShowMeditationPlayer(true);
                }
              }}
            >
              <Text style={styles.soundscapeEmoji}>🎵</Text>
              <View style={styles.soundscapeInfo}>
                <Text style={styles.soundscapeTitle}>Ambient Soundscapes</Text>
                <Text style={styles.soundscapeDesc}>Rain, ocean, forest, and more</Text>
              </View>
              <Text style={styles.soundscapeArrow}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Browse by Category</Text>
            <View style={styles.categoryGrid}>
              <TouchableOpacity
                style={[
                  styles.categoryCard,
                  selectedCategory === null && styles.categoryCardActive
                ]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={styles.categoryEmoji}>🧠</Text>
                <Text style={styles.categoryName}>All</Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryCard,
                    selectedCategory === cat.id && styles.categoryCardActive
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Active Session Player */}
          {activeSession && (
            <View style={styles.playerCard}>
              <View style={styles.playerHeader}>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerTitle}>{activeSession.title}</Text>
                  <Text style={styles.playerDescription}>{activeSession.description}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setActiveSession(null);
                    setIsPlaying(false);
                    setTimeElapsed(0);
                    if (sound) {
                      sound.unloadAsync();
                      setSound(null);
                    }
                  }}
                  style={styles.playerCloseButton}
                >
                  <Text style={styles.playerCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.playerControls}>
                <Text style={styles.playerTime}>
                  {formatTime(timeElapsed)} / {formatTime(activeSession.duration * 60)}
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${(timeElapsed / (activeSession.duration * 60)) * 100}%` }
                    ]}
                  />
                </View>
                <TouchableOpacity
                  onPress={togglePlayPause}
                  style={styles.playButton}
                >
                  <Text style={styles.playButtonText}>{isPlaying ? '⏸️' : '▶️'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={completeSession}
                  style={styles.completeButton}
                >
                  <Text style={styles.completeButtonText}>Complete Session</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Sessions List */}
          {!activeSession && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {selectedCategory
                  ? categories.find(c => c.id === selectedCategory)?.name || 'Sessions'
                  : 'All Sessions'}
              </Text>
              {sessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  onPress={() => startSession(session)}
                  style={styles.sessionCard}
                >
                  <View style={styles.sessionLeft}>
                    <Text style={styles.sessionEmoji}>
                      {categories.find(c => c.id === session.category)?.emoji || '🧘'}
                    </Text>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionTitle}>{session.title}</Text>
                      <Text style={styles.sessionDescription}>{session.description}</Text>
                      <Text style={styles.sessionDuration}>{session.duration} min</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => startSession(session)}
                    style={styles.sessionPlayButton}
                  >
                    <Text style={styles.sessionPlayText}>▶️</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Meditation Player Modal */}
      <MeditationPlayerScreen
        visible={showMeditationPlayer}
        onClose={() => {
          setShowMeditationPlayer(false);
          setSelectedSoundscape(null);
        }}
        soundscape={selectedSoundscape}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#64748b',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  quoteCard: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  quoteEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  quoteText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  quoteSubtext: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: (width - 60) / 3,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  categoryCardActive: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  playerCard: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  playerInfo: {
    flex: 1,
  },
  playerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  playerDescription: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  playerCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerCloseText: {
    fontSize: 18,
    color: '#ffffff',
  },
  playerControls: {
    alignItems: 'center',
  },
  playerTime: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 12,
    fontWeight: '600',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 3,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  playButtonText: {
    fontSize: 32,
  },
  completeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  completeButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  sessionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sessionEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  sessionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  sessionDuration: {
    fontSize: 12,
    color: '#94a3b8',
  },
  sessionPlayButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionPlayText: {
    fontSize: 20,
  },
  soundscapeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  soundscapeEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  soundscapeInfo: {
    flex: 1,
  },
  soundscapeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  soundscapeDesc: {
    fontSize: 13,
    color: '#64748b',
  },
  soundscapeArrow: {
    fontSize: 20,
    color: '#64748b',
  },
});

export default MeditationHub;

