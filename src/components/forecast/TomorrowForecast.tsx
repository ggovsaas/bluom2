// src/components/forecast/TomorrowForecast.tsx
// Tomorrow's Workout Forecast Widget
// React Native + Web compatible

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';

interface TomorrowForecastProps {
  userId: string;
  onWorkoutSelect?: (workoutType: string) => void;
}

export default function TomorrowForecast({ userId, onWorkoutSelect }: TomorrowForecastProps) {
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadForecast();
  }, [userId]);

  const loadForecast = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/forecast/tomorrow', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load forecast');
      }

      const result = await response.json();
      setForecast(result.forecast);
      setError(null);
    } catch (err: any) {
      console.error('Error loading forecast:', err);
      setError(err.message || 'Failed to load forecast');
    } finally {
      setLoading(false);
    }
  };

  const regenerateForecast = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/forecast/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setForecast(result.forecast);
      }
    } catch (err) {
      console.error('Error regenerating forecast:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Analyzing your training...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadForecast}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!forecast) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No forecast available</Text>
        <TouchableOpacity style={styles.generateButton} onPress={regenerateForecast}>
          <Text style={styles.generateButtonText}>Generate Forecast</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getIntensityColor = (intensity: string) => {
    const colors: Record<string, string> = {
      very_high: '#F44336',
      high: '#FF7043',
      moderate: '#FFA726',
      low: '#66BB6A',
      very_low: '#81C784'
    };
    return colors[intensity] || '#999';
  };

  const getIntensityLabel = (intensity: string) => {
    const labels: Record<string, string> = {
      very_high: 'Very High',
      high: 'High',
      moderate: 'Moderate',
      low: 'Low',
      very_low: 'Very Low'
    };
    return labels[intensity] || intensity;
  };

  const getWorkoutTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      strength: 'Strength Training',
      hypertrophy: 'Hypertrophy',
      cardio: 'Cardio',
      recovery: 'Recovery',
      mobility: 'Mobility & Stretching'
    };
    return labels[type] || type;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📅 Tomorrow's Forecast</Text>
        <TouchableOpacity onPress={regenerateForecast}>
          <Text style={styles.refreshText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {forecast.rest_day ? (
        <View style={[styles.card, styles.restDayCard]}>
          <Text style={styles.restDayTitle}>😌 Rest Day</Text>
          <Text style={styles.restDayText}>
            Your body needs recovery. Take it easy today.
          </Text>
          <View style={styles.suggestions}>
            <Text style={styles.suggestionsTitle}>Suggested Activities:</Text>
            <Text style={styles.suggestionItem}>• 15-minute stretching</Text>
            <Text style={styles.suggestionItem}>• Light walk (5-7k steps)</Text>
            <Text style={styles.suggestionItem}>• Meditation session</Text>
            <Text style={styles.suggestionItem}>• Foam rolling</Text>
          </View>
          <Text style={styles.reason}>{forecast.reason}</Text>
        </View>
      ) : (
        <>
          {/* Intensity Display */}
          <View style={styles.card}>
            <View style={styles.intensityHeader}>
              <Text style={styles.intensityLabel}>Predicted Intensity</Text>
              <View style={[
                styles.intensityBadge,
                { backgroundColor: getIntensityColor(forecast.predicted_intensity) }
              ]}>
                <Text style={styles.intensityValue}>
                  {getIntensityLabel(forecast.predicted_intensity)}
                </Text>
              </View>
            </View>
            <View style={styles.loadBar}>
              <View 
                style={[
                  styles.loadFill,
                  { 
                    width: `${forecast.predicted_load}%`,
                    backgroundColor: getIntensityColor(forecast.predicted_intensity)
                  }
                ]} 
              />
            </View>
            <Text style={styles.loadText}>
              Load: {forecast.predicted_load}/100
            </Text>
          </View>

          {/* Recommended Workout */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🏋️ Recommended Workout</Text>
            <Text style={styles.workoutType}>
              {getWorkoutTypeLabel(forecast.recommended_workout_type)}
            </Text>
            
            {forecast.deload && (
              <View style={styles.deloadBadge}>
                <Text style={styles.deloadText}>⚠️ Deload Week</Text>
              </View>
            )}

            {forecast.volume_adjustment_percent !== 0 && (
              <View style={styles.adjustmentRow}>
                <Text style={styles.adjustmentLabel}>Volume Adjustment:</Text>
                <Text style={[
                  styles.adjustmentValue,
                  { color: forecast.volume_adjustment_percent > 0 ? '#4CAF50' : '#FF7043' }
                ]}>
                  {forecast.volume_adjustment_percent > 0 ? '+' : ''}
                  {forecast.volume_adjustment_percent}%
                </Text>
              </View>
            )}

            {onWorkoutSelect && (
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => onWorkoutSelect(forecast.recommended_workout_type)}
              >
                <Text style={styles.selectButtonText}>Select This Workout</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Workout Adjustments */}
          {forecast.predicted_load >= 80 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>⚡ High Intensity Adjustments</Text>
              <Text style={styles.adjustmentItem}>• More supersets</Text>
              <Text style={styles.adjustmentItem}>• Focus on compound lifts</Text>
              <Text style={styles.adjustmentItem}>• Shorter rest periods (60-90s)</Text>
              <Text style={styles.adjustmentItem}>• Add heavy finisher set</Text>
            </View>
          )}

          {forecast.deload && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📉 Deload Week Guidelines</Text>
              <Text style={styles.adjustmentItem}>• Reduce sets by 40%</Text>
              <Text style={styles.adjustmentItem}>• Reduce load by 50%</Text>
              <Text style={styles.adjustmentItem}>• Lower RPE (5-6)</Text>
              <Text style={styles.adjustmentItem}>• Focus on form and mobility</Text>
            </View>
          )}

          {forecast.predicted_load < 20 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🧘 Recovery Day</Text>
              <Text style={styles.adjustmentItem}>• Full rest recommended</Text>
              <Text style={styles.adjustmentItem}>• 15-minute stretching routine</Text>
              <Text style={styles.adjustmentItem}>• Light mobility work</Text>
              <Text style={styles.adjustmentItem}>Focus on sleep and nutrition</Text>
            </View>
          )}

          {/* Reasoning */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💡 Why This Forecast?</Text>
            <Text style={styles.reason}>{forecast.reason}</Text>
          </View>

          {/* Suggestions */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📋 Today's Preparation</Text>
            <Text style={styles.suggestionItem}>• Hydrate well tonight</Text>
            <Text style={styles.suggestionItem}>• Get 7-9 hours of sleep</Text>
            <Text style={styles.suggestionItem}>• Eat a balanced dinner</Text>
            <Text style={styles.suggestionItem}>• Prepare your workout gear</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshText: {
    fontSize: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    margin: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    margin: 24,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    margin: 24,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    margin: 24,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  restDayCard: {
    backgroundColor: '#e8f5e9',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  restDayTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  restDayText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 22,
  },
  intensityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  intensityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  intensityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  intensityValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadBar: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  loadFill: {
    height: '100%',
    borderRadius: 6,
  },
  loadText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  workoutType: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 8,
  },
  deloadBadge: {
    backgroundColor: '#fff3e0',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  deloadText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF7043',
  },
  adjustmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  adjustmentLabel: {
    fontSize: 14,
    color: '#666',
  },
  adjustmentValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  adjustmentItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  suggestions: {
    marginTop: 12,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  suggestionItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  reason: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  selectButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

