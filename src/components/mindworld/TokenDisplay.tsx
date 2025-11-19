// src/components/mindworld/TokenDisplay.tsx
// Token Display Component with Freeze Pass Purchase
// React Native + Web compatible

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';

interface TokenDisplayProps {
  userId: string;
  showFreezePass?: boolean;
  onFreezePassPurchased?: () => void;
}

export default function TokenDisplay({ 
  userId, 
  showFreezePass = true,
  onFreezePassPurchased 
}: TokenDisplayProps) {
  const [tokens, setTokens] = useState(0);
  const [freezePasses, setFreezePasses] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTokens();
    loadFreezePasses();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('garden-state-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mind_garden_state',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadTokens();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadTokens = async () => {
    try {
      const { data, error } = await supabase.rpc('get_garden_state', {
        p_user_id: userId
      });

      if (error) throw error;
      if (data) {
        setTokens(data.tokens || 0);
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFreezePasses = async () => {
    try {
      const { data, error } = await supabase.rpc('get_freeze_passes', {
        p_user_id: userId
      });

      if (error) throw error;
      if (data) {
        setFreezePasses(data.freeze_passes || 0);
      }
    } catch (error) {
      console.error('Error loading freeze passes:', error);
    }
  };

  const buyFreezePass = async () => {
    if (tokens < 10) {
      Alert.alert(
        'Not Enough Tokens',
        'You need 10 tokens to buy a freeze pass. Keep playing games and completing quests to earn more!',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Buy Freeze Pass?',
      'Use 10 tokens to buy a freeze pass that will save your streak if you miss a day.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy',
          onPress: async () => {
            try {
              const { data, error } = await supabase.rpc('buy_freeze_pass', {
                p_user_id: userId
              });

              if (error) throw error;

              if (data.success) {
                await loadTokens();
                await loadFreezePasses();
                
                Alert.alert('Success!', `You now have ${data.freeze_passes} freeze pass(es).`);
                
                if (onFreezePassPurchased) {
                  onFreezePassPurchased();
                }
              } else {
                Alert.alert('Error', data.error || 'Failed to purchase freeze pass');
              }
            } catch (error: any) {
              console.error('Error buying freeze pass:', error);
              Alert.alert('Error', error.message || 'Failed to purchase freeze pass');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tokenRow}>
        <Text style={styles.tokenEmoji}>🪙</Text>
        <Text style={styles.tokenValue}>{tokens}</Text>
        <Text style={styles.tokenLabel}>Tokens</Text>
      </View>

      {showFreezePass && (
        <View style={styles.freezeSection}>
          <View style={styles.freezeInfo}>
            <Text style={styles.freezeLabel}>Freeze Passes: {freezePasses}</Text>
            <Text style={styles.freezeDescription}>
              Save your streak if you miss a day
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.freezeButton, tokens < 10 && styles.freezeButtonDisabled]}
            onPress={buyFreezePass}
            disabled={tokens < 10}
          >
            <Text style={styles.freezeButtonText}>
              🛡️ Buy Freeze Pass (10🪙)
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tokenEmoji: {
    fontSize: 28,
    marginRight: 8,
  },
  tokenValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  tokenLabel: {
    fontSize: 16,
    color: '#666',
  },
  freezeSection: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  freezeInfo: {
    marginBottom: 8,
  },
  freezeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 4,
  },
  freezeDescription: {
    fontSize: 12,
    color: '#666',
  },
  freezeButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  freezeButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  freezeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    color: '#999',
    fontSize: 14,
  },
});

