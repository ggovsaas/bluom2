// src/components/mindworld/GamesHubMindWorld.tsx
// Games Hub adapter for Mind Garden - connects to existing games
// React Native + Web compatible

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Game {
  id: string;
  name: string;
  category: string;
  description?: string;
  difficulty?: string;
  premium?: boolean;
  thumbnail_url?: string;
}

interface GamesHubMindWorldProps {
  userId: string;
  onGameComplete?: (gameId: string, score: number, duration: number) => void;
}

export default function GamesHubMindWorld({ userId, onGameComplete }: GamesHubMindWorldProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      const { data, error } = await supabase
        .from('mind_games')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGames(data || []);
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGameStart = (game: Game) => {
    // Navigate to existing game screen
    // This assumes your games are at routes like /games/[gameId] or /wellness/games/[gameId]
    navigate(`/wellness/games/${game.id}`);
  };

  // This function should be called when a game completes
  // It will be called from your existing game components
  const logGameSession = async (gameId: string, gameName: string, score: number, duration: number) => {
    try {
      const { data, error } = await supabase.rpc('log_game_session', {
        p_user_id: userId,
        p_game_id: gameId,
        p_game_name: gameName,
        p_score: score,
        p_duration: duration
      });

      if (error) throw error;

      // Also increment game streak
      await supabase.rpc('log_game_action', {
        p_user_id: userId
      });

      // Check quest progress
      await supabase.rpc('check_quest_progress', {
        p_user_id: userId,
        p_quest_type: 'play_game',
        p_progress_value: 1
      });

      if (onGameComplete) {
        onGameComplete(gameId, score, duration);
      }

      return data;
    } catch (error) {
      console.error('Error logging game session:', error);
      throw error;
    }
  };

  // Export logGameSession so existing games can use it
  (GamesHubMindWorld as any).logGameSession = logGameSession;

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading games...</Text>
      </View>
    );
  }

  const gamesByCategory = games.reduce((acc, game) => {
    const category = game.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(game);
    return acc;
  }, {} as Record<string, Game[]>);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🎮 Mind Games</Text>
      <Text style={styles.subtitle}>Play games to earn XP and tokens</Text>

      {Object.entries(gamesByCategory).map(([category, categoryGames]) => (
        <View key={category} style={styles.categorySection}>
          <Text style={styles.categoryTitle}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categoryGames.map((game) => (
              <TouchableOpacity
                key={game.id}
                style={styles.gameCard}
                onPress={() => handleGameStart(game)}
              >
                {game.thumbnail_url ? (
                  <View style={styles.gameThumbnail}>
                    <Text style={styles.gameThumbnailText}>🎮</Text>
                  </View>
                ) : (
                  <View style={styles.gameThumbnail}>
                    <Text style={styles.gameThumbnailText}>
                      {getGameEmoji(category)}
                    </Text>
                  </View>
                )}
                
                <Text style={styles.gameName}>{game.name}</Text>
                {game.difficulty && (
                  <Text style={styles.gameDifficulty}>
                    {game.difficulty}
                  </Text>
                )}
                {game.premium && (
                  <Text style={styles.premiumBadge}>⭐ Premium</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ))}

      {/* Instructions */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 How it works</Text>
        <Text style={styles.infoText}>
          • Play any game to earn XP and tokens{'\n'}
          • Higher scores = more rewards{'\n'}
          • Complete daily quests by playing games{'\n'}
          • Build your game streak for bonus rewards
        </Text>
      </View>
    </ScrollView>
  );
}

function getGameEmoji(category: string): string {
  const emojis: Record<string, string> = {
    reaction: '⚡',
    memory: '🧠',
    focus: '🎯',
    breathing: '🌬️',
    calm: '🧘',
    logic: '🧩',
  };
  return emojis[category.toLowerCase()] || '🎮';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  gameCard: {
    width: 140,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  gameThumbnail: {
    width: '100%',
    height: 100,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gameThumbnailText: {
    fontSize: 48,
  },
  gameName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  gameDifficulty: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  premiumBadge: {
    fontSize: 10,
    color: '#FF9800',
    fontWeight: '600',
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

// Export helper function for existing games to use
export const logGameSessionForMindWorld = async (
  userId: string,
  gameId: string,
  gameName: string,
  score: number,
  duration: number
) => {
  try {
    const { data, error } = await supabase.rpc('log_game_session', {
      p_user_id: userId,
      p_game_id: gameId,
      p_game_name: gameName,
      p_score: score,
      p_duration: duration
    });

    if (error) throw error;

    // Also increment game streak
    await supabase.rpc('log_game_action', {
      p_user_id: userId
    });

    // Check quest progress
    await supabase.rpc('check_quest_progress', {
      p_user_id: userId,
      p_quest_type: 'play_game',
      p_progress_value: 1
    });

    return data;
  } catch (error) {
    console.error('Error logging game session:', error);
    throw error;
  }
};

