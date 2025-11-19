// src/components/mindworld/MindTokenBalance.tsx
// Mind Token balance display

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';

interface MindTokenBalanceProps {
  userId: string;
  onBuyFreezePass?: () => void;
}

export default function MindTokenBalance({ userId, onBuyFreezePass }: MindTokenBalanceProps) {
  const [tokens, setTokens] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTokens();
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

  if (loading) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.tokenDisplay}>
        <Text style={styles.tokenEmoji}>🪙</Text>
        <Text style={styles.tokenAmount}>{tokens}</Text>
        <Text style={styles.tokenLabel}>Mind Tokens</Text>
      </View>

      {onBuyFreezePass && (
        <TouchableOpacity
          style={styles.freezeButton}
          onPress={onBuyFreezePass}
        >
          <Text style={styles.freezeButtonText}>
            🛡️ Buy Freeze Pass (10 tokens)
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  tokenDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tokenEmoji: {
    fontSize: 24,
  },
  tokenAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  tokenLabel: {
    fontSize: 14,
    color: '#666',
  },
  freezeButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  freezeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

