import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  TextInput,
  Animated,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';

const { width } = Dimensions.get('window');

interface GameResult {
  game: string;
  score?: number;
  reaction_ms?: number;
  best_time?: number;
  attempts?: number;
}

interface GamesHubProps {
  userId: number;
  onClose: () => void;
  onGameComplete?: (result: GameResult) => void;
}

const GamesHub: React.FC<GamesHubProps> = ({ userId, onClose, onGameComplete }) => {
  const navigation = useNavigation();
  const { isPremiumOrTrial } = useUser();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const [playedGames, setPlayedGames] = useState<Set<string>>(new Set());

  const games = [
    { id: 'reaction', name: 'Wait for Green', emoji: '⚡', color: '#10b981', description: 'Test reaction time', component: ReactionTestGame },
    { id: 'breathing', name: 'Breath Match', emoji: '💨', color: '#06b6d4', description: 'Match breathing rhythm', component: BreathingGame },
    { id: 'memory', name: 'Memory Path', emoji: '🧠', color: '#a855f7', description: 'Remember sequences', component: MemoryGame },
    { id: 'balance', name: 'Balance', emoji: '🎯', color: '#f97316', description: 'Keep centered', component: BalanceGame },
    { id: 'spot-difference', name: 'Spot Difference', emoji: '🔍', color: '#6366f1', description: 'Find changes', component: SpotDifferenceGame },
    { id: 'sequence-recall', name: 'Sequence Recall', emoji: '📋', color: '#14b8a6', description: 'Remember numbers', component: SequenceRecallGame },
    { id: 'focus-frenzy', name: 'Focus Frenzy', emoji: '👆', color: '#ec4899', description: 'Click targets fast', component: FocusFrenzyGame },
    { id: 'wave-rider', name: 'Wave Rider', emoji: '🌊', color: '#3b82f6', description: 'Breathe with waves', component: WaveRiderGame },
    { id: 'mood-meter', name: 'Mood Meter', emoji: '❤️', color: '#f43f5e', description: 'Track emotions', component: MoodMeterGame },
    { id: 'focus-shift', name: 'Focus Shift', emoji: '🔄', color: '#06b6d4', description: 'Switch tasks', component: FocusShiftGame },
    { id: 'visual-filter', name: 'Visual Filter', emoji: '👁️', color: '#8b5cf6', description: 'Find patterns', component: VisualFilterGame },
    { id: 'task-switcher', name: 'Task Switcher', emoji: '📚', color: '#6366f1', description: 'Quick switching', component: TaskSwitcherGame },
    { id: 'attention-trainer', name: 'Attention Trainer', emoji: '👆', color: '#ec4899', description: 'Click targets', component: AttentionTrainerGame },
    { id: 'concentration-challenge', name: 'Concentration', emoji: '⏰', color: '#f59e0b', description: 'Focus longer', component: ConcentrationChallengeGame },
    { id: 'breathe-mountain', name: 'Breathe Mountain', emoji: '⛰️', color: '#10b981', description: 'Mountain breathing', component: BreatheMountainGame },
    { id: 'relaxing-ripples', name: 'Relaxing Ripples', emoji: '💧', color: '#06b6d4', description: 'Create ripples', component: RelaxingRipplesGame },
    { id: 'calm-colors', name: 'Calm Colors', emoji: '🎨', color: '#ec4899', description: 'Color breathing', component: CalmColorsGame },
    { id: 'soothing-soundscape', name: 'Soundscape', emoji: '🎵', color: '#14b8a6', description: 'Peaceful sounds', component: SoothingSoundscapeGame },
    { id: 'mindful-moments', name: 'Mindful Moments', emoji: '🎯', color: '#6366f1', description: 'Present moment', component: MindfulMomentsGame },
    { id: 'memory-matrix-2', name: 'Memory Matrix', emoji: '🔲', color: '#a855f7', description: 'Grid memory', component: MemoryMatrix2Game },
    { id: 'word-scramble', name: 'Word Scramble', emoji: '🔀', color: '#f97316', description: 'Unscramble words', component: WordScrambleGame },
    { id: 'math-bingo-2', name: 'Math Bingo', emoji: '🔢', color: '#10b981', description: 'Solve math', component: MathBingo2Game },
    { id: 'storyteller-2', name: 'Storyteller', emoji: '📖', color: '#f59e0b', description: 'Recall story', component: Storyteller2Game },
    { id: 'anagram-challenge', name: 'Anagram', emoji: '✍️', color: '#3b82f6', description: 'Solve anagrams', component: AnagramChallengeGame },
    { id: 'finger-tapping', name: 'Finger Tap', emoji: '👋', color: '#ec4899', description: 'Tap sequence', component: FingerTappingGame },
    { id: 'reaction-time-challenge', name: 'Reaction Time', emoji: '⏱️', color: '#10b981', description: 'React quickly', component: ReactionTimeChallengeGame },
    { id: 'maze-runner-2', name: 'Maze Runner', emoji: '🧭', color: '#a855f7', description: 'Navigate maze', component: MazeRunner2Game },
    { id: 'rhythm-tap-2', name: 'Rhythm Tap', emoji: '🎵', color: '#3b82f6', description: 'Tap to beat', component: RhythmTap2Game },
    { id: 'balance-challenge', name: 'Balance Challenge', emoji: '⚖️', color: '#f97316', description: 'Virtual balance', component: BalanceChallengeGame },
    { id: 'emotion-chart', name: 'Emotion Chart', emoji: '😊', color: '#f43f5e', description: 'Track emotions', component: EmotionChartGame },
    { id: 'self-care-checklist', name: 'Self-Care', emoji: '✅', color: '#10b981', description: 'Self-care plan', component: SelfCareChecklistGame },
    { id: 'gratitude-reflection', name: 'Gratitude', emoji: '✨', color: '#f59e0b', description: 'Reflect positively', component: GratitudeReflectionGame },
    { id: 'mindful-walking', name: 'Mindful Walk', emoji: '👣', color: '#3b82f6', description: 'Walking practice', component: MindfulWalkingGame },
    { id: 'self-compassion', name: 'Self-Compassion', emoji: '☀️', color: '#f59e0b', description: 'Self-kindness', component: SelfCompassionGame },
  ];

  const handleGameSelect = (gameId: string) => {
    if (!isPremiumOrTrial()) {
      // Free tier: limit to 2 games total
      if (!playedGames.has(gameId) && playedGames.size >= 2) {
        Alert.alert(
          'Premium Required',
          'Free users can play 2 games. Upgrade to Premium for unlimited access to all games!',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade', onPress: () => {
              onClose();
              navigation.navigate('Premium' as never);
            }},
          ]
        );
        return;
      }
      setPlayedGames(prev => new Set([...prev, gameId]));
    }
    setActiveGame(gameId);
  };

  const handleGameComplete = (result: GameResult) => {
    setGameHistory(prev => [...prev, result]);
    if (onGameComplete) {
      onGameComplete(result);
    }
    setTimeout(() => {
      setActiveGame(null);
    }, 2000);
  };

  const ActiveGameComponent = activeGame 
    ? games.find(g => g.id === activeGame)?.component 
    : null;

  // Check if game is locked for free users
  const isGameLocked = (gameId: string) => {
    if (isPremiumOrTrial()) return false;
    return !playedGames.has(gameId) && playedGames.size >= 2;
  };

  return (
    <Modal visible={true} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>🎮 Mind Games Hub</Text>
            <Text style={styles.headerSubtitle}>Train focus, reaction & mindfulness</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {ActiveGameComponent ? (
            <ActiveGameComponent onComplete={handleGameComplete} onBack={() => setActiveGame(null)} />
          ) : (
            <>
              <View style={styles.gamesGrid}>
                {games.map((game) => {
                  const locked = isGameLocked(game.id);
                  return (
                    <TouchableOpacity
                      key={game.id}
                      onPress={() => handleGameSelect(game.id)}
                      style={[
                        styles.gameCard,
                        { backgroundColor: game.color },
                        locked && styles.gameCardLocked,
                      ]}
                      disabled={locked}
                    >
                      {locked && (
                        <View style={styles.lockOverlay}>
                          <Text style={styles.lockIcon}>🔒</Text>
                        </View>
                      )}
                      <Text style={styles.gameEmoji}>{game.emoji}</Text>
                      <Text style={styles.gameName}>{game.name}</Text>
                      <Text style={styles.gameDescription}>{game.description}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {gameHistory.length > 0 && (
                <View style={styles.historyContainer}>
                  <Text style={styles.historyTitle}>🏆 Recent Scores</Text>
                  {gameHistory.slice(-5).reverse().map((result, index) => (
                    <View key={index} style={styles.historyItem}>
                      <View>
                        <Text style={styles.historyGame}>{result.game}</Text>
                        {result.reaction_ms && (
                          <Text style={styles.historyDetail}>Reaction: {result.reaction_ms}ms</Text>
                        )}
                        {result.score !== undefined && (
                          <Text style={styles.historyDetail}>Score: {result.score}</Text>
                        )}
                      </View>
                      <Text style={styles.historyIcon}>📈</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

// ==================== CORE GAMES ====================

// Reaction Test Game
const ReactionTestGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [state, setState] = useState<'ready' | 'waiting' | 'now' | 'finished'>('ready');
  const [message, setMessage] = useState('Tap Start to begin');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const startGame = () => {
    setState('waiting');
    setMessage('Wait for green...');
    setReactionTime(null);
    
    const delay = 1000 + Math.random() * 2000;
    timerRef.current = setTimeout(() => {
      setState('now');
      setMessage('Tap Now!');
      startTimeRef.current = Date.now();
    }, delay);
  };

  const handleTap = () => {
    if (state === 'waiting') {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setState('ready');
      setMessage('Too soon! Try again');
      return;
    }

    if (state === 'now' && startTimeRef.current) {
      const reaction = Math.round(Date.now() - startTimeRef.current);
      setReactionTime(reaction);
      setBestTime(prev => prev === null ? reaction : Math.min(prev, reaction));
      setAttempts(prev => prev + 1);
      setState('finished');
      setMessage(`Reaction: ${reaction}ms`);
      
      if (attempts + 1 >= 5) {
        setTimeout(() => {
          onComplete({
            game: 'reaction_test',
            reaction_ms: reaction,
            best_time: bestTime === null ? reaction : Math.min(bestTime || Infinity, reaction),
            attempts: attempts + 1
          });
        }, 1500);
      }
    }
  };

  const reset = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setState('ready');
    setMessage('Tap Start to begin');
    setReactionTime(null);
  };

  const getBgColor = () => {
    if (state === 'now') return '#86efac';
    if (state === 'waiting') return '#fef08a';
    if (state === 'finished') return '#bfdbfe';
    return '#f3f4f6';
  };

  return (
    <View style={styles.gameContainer}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back to Games</Text>
      </TouchableOpacity>
      
      <View style={[styles.reactionBox, { backgroundColor: getBgColor() }]}>
        <Text style={styles.reactionMessage}>{message}</Text>
        {reactionTime && (
          <Text style={styles.reactionTime}>Your reaction: {reactionTime}ms</Text>
        )}
      </View>

      <View style={styles.buttonRow}>
        {state === 'ready' || state === 'finished' ? (
          <TouchableOpacity
            onPress={startGame}
            style={[styles.gameButton, { backgroundColor: '#10b981' }]}
          >
            <Text style={styles.gameButtonText}>{state === 'finished' ? 'Try Again' : 'Start'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleTap}
            style={[styles.gameButton, { backgroundColor: '#10b981' }]}
          >
            <Text style={styles.gameButtonText}>{state === 'waiting' ? 'Wait...' : 'Tap Now!'}</Text>
          </TouchableOpacity>
        )}
        {state === 'finished' && attempts < 5 && (
          <TouchableOpacity
            onPress={reset}
            style={[styles.gameButton, { backgroundColor: '#9ca3af' }]}
          >
            <Text style={styles.gameButtonText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Best Time</Text>
          <Text style={styles.statValue}>
            {bestTime ? `${bestTime}ms` : '--'}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Attempts</Text>
          <Text style={styles.statValue}>{attempts}/5</Text>
        </View>
      </View>

      {attempts >= 5 && (
        <View style={styles.completeCard}>
          <Text style={styles.completeText}>
            Great job! Best time: {bestTime}ms
          </Text>
        </View>
      )}
    </View>
  );
};

// Breathing Game
const BreathingGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'pause'>('inhale');
  const [cycle, setCycle] = useState(0);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const startGame = () => {
    setCycle(0);
    setScore(0);
    setIsPlaying(true);
    setPhase('inhale');
    startBreathingCycle();
  };

  const startBreathingCycle = () => {
    setPhase('inhale');
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.5, duration: 4000, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1.2, duration: 4000, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 4000, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
    ]).start();

    phaseTimerRef.current = setTimeout(() => {
      setPhase('hold');
      phaseTimerRef.current = setTimeout(() => {
        setPhase('exhale');
        phaseTimerRef.current = setTimeout(() => {
          setPhase('pause');
          phaseTimerRef.current = setTimeout(() => {
            const newCycle = cycle + 1;
            setCycle(newCycle);
            setScore(newCycle);
            
            if (newCycle >= 5) {
              setIsPlaying(false);
              setTimeout(() => {
                onComplete({ game: 'breathing', score: newCycle });
              }, 1000);
            } else {
              startBreathingCycle();
            }
          }, 2000);
        }, 4000);
      }, 4000);
    }, 4000);
  };

  const stopGame = () => {
    setIsPlaying(false);
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current);
      phaseTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, []);

  const getPhaseText = () => {
    if (phase === 'inhale') return 'Breathe In';
    if (phase === 'hold') return 'Hold';
    if (phase === 'exhale') return 'Breathe Out';
    return 'Pause';
  };

  const getCircleColor = () => {
    if (phase === 'inhale') return '#bfdbfe';
    if (phase === 'hold') return '#93c5fd';
    if (phase === 'exhale') return '#dbeafe';
    return '#f3f4f6';
  };

  return (
    <View style={styles.gameContainer}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back to Games</Text>
      </TouchableOpacity>
      
      <View style={styles.gameHeader}>
        <Text style={styles.gameTitle}>Breath Match</Text>
        <Text style={styles.gameSubtitle}>Follow the breathing rhythm</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Cycle</Text>
            <Text style={styles.statValue}>{cycle}/5</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Score</Text>
            <Text style={styles.statValue}>{score}</Text>
          </View>
        </View>
      </View>

      {!isPlaying && cycle === 0 && (
        <TouchableOpacity
          onPress={startGame}
          style={[styles.gameButton, { backgroundColor: '#3b82f6' }]}
        >
          <Text style={styles.gameButtonText}>Start Breathing Exercise</Text>
        </TouchableOpacity>
      )}

      <View style={styles.breathingContainer}>
        <Animated.View
          style={[
            styles.breathingCircle,
            { backgroundColor: getCircleColor(), transform: [{ scale: scaleAnim }] }
          ]}
        >
          <Text style={styles.breathingEmoji}>💨</Text>
        </Animated.View>
        <Text style={styles.breathingPhase}>{getPhaseText()}</Text>
      </View>

      {isPlaying && (
        <TouchableOpacity
          onPress={stopGame}
          style={[styles.gameButton, { backgroundColor: '#9ca3af' }]}
        >
          <Text style={styles.gameButtonText}>Stop</Text>
        </TouchableOpacity>
      )}

      {cycle >= 5 && (
        <View style={styles.completeCard}>
          <Text style={styles.completeText}>Complete! You finished 5 breathing cycles</Text>
        </View>
      )}
    </View>
  );
};

// Memory Game
const MemoryGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [isShowing, setIsShowing] = useState(false);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [activeColor, setActiveColor] = useState<number | null>(null);

  const colors = ['#ef4444', '#3b82f6', '#10b981', '#eab308'];

  const startGame = () => {
    setLevel(1);
    setScore(0);
    setGameOver(false);
    generateSequence();
  };

  const generateSequence = () => {
    const newSequence: number[] = [];
    for (let i = 0; i < level + 2; i++) {
      newSequence.push(Math.floor(Math.random() * 4));
    }
    setSequence(newSequence);
    setUserSequence([]);
    showSequence(newSequence);
  };

  const showSequence = (seq: number[]) => {
    setIsShowing(true);
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < seq.length) {
        setActiveColor(seq[index]);
        setTimeout(() => {
          setActiveColor(null);
          index++;
          if (index >= seq.length) {
            clearInterval(interval);
            setIsShowing(false);
          }
        }, 600);
      }
    }, 800);
  };

  const handleColorClick = (colorIndex: number) => {
    if (isShowing || gameOver) return;

    const newUserSequence = [...userSequence, colorIndex];
    setUserSequence(newUserSequence);

    if (newUserSequence[newUserSequence.length - 1] !== sequence[newUserSequence.length - 1]) {
      setGameOver(true);
      setTimeout(() => {
        onComplete({ game: 'memory_path', score: level - 1 });
      }, 2000);
      return;
    }

    if (newUserSequence.length === sequence.length) {
      setScore(level);
      setLevel(level + 1);
      setTimeout(() => generateSequence(), 1000);
    }
  };

  return (
    <View style={styles.gameContainer}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back to Games</Text>
      </TouchableOpacity>
      
      <View style={styles.gameHeader}>
        <Text style={styles.gameTitle}>Memory Path</Text>
        <Text style={styles.gameSubtitle}>Watch the sequence and repeat it</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Level</Text>
            <Text style={styles.statValue}>{level}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Score</Text>
            <Text style={styles.statValue}>{score}</Text>
          </View>
        </View>
      </View>

      {level === 1 && userSequence.length === 0 && !isShowing && !gameOver && (
        <TouchableOpacity
          onPress={startGame}
          style={[styles.gameButton, { backgroundColor: '#a855f7' }]}
        >
          <Text style={styles.gameButtonText}>Start Game</Text>
        </TouchableOpacity>
      )}

      <View style={styles.memoryGrid}>
        {colors.map((color, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleColorClick(index)}
            disabled={isShowing || gameOver}
            style={[
              styles.memoryColor,
              { backgroundColor: color },
              activeColor === index && styles.memoryColorActive,
              (isShowing || gameOver) && styles.memoryColorDisabled
            ]}
          />
        ))}
      </View>

      {gameOver && (
        <View style={styles.completeCard}>
          <Text style={styles.completeText}>Game Over! You reached level {level - 1}</Text>
        </View>
      )}

      {isShowing && (
        <Text style={styles.watchText}>Watch the sequence...</Text>
      )}
    </View>
  );
};

// Balance Game
const BalanceGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [balance, setBalance] = useState(0);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const balanceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = () => {
    setBalance(0);
    setTime(0);
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);

    balanceIntervalRef.current = setInterval(() => {
      setBalance(prev => {
        const drift = (Math.random() - 0.5) * 2;
        return Math.max(-50, Math.min(50, prev + drift));
      });
    }, 50);

    timerRef.current = setInterval(() => {
      setTime(prev => {
        const newTime = prev + 1;
        if (newTime >= 60) {
          endGame(newTime);
          return 60;
        }
        return newTime;
      });
    }, 1000);
  };

  const adjustBalance = (direction: 'left' | 'right') => {
    if (!isPlaying || gameOver) return;
    
    const adjustment = direction === 'left' ? -3 : 3;
    setBalance(prev => {
      const newBalance = prev + adjustment;
      const clamped = Math.max(-50, Math.min(50, newBalance));
      
      if (Math.abs(clamped) >= 45) {
        endGame(time);
      }
      
      return clamped;
    });
  };

  const endGame = (finalTime: number) => {
    setIsPlaying(false);
    setGameOver(true);
    
    if (timerRef.current) clearInterval(timerRef.current);
    if (balanceIntervalRef.current) clearInterval(balanceIntervalRef.current);

    const finalScore = Math.floor(finalTime * 10);
    setScore(finalScore);
    
    setTimeout(() => {
      onComplete({ game: 'balance', score: finalScore, attempts: 1 });
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (balanceIntervalRef.current) clearInterval(balanceIntervalRef.current);
    };
  }, []);

  const getBalanceColor = () => {
    const abs = Math.abs(balance);
    if (abs < 10) return '#10b981';
    if (abs < 25) return '#eab308';
    if (abs < 40) return '#f97316';
    return '#ef4444';
  };

  return (
    <View style={styles.gameContainer}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back to Games</Text>
      </TouchableOpacity>
      
      <View style={styles.gameHeader}>
        <Text style={styles.gameTitle}>Balance</Text>
        <Text style={styles.gameSubtitle}>Keep the ball centered</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Time</Text>
            <Text style={styles.statValue}>{time}s</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Score</Text>
            <Text style={styles.statValue}>{score}</Text>
          </View>
        </View>
      </View>

      {!isPlaying && !gameOver && (
        <TouchableOpacity
          onPress={startGame}
          style={[styles.gameButton, { backgroundColor: '#f97316' }]}
        >
          <Text style={styles.gameButtonText}>Start Game</Text>
        </TouchableOpacity>
      )}

      <View style={styles.balanceBar}>
        <View
          style={[
            styles.balanceBall,
            { backgroundColor: getBalanceColor(), left: `${50 + balance}%` }
          ]}
        />
      </View>

      <Text style={styles.balanceText}>Balance: {Math.abs(balance).toFixed(1)}</Text>
      {Math.abs(balance) >= 40 && (
        <Text style={styles.warningText}>⚠️ Warning! Too extreme!</Text>
      )}

      {isPlaying && !gameOver && (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={() => adjustBalance('left')}
            style={[styles.gameButton, { backgroundColor: '#3b82f6', flex: 1 }]}
          >
            <Text style={styles.gameButtonText}>← Left</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => adjustBalance('right')}
            style={[styles.gameButton, { backgroundColor: '#3b82f6', flex: 1 }]}
          >
            <Text style={styles.gameButtonText}>Right →</Text>
          </TouchableOpacity>
        </View>
      )}

      {gameOver && (
        <View style={styles.completeCard}>
          <Text style={styles.completeText}>Game Over! You balanced for {time} seconds</Text>
          <Text style={styles.completeText}>Final Score: {score}</Text>
        </View>
      )}
    </View>
  );
};

// Placeholder components for remaining games (to be implemented)
const SpotDifferenceGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return (
    <View style={styles.gameContainer}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back to Games</Text>
      </TouchableOpacity>
      <Text style={styles.gameTitle}>Spot the Difference</Text>
      <Text style={styles.gameSubtitle}>Coming soon...</Text>
      <TouchableOpacity
        onPress={() => onComplete({ game: 'spot_difference', score: 0 })}
        style={[styles.gameButton, { backgroundColor: '#6366f1' }]}
      >
        <Text style={styles.gameButtonText}>Complete</Text>
      </TouchableOpacity>
    </View>
  );
};

const SequenceRecallGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return (
    <View style={styles.gameContainer}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back to Games</Text>
      </TouchableOpacity>
      <Text style={styles.gameTitle}>Sequence Recall</Text>
      <Text style={styles.gameSubtitle}>Coming soon...</Text>
      <TouchableOpacity
        onPress={() => onComplete({ game: 'sequence_recall', score: 0 })}
        style={[styles.gameButton, { backgroundColor: '#14b8a6' }]}
      >
        <Text style={styles.gameButtonText}>Complete</Text>
      </TouchableOpacity>
    </View>
  );
};

const FocusFrenzyGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return (
    <View style={styles.gameContainer}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back to Games</Text>
      </TouchableOpacity>
      <Text style={styles.gameTitle}>Focus Frenzy</Text>
      <Text style={styles.gameSubtitle}>Coming soon...</Text>
      <TouchableOpacity
        onPress={() => onComplete({ game: 'focus_frenzy', score: 0 })}
        style={[styles.gameButton, { backgroundColor: '#ec4899' }]}
      >
        <Text style={styles.gameButtonText}>Complete</Text>
      </TouchableOpacity>
    </View>
  );
};

const WaveRiderGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return (
    <View style={styles.gameContainer}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back to Games</Text>
      </TouchableOpacity>
      <Text style={styles.gameTitle}>Wave Rider</Text>
      <Text style={styles.gameSubtitle}>Coming soon...</Text>
      <TouchableOpacity
        onPress={() => onComplete({ game: 'wave_rider', score: 0 })}
        style={[styles.gameButton, { backgroundColor: '#3b82f6' }]}
      >
        <Text style={styles.gameButtonText}>Complete</Text>
      </TouchableOpacity>
    </View>
  );
};

const MoodMeterGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return (
    <View style={styles.gameContainer}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back to Games</Text>
      </TouchableOpacity>
      <Text style={styles.gameTitle}>Mood Meter</Text>
      <Text style={styles.gameSubtitle}>Coming soon...</Text>
      <TouchableOpacity
        onPress={() => onComplete({ game: 'mood_meter', score: 0 })}
        style={[styles.gameButton, { backgroundColor: '#f43f5e' }]}
      >
        <Text style={styles.gameButtonText}>Complete</Text>
      </TouchableOpacity>
    </View>
  );
};

// Placeholder for remaining 28 games
const FocusShiftGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return <View style={styles.gameContainer}><TouchableOpacity onPress={onBack}><Text>← Back</Text></TouchableOpacity><Text>Focus Shift - Coming soon</Text><TouchableOpacity onPress={() => onComplete({ game: 'focus_shift', score: 0 })}><Text>Complete</Text></TouchableOpacity></View>;
};
const VisualFilterGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return <View style={styles.gameContainer}><TouchableOpacity onPress={onBack}><Text>← Back</Text></TouchableOpacity><Text>Visual Filter - Coming soon</Text><TouchableOpacity onPress={() => onComplete({ game: 'visual_filter', score: 0 })}><Text>Complete</Text></TouchableOpacity></View>;
};
const TaskSwitcherGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return <View style={styles.gameContainer}><TouchableOpacity onPress={onBack}><Text>← Back</Text></TouchableOpacity><Text>Task Switcher - Coming soon</Text><TouchableOpacity onPress={() => onComplete({ game: 'task_switcher', score: 0 })}><Text>Complete</Text></TouchableOpacity></View>;
};
const AttentionTrainerGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return <View style={styles.gameContainer}><TouchableOpacity onPress={onBack}><Text>← Back</Text></TouchableOpacity><Text>Attention Trainer - Coming soon</Text><TouchableOpacity onPress={() => onComplete({ game: 'attention_trainer', score: 0 })}><Text>Complete</Text></TouchableOpacity></View>;
};
const ConcentrationChallengeGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return <View style={styles.gameContainer}><TouchableOpacity onPress={onBack}><Text>← Back</Text></TouchableOpacity><Text>Concentration Challenge - Coming soon</Text><TouchableOpacity onPress={() => onComplete({ game: 'concentration_challenge', score: 0 })}><Text>Complete</Text></TouchableOpacity></View>;
};
const BreatheMountainGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return <View style={styles.gameContainer}><TouchableOpacity onPress={onBack}><Text>← Back</Text></TouchableOpacity><Text>Breathe Mountain - Coming soon</Text><TouchableOpacity onPress={() => onComplete({ game: 'breathe_mountain', score: 0 })}><Text>Complete</Text></TouchableOpacity></View>;
};
const RelaxingRipplesGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return <View style={styles.gameContainer}><TouchableOpacity onPress={onBack}><Text>← Back</Text></TouchableOpacity><Text>Relaxing Ripples - Coming soon</Text><TouchableOpacity onPress={() => onComplete({ game: 'relaxing_ripples', score: 0 })}><Text>Complete</Text></TouchableOpacity></View>;
};
const CalmColorsGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return <View style={styles.gameContainer}><TouchableOpacity onPress={onBack}><Text>← Back</Text></TouchableOpacity><Text>Calm Colors - Coming soon</Text><TouchableOpacity onPress={() => onComplete({ game: 'calm_colors', score: 0 })}><Text>Complete</Text></TouchableOpacity></View>;
};
const SoothingSoundscapeGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return <View style={styles.gameContainer}><TouchableOpacity onPress={onBack}><Text>← Back</Text></TouchableOpacity><Text>Soothing Soundscape - Coming soon</Text><TouchableOpacity onPress={() => onComplete({ game: 'soothing_soundscape', score: 0 })}><Text>Complete</Text></TouchableOpacity></View>;
};
const MindfulMomentsGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return <View style={styles.gameContainer}><TouchableOpacity onPress={onBack}><Text>← Back</Text></TouchableOpacity><Text>Mindful Moments - Coming soon</Text><TouchableOpacity onPress={() => onComplete({ game: 'mindful_moments', score: 0 })}><Text>Complete</Text></TouchableOpacity></View>;
};
const MemoryMatrix2Game: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return <View style={styles.gameContainer}><TouchableOpacity onPress={onBack}><Text>← Back</Text></TouchableOpacity><Text>Memory Matrix - Coming soon</Text><TouchableOpacity onPress={() => onComplete({ game: 'memory_matrix_2', score: 0 })}><Text>Complete</Text></TouchableOpacity></View>;
};
const WordScrambleGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return <View style={styles.gameContainer}><TouchableOpacity onPress={onBack}><Text>← Back</Text></TouchableOpacity><Text>Word Scramble - Coming soon</Text><TouchableOpacity onPress={() => onComplete({ game: 'word_scramble', score: 0 })}><Text>Complete</Text></TouchableOpacity></View>;
};
const MathBingo2Game: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return <View style={styles.gameContainer}><TouchableOpacity onPress={onBack}><Text>← Back</Text></TouchableOpacity><Text>Math Bingo - Coming soon</Text><TouchableOpacity onPress={() => onComplete({ game: 'math_bingo_2', score: 0 })}><Text>Complete</Text></TouchableOpacity></View>;
};
const Storyteller2Game: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return <View style={styles.gameContainer}><TouchableOpacity onPress={onBack}><Text>← Back</Text></TouchableOpacity><Text>Storyteller - Coming soon</Text><TouchableOpacity onPress={() => onComplete({ game: 'storyteller_2', score: 0 })}><Text>Complete</Text></TouchableOpacity></View>;
};
const AnagramChallengeGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return <View style={styles.gameContainer}><TouchableOpacity onPress={onBack}><Text>← Back</Text></TouchableOpacity><Text>Anagram Challenge - Coming soon</Text><TouchableOpacity onPress={() => onComplete({ game: 'anagram_challenge', score: 0 })}><Text>Complete</Text></TouchableOpacity></View>;
};
const FingerTappingGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return <View style={styles.gameContainer}><TouchableOpacity onPress={onBack}><Text>← Back</Text></TouchableOpacity><Text>Finger Tapping - Coming soon</Text><TouchableOpacity onPress={() => onComplete({ game: 'finger_tapping', score: 0 })}><Text>Complete</Text></TouchableOpacity></View>;
};
const ReactionTimeChallengeGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return <View style={styles.gameContainer}><TouchableOpacity onPress={onBack}><Text>← Back</Text></TouchableOpacity><Text>Reaction Time Challenge - Coming soon</Text><TouchableOpacity onPress={() => onComplete({ game: 'reaction_time_challenge', score: 0 })}><Text>Complete</Text></TouchableOpacity></View>;
};
const MazeRunner2Game: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return <View style={styles.gameContainer}><TouchableOpacity onPress={onBack}><Text>← Back</Text></TouchableOpacity><Text>Maze Runner - Coming soon</Text><TouchableOpacity onPress={() => onComplete({ game: 'maze_runner_2', score: 0 })}><Text>Complete</Text></TouchableOpacity></View>;
};
const RhythmTap2Game: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return <View style={styles.gameContainer}><TouchableOpacity onPress={onBack}><Text>← Back</Text></TouchableOpacity><Text>Rhythm Tap - Coming soon</Text><TouchableOpacity onPress={() => onComplete({ game: 'rhythm_tap_2', score: 0 })}><Text>Complete</Text></TouchableOpacity></View>;
};
const BalanceChallengeGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return <View style={styles.gameContainer}><TouchableOpacity onPress={onBack}><Text>← Back</Text></TouchableOpacity><Text>Balance Challenge - Coming soon</Text><TouchableOpacity onPress={() => onComplete({ game: 'balance_challenge', score: 0 })}><Text>Complete</Text></TouchableOpacity></View>;
};
const EmotionChartGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return <View style={styles.gameContainer}><TouchableOpacity onPress={onBack}><Text>← Back</Text></TouchableOpacity><Text>Emotion Chart - Coming soon</Text><TouchableOpacity onPress={() => onComplete({ game: 'emotion_chart', score: 0 })}><Text>Complete</Text></TouchableOpacity></View>;
};
const SelfCareChecklistGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return <View style={styles.gameContainer}><TouchableOpacity onPress={onBack}><Text>← Back</Text></TouchableOpacity><Text>Self-Care Checklist - Coming soon</Text><TouchableOpacity onPress={() => onComplete({ game: 'self_care_checklist', score: 0 })}><Text>Complete</Text></TouchableOpacity></View>;
};
const GratitudeReflectionGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return <View style={styles.gameContainer}><TouchableOpacity onPress={onBack}><Text>← Back</Text></TouchableOpacity><Text>Gratitude Reflection - Coming soon</Text><TouchableOpacity onPress={() => onComplete({ game: 'gratitude_reflection', score: 0 })}><Text>Complete</Text></TouchableOpacity></View>;
};
const MindfulWalkingGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return <View style={styles.gameContainer}><TouchableOpacity onPress={onBack}><Text>← Back</Text></TouchableOpacity><Text>Mindful Walking - Coming soon</Text><TouchableOpacity onPress={() => onComplete({ game: 'mindful_walking', score: 0 })}><Text>Complete</Text></TouchableOpacity></View>;
};
const SelfCompassionGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  return <View style={styles.gameContainer}><TouchableOpacity onPress={onBack}><Text>← Back</Text></TouchableOpacity><Text>Self-Compassion - Coming soon</Text><TouchableOpacity onPress={() => onComplete({ game: 'self_compassion', score: 0 })}><Text>Complete</Text></TouchableOpacity></View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#64748b',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  gameCard: {
    position: 'relative',
    width: (width - 60) / 2,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  gameCardLocked: {
    opacity: 0.6,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  lockIcon: {
    fontSize: 32,
  },
  gameEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  gameName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  gameDescription: {
    fontSize: 11,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
  },
  historyContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  historyGame: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  historyDetail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  historyIcon: {
    fontSize: 20,
  },
  gameContainer: {
    padding: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  gameHeader: {
    marginBottom: 24,
    alignItems: 'center',
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  gameSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  statCard: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  gameButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 8,
  },
  gameButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  reactionBox: {
    padding: 48,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    minHeight: 200,
    justifyContent: 'center',
  },
  reactionMessage: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  reactionTime: {
    fontSize: 18,
    color: '#64748b',
  },
  breathingContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  breathingCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  breathingEmoji: {
    fontSize: 64,
  },
  breathingPhase: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  memoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 24,
  },
  memoryColor: {
    width: 120,
    height: 120,
    borderRadius: 12,
    margin: 8,
  },
  memoryColorActive: {
    transform: [{ scale: 1.2 }],
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  memoryColorDisabled: {
    opacity: 0.5,
  },
  watchText: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 16,
  },
  balanceBar: {
    height: 16,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    marginVertical: 24,
    position: 'relative',
  },
  balanceBall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    top: -2,
    transform: [{ translateX: -10 }],
  },
  balanceText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  warningText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
  completeCard: {
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    alignItems: 'center',
  },
  completeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46',
  },
});

export default GamesHub;

