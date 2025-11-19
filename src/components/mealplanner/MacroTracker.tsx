// src/components/mealplanner/MacroTracker.tsx
// Macro Tracker Component - Shows daily macro targets, consumed, and remaining
// React Native + Web compatible

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';

interface MacroTrackerProps {
  userId: string;
  date?: string;
}

export default function MacroTracker({ userId, date }: MacroTrackerProps) {
  const [macros, setMacros] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMacros();
  }, [userId, date]);

  const loadMacros = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `/api/mealplanner/macros?date=${date || new Date().toISOString().split('T')[0]}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        setMacros(result.macros);
      }
    } catch (error) {
      console.error('Error loading macros:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#4CAF50" />
      </View>
    );
  }

  if (!macros) {
    return null;
  }

  const MacroBar = ({ label, consumed, target, color, unit = 'g' }) => {
    const percentage = target > 0 ? Math.min((consumed / target) * 100, 100) : 0;
    const remaining = Math.max(0, target - consumed);

    return (
      <View style={styles.macroBar}>
        <View style={styles.macroHeader}>
          <Text style={styles.macroLabel}>{label}</Text>
          <Text style={styles.macroValue}>
            {Math.round(consumed)} / {target}{unit}
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${percentage}%`, backgroundColor: color }
            ]}
          />
        </View>
        <Text style={styles.remainingText}>
          {remaining > 0 ? `${Math.round(remaining)}${unit} remaining` : 'Goal met!'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Macros</Text>
      
      <MacroBar
        label="Calories"
        consumed={macros.calories_consumed}
        target={macros.calories_target}
        color="#FF7043"
        unit=""
      />
      
      <MacroBar
        label="Protein"
        consumed={macros.protein_consumed}
        target={macros.protein_target}
        color="#4CAF50"
      />
      
      <MacroBar
        label="Carbs"
        consumed={macros.carbs_consumed}
        target={macros.carbs_target}
        color="#2196F3"
      />
      
      <MacroBar
        label="Fats"
        consumed={macros.fats_consumed}
        target={macros.fats_target}
        color="#FF9800"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    margin: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  macroBar: {
    marginBottom: 16,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  remainingText: {
    fontSize: 12,
    color: '#999',
  },
});

