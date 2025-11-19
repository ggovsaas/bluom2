// src/components/mindworld/useMindWorldRewards.ts
// Custom hook for managing Mind World rewards and streaks
// React Native + Web compatible

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

interface RewardState {
  showRewardModal: boolean;
  rewardXP: number;
  streak: number;
  tokens: number;
  streakCategory: string;
}

export function useMindWorldRewards(userId: string) {
  const [rewardState, setRewardState] = useState<RewardState>({
    showRewardModal: false,
    rewardXP: 0,
    streak: 0,
    tokens: 0,
    streakCategory: '',
  });

  // Listen for streak updates and show reward modal
  useEffect(() => {
    const channel = supabase
      .channel('streak-rewards')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mind_garden_streaks',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          // When streak updates, check if we should show reward
          const category = payload.new.category;
          const streakCount = payload.new.streak_count;
          
          // Show reward for daily streak updates
          if (streakCount > 0) {
            // Calculate reward XP (5 + streak/3 * 5)
            const rewardXP = 5 + Math.floor(streakCount / 3) * 5;
            
            setRewardState({
              showRewardModal: true,
              rewardXP,
              streak: streakCount,
              tokens: 0, // Will be updated if tokens are awarded
              streakCategory: category,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const closeRewardModal = useCallback(() => {
    setRewardState(prev => ({
      ...prev,
      showRewardModal: false,
    }));
  }, []);

  const triggerReward = useCallback((xp: number, streak: number, tokens: number = 0, category: string = '') => {
    setRewardState({
      showRewardModal: true,
      rewardXP: xp,
      streak,
      tokens,
      streakCategory: category,
    });
  }, []);

  return {
    rewardState,
    closeRewardModal,
    triggerReward,
  };
}

