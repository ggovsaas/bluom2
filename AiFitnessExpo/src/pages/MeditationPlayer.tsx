import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import BreathingAnimation from '../components/BreathingAnimation';
import LottieBackground from '../components/LottieBackground';
import { Soundscape, getAllSoundscapes, getSoundscapesByCategory } from '../utils/soundscapes';
import { loadSoundSettings } from '../utils/soundEffects';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 380;

interface MeditationPlayerProps {
  visible: boolean;
  onClose: () => void;
  soundscape?: Soundscape | null;
  duration?: number; // Duration in minutes, undefined for infinite
}

export default function MeditationPlayerScreen({
  visible,
  onClose,
  soundscape,
  duration,
}: MeditationPlayerProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedSoundscape, setSelectedSoundscape] = useState<Soundscape | null>(soundscape || null);
  const [showSoundscapeSelector, setShowSoundscapeSelector] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'exhale'>('inhale');
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalDuration = duration ? duration * 60 : 0; // Convert to seconds

  useEffect(() => {
    if (visible && selectedSoundscape) {
      loadSound();
    }
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [visible, selectedSoundscape]);

  useEffect(() => {
    if (isPlaying && totalDuration > 0) {
      timerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= totalDuration) {
            handleStop();
            return totalDuration;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, totalDuration]);

  const loadSound = async () => {
    if (!selectedSoundscape) return;
    
    // Soundscape files are not available yet - this is expected
    // The player UI will still work, just without audio
    if (!selectedSoundscape.file) {
      console.log('Soundscape file not available yet:', selectedSoundscape.name);
      return;
    }

    try {
      const settings = await loadSoundSettings();
      if (!settings.soundscapesEnabled) return;

      const { sound } = await Audio.Sound.createAsync(
        selectedSoundscape.file,
        {
          shouldPlay: false,
          isLooping: !duration, // Loop if no duration specified
          volume: settings.volume,
        }
      );
      soundRef.current = sound;
    } catch (error) {
      // Expected when sound files aren't available yet
      console.log('Soundscape file not loaded (files not added yet):', selectedSoundscape.name);
    }
  };

  const handlePlay = async () => {
    if (!soundRef.current) {
      await loadSound();
    }
    if (soundRef.current) {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const handlePause = async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    }
  };

  const handleStop = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.setPositionAsync(0);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = totalDuration > 0 ? currentTime / totalDuration : 0;

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Background Animation */}
        <LottieBackground
          type={
            selectedSoundscape?.category === 'water' ? 'waves' :
            selectedSoundscape?.category === 'nature' ? 'particles' :
            'aurora'
          }
        />
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
            {selectedSoundscape?.name || 'Meditation'}
          </Text>
          <TouchableOpacity
            style={styles.soundscapeButton}
            onPress={() => setShowSoundscapeSelector(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="musical-notes" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Breathing Animation */}
          <View style={styles.animationContainer}>
            <BreathingAnimation
              size={isSmallScreen ? 180 : 220}
              color={selectedSoundscape?.category === 'water' ? '#06b6d4' : '#3b82f6'}
              duration={4000}
              onInhale={() => setBreathingPhase('inhale')}
              onExhale={() => setBreathingPhase('exhale')}
            />
          </View>

          {/* Breathing Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.breathingText}>
              {breathingPhase === 'inhale' ? 'Breathe In' : 'Breathe Out'}
            </Text>
            <Text style={styles.instructionsText}>
              Follow the circle's rhythm. Breathe naturally and focus on the present moment.
            </Text>
          </View>

          {/* Progress Bar */}
          {totalDuration > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <Text style={styles.timeText}>{formatTime(totalDuration)}</Text>
              </View>
            </View>
          )}

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleStop}
              activeOpacity={0.7}
            >
              <Ionicons name="stop" size={24} color="#64748b" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.playButton}
              onPress={isPlaying ? handlePause : handlePlay}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={32}
                color="#ffffff"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setShowSoundscapeSelector(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="options" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Soundscape Selector Modal */}
        <Modal
          visible={showSoundscapeSelector}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.selectorOverlay}>
            <View style={styles.selectorContainer}>
              <View style={styles.selectorHeader}>
                <Text style={styles.selectorTitle}>Choose Soundscape</Text>
                <TouchableOpacity
                  onPress={() => setShowSoundscapeSelector(false)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={24} color="#1e293b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.selectorList}>
                {Object.entries({
                  Nature: getSoundscapesByCategory('nature'),
                  Water: getSoundscapesByCategory('water'),
                  Noise: getSoundscapesByCategory('noise'),
                  Urban: getSoundscapesByCategory('urban'),
                }).map(([category, soundscapes]) => (
                  soundscapes.length > 0 && (
                    <View key={category} style={styles.categorySection}>
                      <Text style={styles.categoryTitle}>{category}</Text>
                      {soundscapes.map((sc) => (
                        <TouchableOpacity
                          key={sc.id}
                          style={[
                            styles.soundscapeOption,
                            selectedSoundscape?.id === sc.id && styles.soundscapeOptionActive,
                          ]}
                          onPress={() => {
                            setSelectedSoundscape(sc);
                            setShowSoundscapeSelector(false);
                            if (isPlaying) {
                              handleStop();
                              setTimeout(() => handlePlay(), 500);
                            }
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.soundscapeOptionName}>{sc.name}</Text>
                          <Text style={styles.soundscapeOptionDesc}>{sc.description}</Text>
                          {selectedSoundscape?.id === sc.id && (
                            <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  soundscapeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  animationContainer: {
    marginBottom: 40,
  },
  instructionsContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  breathingText: {
    fontSize: isSmallScreen ? 24 : 28,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: isSmallScreen ? 14 : 16,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 22,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 40,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#64748b',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  selectorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  selectorContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.7,
    paddingBottom: 32,
  },
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  selectorTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  selectorList: {
    padding: 24,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  soundscapeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 8,
  },
  soundscapeOptionActive: {
    backgroundColor: '#dbeafe',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  soundscapeOptionName: {
    flex: 1,
    fontSize: isSmallScreen ? 15 : 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4,
  },
  soundscapeOptionDesc: {
    flex: 1,
    fontSize: isSmallScreen ? 12 : 13,
    color: '#64748b',
  },
});

