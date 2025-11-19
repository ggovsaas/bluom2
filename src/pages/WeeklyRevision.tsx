// src/pages/WeeklyRevision.tsx
// Weekly Revision Summary Screen - Shows AI analysis and plan updates
// React Native + Web compatible

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function WeeklyRevision() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState<any>(null);
  const [nextRevision, setNextRevision] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRevision();
  }, []);

  const loadRevision = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Not authenticated');
        return;
      }

      // Get latest revision
      const response = await fetch('/api/personalize/revisions?limit=1', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load revision');
      }

      const result = await response.json();
      if (result.revisions && result.revisions.length > 0) {
        setRevision(result.revisions[0]);
      }

      // Get next revision date
      const { data: schedule } = await supabase
        .from('revision_schedule')
        .select('next_revision')
        .eq('user_id', session.user.id)
        .single();

      if (schedule) {
        setNextRevision(schedule.next_revision);
      }
    } catch (err: any) {
      console.error('Error loading revision:', err);
      setError(err.message || 'Failed to load revision');
    } finally {
      setLoading(false);
    }
  };

  const triggerRevision = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/personalize/revise', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to trigger revision');
      }

      const result = await response.json();
      if (result.status === 'not_due') {
        alert('Revision not due yet. Check back in a few days!');
      } else {
        setRevision(result.revision);
        alert('Your plan has been updated!');
      }
    } catch (err: any) {
      console.error('Error triggering revision:', err);
      setError(err.message || 'Failed to trigger revision');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading your weekly summary...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigate('/home')}
        >
          <Text style={styles.buttonText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📆 Weekly Summary</Text>
        <Text style={styles.subtitle}>Your AI Coach's Analysis</Text>
      </View>

      {!revision ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No revision available yet</Text>
          <Text style={styles.emptySubtext}>
            Complete your first week to get your personalized analysis!
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={triggerRevision}
          >
            <Text style={styles.buttonText}>Generate Revision Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Summary Section */}
          {revision.summary && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 This Week's Summary</Text>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryText}>{revision.summary}</Text>
              </View>
            </View>
          )}

          {/* Stats Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📈 Your Stats</Text>
            <View style={styles.statsGrid}>
              {revision.adherence_score !== null && (
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{Math.round(revision.adherence_score)}%</Text>
                  <Text style={styles.statLabel}>Adherence</Text>
                </View>
              )}
              {revision.workouts_completed !== null && (
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{revision.workouts_completed}</Text>
                  <Text style={styles.statLabel}>Workouts</Text>
                </View>
              )}
              {revision.sleep_avg !== null && (
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{revision.sleep_avg.toFixed(1)}h</Text>
                  <Text style={styles.statLabel}>Avg Sleep</Text>
                </View>
              )}
              {revision.calories_avg !== null && (
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{Math.round(revision.calories_avg)}</Text>
                  <Text style={styles.statLabel}>Avg Calories</Text>
                </View>
              )}
            </View>
          </View>

          {/* Changes Section */}
          {revision.changes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔥 Changes to Your Plan</Text>
              {revision.changes.calorie_adjustment && (
                <View style={styles.changeCard}>
                  <Text style={styles.changeLabel}>Calories</Text>
                  <Text style={styles.changeValue}>
                    {revision.changes.calorie_adjustment > 0 ? '+' : ''}
                    {revision.changes.calorie_adjustment} kcal
                  </Text>
                </View>
              )}
              {revision.changes.workout_changes && (
                <View style={styles.changeCard}>
                  <Text style={styles.changeLabel}>Workouts</Text>
                  <Text style={styles.changeText}>{revision.changes.workout_changes}</Text>
                </View>
              )}
              {revision.changes.meal_plan_changes && (
                <View style={styles.changeCard}>
                  <Text style={styles.changeLabel}>Meals</Text>
                  <Text style={styles.changeText}>{revision.changes.meal_plan_changes}</Text>
                </View>
              )}
            </View>
          )}

          {/* Recommendations Section */}
          {revision.changes?.recommendations && revision.changes.recommendations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💡 Recommendations</Text>
              {revision.changes.recommendations.map((rec: any, idx: number) => (
                <View key={idx} style={styles.recommendationCard}>
                  <Text style={styles.recommendationType}>{rec.type?.toUpperCase()}</Text>
                  <Text style={styles.recommendationMessage}>{rec.message}</Text>
                  <Text style={styles.recommendationAction}>→ {rec.action}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Next Revision */}
          {nextRevision && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⏰ Next Revision</Text>
              <View style={styles.nextRevisionCard}>
                <Text style={styles.nextRevisionText}>
                  {new Date(nextRevision).toLocaleDateString()}
                </Text>
                <Text style={styles.nextRevisionSubtext}>
                  Your plan will be automatically updated based on your progress
                </Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => navigate('/personalization')}
            >
              <Text style={styles.buttonText}>View Updated Plan</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => navigate('/home')}
            >
              <Text style={styles.secondaryButtonText}>Continue</Text>
            </TouchableOpacity>
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
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    margin: 24,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  changeCard: {
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  changeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF7043',
    marginBottom: 4,
  },
  changeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  changeText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  recommendationCard: {
    backgroundColor: '#e8f5e9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  recommendationType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 4,
  },
  recommendationMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  recommendationAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  nextRevisionCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextRevisionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  nextRevisionSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
});

