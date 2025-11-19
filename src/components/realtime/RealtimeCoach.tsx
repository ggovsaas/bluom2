// src/components/realtime/RealtimeCoach.tsx
// Real-Time AI Coach Component - Shows live state and AI recommendations
// React Native + Web compatible

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';

interface RealtimeCoachProps {
  userId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function RealtimeCoach({ 
  userId, 
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: RealtimeCoachProps) {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<any>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadState();
    
    if (autoRefresh) {
      const interval = setInterval(loadState, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [userId, autoRefresh, refreshInterval]);

  const loadState = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/realtime/state', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load realtime state');
      }

      const result = await response.json();
      setState(result.state?.state);
      setActions(result.state?.actions || []);
      setError(null);
    } catch (err: any) {
      console.error('Error loading realtime state:', err);
      setError(err.message || 'Failed to load state');
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async (actionId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/realtime/action/execute', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action_id: actionId })
      });

      if (response.ok) {
        // Reload state
        loadState();
      }
    } catch (err) {
      console.error('Error executing action:', err);
    }
  };

  if (loading && !state) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading your coach...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadState}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!state) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No state data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Recovery & Readiness Scores */}
      <View style={styles.scoresSection}>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Recovery</Text>
          <Text style={[styles.scoreValue, getScoreColor(state.recovery_score)]}>
            {state.recovery_score}
          </Text>
          <Text style={styles.scoreSubtext}>/ 100</Text>
        </View>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Readiness</Text>
          <Text style={[styles.scoreValue, getScoreColor(state.readiness_score)]}>
            {state.readiness_score}
          </Text>
          <Text style={styles.scoreSubtext}>/ 100</Text>
        </View>
      </View>

      {/* Coach Message */}
      {actions.find(a => a.action_type === 'coach_message') && (
        <View style={styles.coachMessageCard}>
          <Text style={styles.coachMessageTitle}>💬 Your Coach Says</Text>
          <Text style={styles.coachMessageText}>
            {actions.find(a => a.action_type === 'coach_message')?.action_payload?.message}
          </Text>
        </View>
      )}

      {/* Nutrition Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🍽️ Nutrition</Text>
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Calories</Text>
            <Text style={styles.progressValue}>
              {state.current_calories} / {state.target_calories}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min(100, (state.current_calories / state.target_calories) * 100)}%` }
              ]} 
            />
          </View>
        </View>
        <View style={styles.macroRow}>
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>Protein</Text>
            <Text style={styles.macroValue}>
              {state.protein_g}g / {state.target_protein}g
            </Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>Carbs</Text>
            <Text style={styles.macroValue}>
              {state.carbs_g}g / {state.target_carbs}g
            </Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>Fats</Text>
            <Text style={styles.macroValue}>
              {state.fats_g}g / {state.target_fats}g
            </Text>
          </View>
        </View>
      </View>

      {/* Activity Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏃 Activity</Text>
        <View style={styles.activityRow}>
          <View style={styles.activityItem}>
            <Text style={styles.activityLabel}>Steps</Text>
            <Text style={styles.activityValue}>
              {state.steps.toLocaleString()} / {state.target_steps.toLocaleString()}
            </Text>
          </View>
          <View style={styles.activityItem}>
            <Text style={styles.activityLabel}>Workout Load</Text>
            <Text style={styles.activityValue}>{state.workout_load}</Text>
          </View>
        </View>
      </View>

      {/* Wellness Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧘 Wellness</Text>
        <View style={styles.wellnessRow}>
          <View style={styles.wellnessItem}>
            <Text style={styles.wellnessLabel}>Sleep</Text>
            <Text style={styles.wellnessValue}>
              {state.sleep_hours.toFixed(1)}h / {state.target_sleep}h
            </Text>
          </View>
          <View style={styles.wellnessItem}>
            <Text style={styles.wellnessLabel}>Hydration</Text>
            <Text style={styles.wellnessValue}>
              {state.hydration_ml}ml / {state.target_hydration_ml}ml
            </Text>
          </View>
          <View style={styles.wellnessItem}>
            <Text style={styles.wellnessLabel}>Mood</Text>
            <Text style={styles.wellnessValue}>{state.mood}/5</Text>
          </View>
          <View style={styles.wellnessItem}>
            <Text style={styles.wellnessLabel}>Stress</Text>
            <Text style={styles.wellnessValue}>{state.stress}/5</Text>
          </View>
        </View>
      </View>

      {/* AI Actions */}
      {actions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤖 AI Recommendations</Text>
          {actions
            .filter(a => a.action_type !== 'coach_message')
            .sort((a, b) => a.priority - b.priority)
            .map((action) => (
              <View key={action.id} style={styles.actionCard}>
                <View style={styles.actionHeader}>
                  <Text style={styles.actionType}>
                    {getActionTypeEmoji(action.action_type)} {formatActionType(action.action_type)}
                  </Text>
                  {action.priority <= 7 && (
                    <View style={styles.priorityBadge}>
                      <Text style={styles.priorityText}>High Priority</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.actionReason}>{action.reason}</Text>
                {action.action_payload && (
                  <View style={styles.actionPayload}>
                    {renderActionPayload(action)}
                  </View>
                )}
                {!action.executed && (
                  <TouchableOpacity
                    style={styles.executeButton}
                    onPress={() => executeAction(action.id)}
                  >
                    <Text style={styles.executeButtonText}>Got it</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
        </View>
      )}

      {/* Refresh Button */}
      <TouchableOpacity style={styles.refreshButton} onPress={loadState}>
        <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Helper functions
function getScoreColor(score: number) {
  if (score >= 70) return { color: '#4CAF50' };
  if (score >= 50) return { color: '#FFA726' };
  return { color: '#F44336' };
}

function getActionTypeEmoji(type: string) {
  const emojis: Record<string, string> = {
    nutrition_adjust: '🍽️',
    workout_modify: '🏋️',
    sleep_suggestion: '😴',
    hydration_reminder: '💧',
    meditation_suggestion: '🧘',
    coach_message: '💬'
  };
  return emojis[type] || '📋';
}

function formatActionType(type: string) {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function renderActionPayload(action: any) {
  const payload = action.action_payload;
  
  if (action.action_type === 'nutrition_adjust') {
    return (
      <View>
        {payload.adjustment && (
          <Text style={styles.payloadText}>Adjustment: {payload.adjustment}</Text>
        )}
        {payload.calories_add && (
          <Text style={styles.payloadText}>Add {payload.calories_add} calories</Text>
        )}
        {payload.protein_add && (
          <Text style={styles.payloadText}>Add {payload.protein_add}g protein</Text>
        )}
        {payload.suggestions && (
          <Text style={styles.payloadText}>
            Suggestions: {payload.suggestions.join(', ')}
          </Text>
        )}
      </View>
    );
  }
  
  if (action.action_type === 'workout_modify') {
    return (
      <View>
        <Text style={styles.payloadText}>Modification: {payload.modification}</Text>
        {payload.suggestions && (
          <Text style={styles.payloadText}>
            Try: {payload.suggestions.join(', ')}
          </Text>
        )}
      </View>
    );
  }
  
  if (action.action_type === 'sleep_suggestion') {
    return (
      <View>
        {payload.suggestions && (
          <View>
            {payload.suggestions.map((s: string, idx: number) => (
              <Text key={idx} style={styles.payloadText}>• {s}</Text>
            ))}
          </View>
        )}
      </View>
    );
  }
  
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  scoresSection: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  scoreSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  coachMessageCard: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  coachMessageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  coachMessageText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  section: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  progressCard: {
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  macroRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macroItem: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  activityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  activityItem: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activityLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  activityValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  wellnessRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  wellnessItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  wellnessLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  wellnessValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  actionCard: {
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF7043',
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  priorityBadge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  actionReason: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  actionPayload: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  payloadText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
  },
  executeButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  executeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

