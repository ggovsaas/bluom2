// src/components/StepsWidget.tsx
// Steps tracking widget

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Slider, TouchableOpacity } from 'react-native';
import { logSteps, getSteps } from '../services/move';
import { supabase } from '../lib/supabaseClient';

interface StepsWidgetProps {
  userId: string;
  date: string;
}

export default function StepsWidget({ userId, date }: StepsWidgetProps) {
  const [steps, setSteps] = useState(0);
  const [goal, setGoal] = useState(8000);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSteps();
  }, [userId, date]);

  const loadSteps = async () => {
    try {
      const data = await getSteps(userId, date);
      setSteps(data.steps || 0);

      // Get goal from settings
      const { data: settings } = await supabase
        .from('user_settings')
        .select('steps_goal')
        .eq('user_id', userId)
        .single();

      if (settings?.steps_goal) {
        setGoal(settings.steps_goal);
      }
    } catch (error) {
      console.error('Error loading steps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSteps = async (value: number) => {
    try {
      setSteps(value);
      await logSteps(userId, date, value);
    } catch (error) {
      console.error('Error updating steps:', error);
    }
  };

  const stepsPercent = Math.min((steps / goal) * 100, 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Steps</Text>
        <Text style={styles.stepsText}>{steps.toLocaleString()}</Text>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[styles.progressFill, { width: `${stepsPercent}%` }]}
        />
      </View>

      <Text style={styles.goalText}>
        {steps >= goal ? '🎉 Goal reached!' : `${(goal - steps).toLocaleString()} steps to goal`}
      </Text>

      <View style={styles.controls}>
        <Text style={styles.sliderLabel}>Adjust Steps</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={20000}
          step={100}
          value={steps}
          onValueChange={handleUpdateSteps}
          minimumTrackTintColor="#4CAF50"
          maximumTrackTintColor="#333"
        />
        <View style={styles.quickButtons}>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => handleUpdateSteps(steps + 1000)}
          >
            <Text style={styles.quickButtonText}>+1K</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => handleUpdateSteps(steps + 5000)}
          >
            <Text style={styles.quickButtonText}>+5K</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => handleUpdateSteps(0)}
          >
            <Text style={styles.quickButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  goalText: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 16,
  },
  controls: {
    marginTop: 8,
  },
  sliderLabel: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  quickButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  quickButton: {
    flex: 1,
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

