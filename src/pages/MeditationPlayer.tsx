// src/pages/MeditationPlayer.tsx
// Meditation Player Screen
// Full-screen meditation experience with breathing circle, timer, mood tracking

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Slider, Image } from 'react-native';
import { supabase } from '../lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';

export default function MeditationPlayer() {
  const { sessionId } = useLocalSearchParams();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [level, setLevel] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [moodBefore, setMoodBefore] = useState(3);
  const [moodAfter, setMoodAfter] = useState(3);
  const [stressBefore, setStressBefore] = useState(5);
  const [stressAfter, setStressAfter] = useState(5);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [completed, setCompleted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadSession();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) return;

      const { data: sessionData } = await supabase
        .from('meditation_sessions_ac')
        .select(`
          *,
          meditation_levels (
            *,
            meditation_worlds (*)
          )
        `)
        .eq('id', sessionId)
        .single();

      if (sessionData) {
        setSession(sessionData);
        setLevel(sessionData.meditation_levels);
        setTimeRemaining(sessionData.meditation_levels?.duration_minutes * 60 || 300);
        setMoodBefore(sessionData.mood_before ? parseInt(sessionData.mood_before) : 3);
        setStressBefore(sessionData.stress_before || 5);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const startTimer = () => {
    setIsPlaying(true);
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    setIsPlaying(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleComplete = async () => {
    pauseTimer();
    setShowMoodModal(true);
  };

  const finishSession = async () => {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) return;

      const duration = (level?.duration_minutes * 60) - timeRemaining;

      const response = await fetch(`/api/meditationworld/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authSession.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mood_after: moodAfter.toString(),
          stress_after: stressAfter,
          duration_seconds: duration
        })
      });

      if (response.ok) {
        setCompleted(true);
        // Navigate back after 2 seconds
        setTimeout(() => {
          router.back();
        }, 2000);
      }
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const breathingProgress = (timeRemaining % 8) / 8; // 8 second breathing cycle
  const radius = 50 + (breathingProgress * 30);

  return (
    <View style={styles.container}>
      {/* Background */}
      {level?.meditation_worlds?.background_url ? (
        <Image 
          source={{ uri: level.meditation_worlds.background_url }} 
          style={styles.background}
        />
      ) : (
        <View style={styles.backgroundPlaceholder} />
      )}

      {/* Breathing Circle */}
      <View style={styles.breathingCircle}>
        <Svg width="200" height="200">
          <Circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#4CAF50"
            strokeWidth="3"
            opacity={0.6}
          />
        </Svg>
        <Text style={styles.breathingText}>
          {isPlaying ? 'Breathe' : 'Ready'}
        </Text>
      </View>

      {/* Timer */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
        <Text style={styles.levelName}>{level?.name}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={isPlaying ? pauseTimer : startTimer}
        >
          <Text style={styles.controlButtonText}>
            {isPlaying ? '⏸ Pause' : '▶ Start'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mood Modal */}
      <Modal
        visible={showMoodModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>How do you feel now?</Text>
            
            <View style={styles.moodSection}>
              <Text style={styles.moodLabel}>Mood (1-5)</Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={5}
                step={1}
                value={moodAfter}
                onValueChange={setMoodAfter}
                minimumTrackTintColor="#4CAF50"
                maximumTrackTintColor="#333"
              />
              <Text style={styles.moodValue}>{moodAfter}</Text>
            </View>

            <View style={styles.moodSection}>
              <Text style={styles.moodLabel}>Stress (1-10)</Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={stressAfter}
                onValueChange={setStressAfter}
                minimumTrackTintColor="#4CAF50"
                maximumTrackTintColor="#333"
              />
              <Text style={styles.moodValue}>{stressAfter}</Text>
            </View>

            <TouchableOpacity
              style={styles.completeButton}
              onPress={finishSession}
            >
              <Text style={styles.completeButtonText}>Complete Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {completed && (
        <View style={styles.completionOverlay}>
          <Text style={styles.completionText}>Session Complete! 🎉</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  backgroundPlaceholder: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#2a2a2a',
  },
  breathingCircle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingText: {
    position: 'absolute',
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  timerContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  levelName: {
    fontSize: 18,
    color: '#aaa',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#0008',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    padding: 24,
    borderRadius: 16,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  moodSection: {
    marginBottom: 24,
  },
  moodLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  moodValue: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  completionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0008',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});

