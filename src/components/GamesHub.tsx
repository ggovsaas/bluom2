import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Zap, Wind, Brain, Target, X, Trophy, TrendingUp, Search, List, MousePointer, Waves, Heart, RefreshCw, Eye, Layers, Clock, Mountain, Droplets, Palette, Music, Focus, Grid3x3, Shuffle, Calculator, BookOpen, Type, Hand, Timer, Navigation, Music2, Activity, Smile, CheckSquare, Sparkles, Footprints, Sun } from 'lucide-react';

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
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);

  const games = [
    {
      id: 'reaction',
      name: 'Wait for Green',
      icon: Zap,
      color: 'from-green-500 to-emerald-600',
      description: 'Test your reaction time and impulse control',
      component: ReactionTestGame
    },
    {
      id: 'breathing',
      name: 'Breath Match',
      icon: Wind,
      color: 'from-blue-400 to-cyan-500',
      description: 'Match your breathing with the animation',
      component: BreathingGame
    },
    {
      id: 'memory',
      name: 'Memory Path',
      icon: Brain,
      color: 'from-purple-500 to-pink-600',
      description: 'Remember and repeat the sequence',
      component: MemoryGame
    },
    {
      id: 'balance',
      name: 'Balance',
      icon: Target,
      color: 'from-orange-500 to-red-600',
      description: 'Keep calm and centered under pressure',
      component: BalanceGame
    },
    {
      id: 'spot-difference',
      name: 'Spot the Difference',
      icon: Search,
      color: 'from-indigo-500 to-blue-600',
      description: 'Find subtle changes in patterns',
      component: SpotDifferenceGame
    },
    {
      id: 'sequence-recall',
      name: 'Sequence Recall',
      icon: List,
      color: 'from-teal-500 to-cyan-600',
      description: 'Remember number sequences',
      component: SequenceRecallGame
    },
    {
      id: 'focus-frenzy',
      name: 'Focus Frenzy',
      icon: MousePointer,
      color: 'from-pink-500 to-rose-600',
      description: 'Click targets quickly',
      component: FocusFrenzyGame
    },
    {
      id: 'wave-rider',
      name: 'Wave Rider',
      icon: Waves,
      color: 'from-blue-500 to-indigo-600',
      description: 'Breathe with ocean waves',
      component: WaveRiderGame
    },
    {
      id: 'mood-meter',
      name: 'Mood Meter',
      icon: Heart,
      color: 'from-rose-500 to-pink-600',
      description: 'Track and regulate emotions',
      component: MoodMeterGame
    },
    // Attention & Focus
    {
      id: 'focus-shift',
      name: 'Focus Shift',
      icon: RefreshCw,
      color: 'from-cyan-500 to-blue-600',
      description: 'Switch between tasks',
      component: FocusShiftGame
    },
    {
      id: 'visual-filter',
      name: 'Visual Filter',
      icon: Eye,
      color: 'from-violet-500 to-purple-600',
      description: 'Find patterns in distractions',
      component: VisualFilterGame
    },
    {
      id: 'task-switcher',
      name: 'Task Switcher',
      icon: Layers,
      color: 'from-indigo-500 to-blue-600',
      description: 'Quick task switching',
      component: TaskSwitcherGame
    },
    {
      id: 'attention-trainer',
      name: 'Attention Trainer',
      icon: MousePointer,
      color: 'from-pink-500 to-rose-600',
      description: 'Click targets in crowded scene',
      component: AttentionTrainerGame
    },
    {
      id: 'concentration-challenge',
      name: 'Concentration Challenge',
      icon: Clock,
      color: 'from-amber-500 to-orange-600',
      description: 'Focus for increasing time',
      component: ConcentrationChallengeGame
    },
    // Breathing & Relaxation
    {
      id: 'breathe-mountain',
      name: 'Breathe Mountain',
      icon: Mountain,
      color: 'from-emerald-500 to-green-600',
      description: 'Breathe with mountain landscape',
      component: BreatheMountainGame
    },
    {
      id: 'relaxing-ripples',
      name: 'Relaxing Ripples',
      icon: Droplets,
      color: 'from-blue-400 to-cyan-500',
      description: 'Create ripples with breathing',
      component: RelaxingRipplesGame
    },
    {
      id: 'calm-colors',
      name: 'Calm Colors',
      icon: Palette,
      color: 'from-pink-400 to-purple-500',
      description: 'Change colors with breath',
      component: CalmColorsGame
    },
    {
      id: 'soothing-soundscape',
      name: 'Soothing Soundscape',
      icon: Music,
      color: 'from-teal-400 to-green-500',
      description: 'Create peaceful sounds',
      component: SoothingSoundscapeGame
    },
    {
      id: 'mindful-moments',
      name: 'Mindful Moments',
      icon: Focus,
      color: 'from-indigo-400 to-blue-500',
      description: 'Focus on present moment',
      component: MindfulMomentsGame
    },
    // Memory & Cognition
    {
      id: 'memory-matrix-2',
      name: 'Memory Matrix 2.0',
      icon: Grid3x3,
      color: 'from-purple-500 to-pink-600',
      description: 'Remember grid positions',
      component: MemoryMatrix2Game
    },
    {
      id: 'word-scramble',
      name: 'Word Scramble',
      icon: Shuffle,
      color: 'from-orange-500 to-red-600',
      description: 'Unscramble words',
      component: WordScrambleGame
    },
    {
      id: 'math-bingo-2',
      name: 'Math Bingo 2.0',
      icon: Calculator,
      color: 'from-green-500 to-emerald-600',
      description: 'Solve math for bingo',
      component: MathBingo2Game
    },
    {
      id: 'storyteller-2',
      name: 'Storyteller 2.0',
      icon: BookOpen,
      color: 'from-amber-500 to-yellow-600',
      description: 'Recall and add to story',
      component: Storyteller2Game
    },
    {
      id: 'anagram-challenge',
      name: 'Anagram Challenge',
      icon: Type,
      color: 'from-blue-500 to-indigo-600',
      description: 'Solve anagrams quickly',
      component: AnagramChallengeGame
    },
    // Motor Control & Coordination
    {
      id: 'finger-tapping',
      name: 'Finger Tapping',
      icon: Hand,
      color: 'from-pink-500 to-rose-600',
      description: 'Tap fingers in sequence',
      component: FingerTappingGame
    },
    {
      id: 'reaction-time-challenge',
      name: 'Reaction Time Challenge',
      icon: Timer,
      color: 'from-green-500 to-emerald-600',
      description: 'React to cues quickly',
      component: ReactionTimeChallengeGame
    },
    {
      id: 'maze-runner-2',
      name: 'Maze Runner 2.0',
      icon: Navigation,
      color: 'from-purple-500 to-pink-600',
      description: 'Navigate mazes precisely',
      component: MazeRunner2Game
    },
    {
      id: 'rhythm-tap-2',
      name: 'Rhythm Tap 2.0',
      icon: Music2,
      color: 'from-blue-500 to-cyan-600',
      description: 'Tap to changing beats',
      component: RhythmTap2Game
    },
    {
      id: 'balance-challenge',
      name: 'Balance Challenge',
      icon: Activity,
      color: 'from-orange-500 to-red-600',
      description: 'Balance on virtual beam',
      component: BalanceChallengeGame
    },
    // Emotional Regulation
    {
      id: 'emotion-chart',
      name: 'Emotion Chart',
      icon: Smile,
      color: 'from-rose-500 to-pink-600',
      description: 'Track and identify emotions',
      component: EmotionChartGame
    },
    {
      id: 'self-care-checklist',
      name: 'Self-Care Checklist',
      icon: CheckSquare,
      color: 'from-green-500 to-emerald-600',
      description: 'Create self-care plan',
      component: SelfCareChecklistGame
    },
    {
      id: 'gratitude-reflection',
      name: 'Gratitude Reflection',
      icon: Sparkles,
      color: 'from-yellow-500 to-orange-600',
      description: 'Reflect on positive experiences',
      component: GratitudeReflectionGame
    },
    {
      id: 'mindful-walking',
      name: 'Mindful Walking',
      icon: Footprints,
      color: 'from-blue-500 to-indigo-600',
      description: 'Practice mindful walking',
      component: MindfulWalkingGame
    },
    {
      id: 'self-compassion',
      name: 'Self-Compassion',
      icon: Sun,
      color: 'from-amber-500 to-yellow-600',
      description: 'Practice self-kindness',
      component: SelfCompassionGame
    },
  ];

  const handleGameComplete = (result: GameResult) => {
    setGameHistory(prev => [...prev, result]);
    if (onGameComplete) {
      onGameComplete(result);
    }
    // Auto-close after showing result for 2 seconds
    setTimeout(() => {
      setActiveGame(null);
    }, 2000);
  };

  const ActiveGameComponent = activeGame 
    ? games.find(g => g.id === activeGame)?.component 
    : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">🎮 Mind Games Hub</h2>
            <p className="text-sm text-gray-600">Train your focus, reaction, and mindfulness</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {ActiveGameComponent ? (
            <ActiveGameComponent onComplete={handleGameComplete} onBack={() => setActiveGame(null)} />
          ) : (
            <>
              {/* Games Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {games.map((game) => {
                  const IconComponent = game.icon;
                  return (
                    <motion.button
                      key={game.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveGame(game.id)}
                      className={`bg-gradient-to-br ${game.color} text-white p-6 rounded-xl hover:shadow-lg transition-all`}
                    >
                      <IconComponent className="mx-auto mb-3" size={32} />
                      <p className="font-semibold text-sm mb-1">{game.name}</p>
                      <p className="text-xs opacity-90">{game.description}</p>
                    </motion.button>
                  );
                })}
              </div>

              {/* Game History */}
              {gameHistory.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="text-yellow-600" size={20} />
                    <h3 className="font-semibold text-gray-800">Recent Scores</h3>
                  </div>
                  <div className="space-y-2">
                    {gameHistory.slice(-5).reverse().map((result, index) => (
                      <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3">
                        <div>
                          <p className="font-medium text-gray-800">{result.game}</p>
                          {result.reaction_ms && (
                            <p className="text-xs text-gray-600">Reaction: {result.reaction_ms}ms</p>
                          )}
                          {result.score !== undefined && (
                            <p className="text-xs text-gray-600">Score: {result.score}</p>
                          )}
                        </div>
                        <TrendingUp className="text-green-600" size={20} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// Reaction Test Game
const ReactionTestGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [state, setState] = useState<'ready' | 'waiting' | 'now' | 'finished'>('ready');
  const [message, setMessage] = useState('Click Start to begin');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [results, setResults] = useState<number[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const startGame = () => {
    setState('waiting');
    setMessage('Wait for green...');
    setReactionTime(null);
    
    const delay = 1000 + Math.random() * 2000;
    timerRef.current = setTimeout(() => {
      setState('now');
      setMessage('Click Now!');
      startTimeRef.current = performance.now();
    }, delay);
  };

  const handleClick = () => {
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
      const reaction = Math.round(performance.now() - startTimeRef.current);
      setReactionTime(reaction);
      setBestTime(prev => prev === null ? reaction : Math.min(prev, reaction));
      setAttempts(prev => prev + 1);
      setResults(prev => [...prev, reaction]);
      setState('finished');
      setMessage(`Reaction: ${reaction}ms`);
      
      if (attempts + 1 >= 5) {
        setTimeout(() => {
          onComplete({
            game: 'reaction_test',
            reaction_ms: reaction,
            best_time: bestTime === null ? reaction : Math.min(bestTime, reaction),
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
    setMessage('Click Start to begin');
    setReactionTime(null);
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">
        ← Back to Games
      </button>
      
      <div className={`p-12 rounded-xl text-center transition-all ${
        state === 'now' ? 'bg-green-200' : 
        state === 'waiting' ? 'bg-yellow-100' : 
        state === 'finished' ? 'bg-blue-100' : 
        'bg-gray-100'
      }`}>
        <p className="text-3xl font-bold mb-2">{message}</p>
        {reactionTime && (
          <p className="text-xl text-gray-700">Your reaction: {reactionTime}ms</p>
        )}
      </div>

      <div className="flex gap-2 justify-center">
        {state === 'ready' || state === 'finished' ? (
          <button
            onClick={startGame}
            className="px-8 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
          >
            {state === 'finished' ? 'Try Again' : 'Start'}
          </button>
        ) : (
          <button
            onClick={handleClick}
            className="px-8 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
          >
            {state === 'waiting' ? 'Wait...' : 'Click Now!'}
          </button>
        )}
        {state === 'finished' && attempts < 5 && (
          <button
            onClick={reset}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-indigo-50 rounded-xl p-4">
          <p className="text-sm text-gray-600">Best Time</p>
          <p className="text-3xl font-bold text-indigo-600">
            {bestTime ? `${bestTime}ms` : '--'}
          </p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <p className="text-sm text-gray-600">Attempts</p>
          <p className="text-3xl font-bold text-purple-600">{attempts}/5</p>
        </div>
      </div>

      {attempts >= 5 && (
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-lg font-medium text-green-800">
            Great job! Best time: {bestTime}ms
          </p>
        </div>
      )}
    </div>
  );
};

// Breathing Game
const BreathingGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'pause'>('inhale');
  const [cycle, setCycle] = useState(0);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = () => {
    setCycle(0);
    setScore(0);
    setIsPlaying(true);
    setPhase('inhale');
    startBreathingCycle();
  };

  const startBreathingCycle = () => {
    // Inhale: 4 seconds
    setPhase('inhale');
    phaseTimerRef.current = setTimeout(() => {
      // Hold: 4 seconds
      setPhase('hold');
      phaseTimerRef.current = setTimeout(() => {
        // Exhale: 4 seconds
        setPhase('exhale');
        phaseTimerRef.current = setTimeout(() => {
          // Pause: 2 seconds
          setPhase('pause');
          phaseTimerRef.current = setTimeout(() => {
            const newCycle = cycle + 1;
            setCycle(newCycle);
            setScore(newCycle);
            
            if (newCycle >= 5) {
              // Complete
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

  const getCircleSize = () => {
    if (phase === 'inhale') return 'scale-125';
    if (phase === 'hold') return 'scale-110';
    if (phase === 'exhale') return 'scale-75';
    return 'scale-100';
  };

  const getCircleColor = () => {
    if (phase === 'inhale') return 'bg-blue-200';
    if (phase === 'hold') return 'bg-blue-300';
    if (phase === 'exhale') return 'bg-blue-100';
    return 'bg-gray-100';
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">
        ← Back to Games
      </button>
      
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Breath Match</h3>
        <p className="text-gray-600 mb-2">Follow the breathing rhythm</p>
        <div className="flex justify-center gap-4">
          <div className="bg-blue-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Cycle</p>
            <p className="text-xl font-bold text-blue-600">{cycle}/5</p>
          </div>
          <div className="bg-indigo-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-xl font-bold text-indigo-600">{score}</p>
          </div>
        </div>
      </div>

      {!isPlaying && cycle === 0 && (
        <button
          onClick={startGame}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          Start Breathing Exercise
        </button>
      )}

      <div className="text-center">
        <div className={`w-48 h-48 mx-auto rounded-full flex items-center justify-center transition-all duration-1000 ${getCircleColor()} ${getCircleSize()}`}>
          <Wind size={64} className="text-blue-600" />
        </div>
        <p className="text-2xl font-bold mt-6">
          {phase === 'inhale' ? 'Breathe In' : 
           phase === 'hold' ? 'Hold' : 
           phase === 'exhale' ? 'Breathe Out' : 
           'Pause'}
        </p>
        {isPlaying && (
          <button
            onClick={stopGame}
            className="mt-4 px-6 py-2 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
          >
            Stop
          </button>
        )}
      </div>

      {cycle >= 5 && (
        <div className="text-center bg-green-50 rounded-xl p-4">
          <p className="text-lg font-bold text-green-800">Complete!</p>
          <p className="text-gray-600">You completed 5 breathing cycles</p>
        </div>
      )}
    </div>
  );
};

// Memory Path Game
const MemoryGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [isShowing, setIsShowing] = useState(false);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];
  const [activeColor, setActiveColor] = useState<number | null>(null);

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

    // Check if correct
    if (newUserSequence[newUserSequence.length - 1] !== sequence[newUserSequence.length - 1]) {
      // Wrong! Game over
      setGameOver(true);
      setTimeout(() => {
        onComplete({ game: 'memory_path', score: level - 1 });
      }, 2000);
      return;
    }

    // Check if sequence complete
    if (newUserSequence.length === sequence.length) {
      // Level complete!
      setScore(level);
      setLevel(level + 1);
      setTimeout(() => generateSequence(), 1000);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">
        ← Back to Games
      </button>
      
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Memory Path</h3>
        <p className="text-gray-600 mb-2">Watch the sequence and repeat it</p>
        <div className="flex justify-center gap-4">
          <div className="bg-purple-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Level</p>
            <p className="text-xl font-bold text-purple-600">{level}</p>
          </div>
          <div className="bg-indigo-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-xl font-bold text-indigo-600">{score}</p>
          </div>
        </div>
      </div>

      {level === 1 && userSequence.length === 0 && !isShowing && !gameOver && (
        <button
          onClick={startGame}
          className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
        >
          Start Game
        </button>
      )}

      <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
        {colors.map((color, index) => (
          <button
            key={index}
            onClick={() => handleColorClick(index)}
            disabled={isShowing || gameOver}
            className={`${color} h-24 rounded-xl transition-all ${
              activeColor === index ? 'scale-110 ring-4 ring-white' : ''
            } ${isShowing || gameOver ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
          />
        ))}
      </div>

      {gameOver && (
        <div className="text-center bg-red-50 rounded-xl p-4">
          <p className="text-lg font-bold text-red-800">Game Over!</p>
          <p className="text-gray-600">You reached level {level - 1}</p>
        </div>
      )}

      {isShowing && (
        <div className="text-center">
          <p className="text-gray-600">Watch the sequence...</p>
        </div>
      )}
    </div>
  );
};

// Balance Game
const BalanceGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [balance, setBalance] = useState(0); // -50 to +50
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

    // Balance drifts randomly
    balanceIntervalRef.current = setInterval(() => {
      setBalance(prev => {
        const drift = (Math.random() - 0.5) * 2; // -1 to +1
        const newBalance = prev + drift;
        // Keep balance between -50 and +50
        return Math.max(-50, Math.min(50, newBalance));
      });
    }, 50);

    // Timer
    timerRef.current = setInterval(() => {
      setTime(prev => {
        const newTime = prev + 1;
        if (newTime >= 60) {
          // Game complete after 60 seconds
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
      
      // Check if balance is too extreme (game over)
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
    if (abs < 10) return 'bg-green-500';
    if (abs < 25) return 'bg-yellow-500';
    if (abs < 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">
        ← Back to Games
      </button>
      
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Balance</h3>
        <p className="text-gray-600 mb-2">Keep the ball centered with gentle taps</p>
        <div className="flex justify-center gap-4">
          <div className="bg-orange-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Time</p>
            <p className="text-xl font-bold text-orange-600">{time}s</p>
          </div>
          <div className="bg-indigo-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-xl font-bold text-indigo-600">{score}</p>
          </div>
        </div>
      </div>

      {!isPlaying && !gameOver && (
        <button
          onClick={startGame}
          className="w-full py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors"
        >
          Start Game
        </button>
      )}

      {/* Balance Bar */}
      <div className="bg-gray-200 rounded-full h-4 relative overflow-hidden">
        <div
          className={`${getBalanceColor()} h-4 rounded-full transition-all duration-100`}
          style={{
            width: '20px',
            marginLeft: `${50 + balance}%`,
            transform: 'translateX(-50%)'
          }}
        />
      </div>

      {/* Balance Indicator */}
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">Balance: {Math.abs(balance).toFixed(1)}</p>
        {Math.abs(balance) >= 40 && (
          <p className="text-red-600 font-medium">⚠️ Warning! Too extreme!</p>
        )}
      </div>

      {/* Control Buttons */}
      {isPlaying && !gameOver && (
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => adjustBalance('left')}
            className="px-8 py-4 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            ← Left
          </button>
          <button
            onClick={() => adjustBalance('right')}
            className="px-8 py-4 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            Right →
          </button>
        </div>
      )}

      {gameOver && (
        <div className="text-center bg-orange-50 rounded-xl p-4">
          <p className="text-lg font-bold text-orange-800">Game Over!</p>
          <p className="text-gray-600">You balanced for {time} seconds</p>
          <p className="text-gray-600">Final Score: {score}</p>
        </div>
      )}
    </div>
  );
};

// Spot the Difference Game
const SpotDifferenceGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [differences, setDifferences] = useState<number[]>([]);
  const [found, setFound] = useState<number[]>([]);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const gridSize = 4 + level;
  const totalDifferences = 3 + level;

  const startGame = () => {
    setLevel(1);
    setScore(0);
    setTimeLeft(60);
    setFound([]);
    setIsPlaying(true);
    generateDifferences();
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const generateDifferences = () => {
    const newDiffs: number[] = [];
    while (newDiffs.length < totalDifferences) {
      const pos = Math.floor(Math.random() * (gridSize * gridSize));
      if (!newDiffs.includes(pos)) {
        newDiffs.push(pos);
      }
    }
    setDifferences(newDiffs);
  };

  const handleCellClick = (index: number) => {
    if (!isPlaying || found.includes(index)) return;

    if (differences.includes(index)) {
      setFound(prev => [...prev, index]);
      setScore(prev => prev + 10);
      
      if (found.length + 1 === totalDifferences) {
        const newLevel = level + 1;
        setLevel(newLevel);
        setFound([]);
        setTimeout(() => generateDifferences(), 1000);
      }
    } else {
      setScore(prev => Math.max(0, prev - 5));
    }
  };

  const endGame = () => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => {
      onComplete({ game: 'spot_difference', score, attempts: level });
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">
        ← Back to Games
      </button>
      
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Spot the Difference</h3>
        <p className="text-gray-600 mb-2">Find the different squares</p>
        <div className="flex justify-center gap-4">
          <div className="bg-indigo-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Level</p>
            <p className="text-xl font-bold text-indigo-600">{level}</p>
          </div>
          <div className="bg-blue-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-xl font-bold text-blue-600">{score}</p>
          </div>
          <div className="bg-purple-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Time</p>
            <p className="text-xl font-bold text-purple-600">{timeLeft}s</p>
          </div>
        </div>
      </div>

      {!isPlaying && level === 1 && (
        <button
          onClick={startGame}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          Start Game
        </button>
      )}

      {isPlaying && (
        <>
          <div className="text-center mb-2">
            <p className="text-sm text-gray-600">
              Found: {found.length} / {totalDifferences}
            </p>
          </div>
          <div className="grid gap-2 mx-auto" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, maxWidth: '400px' }}>
            {Array.from({ length: gridSize * gridSize }).map((_, index) => {
              const isDifferent = differences.includes(index);
              const isFound = found.includes(index);
              
              return (
                <button
                  key={index}
                  onClick={() => handleCellClick(index)}
                  className={`aspect-square rounded-lg transition-all ${
                    isFound ? 'bg-green-500' : 
                    isDifferent ? 'bg-yellow-300 hover:bg-yellow-400' : 
                    'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {isFound && '✓'}
                </button>
              );
            })}
          </div>
        </>
      )}

      {!isPlaying && level > 1 && (
        <div className="text-center bg-indigo-50 rounded-xl p-4">
          <p className="text-lg font-bold text-indigo-800">Game Over!</p>
          <p className="text-gray-600">Final Score: {score}</p>
          <p className="text-gray-600">Level Reached: {level - 1}</p>
        </div>
      )}
    </div>
  );
};

// Sequence Recall Game
const SequenceRecallGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [isShowing, setIsShowing] = useState(false);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const startGame = () => {
    setLevel(1);
    setScore(0);
    setGameOver(false);
    generateSequence();
  };

  const generateSequence = () => {
    const length = 3 + level;
    const newSequence: number[] = [];
    for (let i = 0; i < length; i++) {
      newSequence.push(Math.floor(Math.random() * 9) + 1);
    }
    setSequence(newSequence);
    setUserInput([]);
    setCurrentIndex(0);
    showSequence(newSequence);
  };

  const showSequence = (seq: number[]) => {
    setIsShowing(true);
    let index = 0;
    
    const interval = setInterval(() => {
      setCurrentIndex(index);
      index++;
      if (index >= seq.length) {
        clearInterval(interval);
        setIsShowing(false);
        setCurrentIndex(-1);
      }
    }, 800);
  };

  const handleNumberClick = (num: number) => {
    if (isShowing || gameOver) return;

    const newInput = [...userInput, num];
    setUserInput(newInput);

    if (newInput[newInput.length - 1] !== sequence[newInput.length - 1]) {
      setGameOver(true);
      setTimeout(() => {
        onComplete({ game: 'sequence_recall', score: level - 1 });
      }, 2000);
      return;
    }

    if (newInput.length === sequence.length) {
      setScore(level);
      setLevel(level + 1);
      setTimeout(() => generateSequence(), 1000);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">
        ← Back to Games
      </button>
      
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Sequence Recall</h3>
        <p className="text-gray-600 mb-2">Watch and repeat the number sequence</p>
        <div className="flex justify-center gap-4">
          <div className="bg-teal-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Level</p>
            <p className="text-xl font-bold text-teal-600">{level}</p>
          </div>
          <div className="bg-cyan-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-xl font-bold text-cyan-600">{score}</p>
          </div>
        </div>
      </div>

      {level === 1 && userInput.length === 0 && !isShowing && !gameOver && (
        <button
          onClick={startGame}
          className="w-full py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
        >
          Start Game
        </button>
      )}

      {isShowing && currentIndex >= 0 && (
        <div className="text-center py-8">
          <div className="text-6xl font-bold text-teal-600 mb-4">
            {sequence[currentIndex]}
          </div>
          <p className="text-gray-600">Watch the sequence...</p>
        </div>
      )}

      {!isShowing && !gameOver && (
        <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              className="aspect-square bg-teal-100 hover:bg-teal-200 rounded-xl font-bold text-xl text-teal-700 transition-colors"
            >
              {num}
            </button>
          ))}
        </div>
      )}

      {userInput.length > 0 && !isShowing && (
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Your input:</p>
          <div className="flex gap-2 justify-center">
            {userInput.map((num, idx) => (
              <span key={idx} className="text-2xl font-bold text-teal-600">{num}</span>
            ))}
          </div>
        </div>
      )}

      {gameOver && (
        <div className="text-center bg-red-50 rounded-xl p-4">
          <p className="text-lg font-bold text-red-800">Game Over!</p>
          <p className="text-gray-600">You reached level {level - 1}</p>
        </div>
      )}
    </div>
  );
};

// Focus Frenzy Game
const FocusFrenzyGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [targets, setTargets] = useState<{ id: number; x: number; y: number; type: 'target' | 'distraction' }[]>([]);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = () => {
    setScore(0);
    setMisses(0);
    setTimeLeft(30);
    setTargets([]);
    setIsPlaying(true);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    spawnTargets();
  };

  const spawnTargets = () => {
    if (!isPlaying) return;

    const newTarget = {
      id: Date.now(),
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      type: Math.random() > 0.3 ? 'target' : 'distraction' as 'target' | 'distraction'
    };

    setTargets(prev => [...prev, newTarget].slice(-10));

    spawnTimerRef.current = setTimeout(() => {
      spawnTargets();
    }, 1500 - (score * 10));
  };

  const handleClick = (target: { id: number; type: 'target' | 'distraction' }) => {
    if (!isPlaying) return;

    if (target.type === 'target') {
      setScore(prev => prev + 10);
      setTargets(prev => prev.filter(t => t.id !== target.id));
    } else {
      setMisses(prev => prev + 1);
      setTargets(prev => prev.filter(t => t.id !== target.id));
      if (misses + 1 >= 5) {
        endGame();
      }
    }
  };

  const endGame = () => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    setTimeout(() => {
      onComplete({ game: 'focus_frenzy', score, attempts: 1 });
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">
        ← Back to Games
      </button>
      
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Focus Frenzy</h3>
        <p className="text-gray-600 mb-2">Click only the green circles!</p>
        <div className="flex justify-center gap-4">
          <div className="bg-pink-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-xl font-bold text-pink-600">{score}</p>
          </div>
          <div className="bg-rose-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Time</p>
            <p className="text-xl font-bold text-rose-600">{timeLeft}s</p>
          </div>
          <div className="bg-red-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Misses</p>
            <p className="text-xl font-bold text-red-600">{misses}/5</p>
          </div>
        </div>
      </div>

      {!isPlaying && (
        <button
          onClick={startGame}
          className="w-full py-3 bg-pink-600 text-white rounded-xl font-medium hover:bg-pink-700 transition-colors"
        >
          Start Game
        </button>
      )}

      {isPlaying && (
        <div className="relative bg-gray-100 rounded-xl h-96 overflow-hidden">
          {targets.map(target => (
            <button
              key={target.id}
              onClick={() => handleClick(target)}
              className={`absolute w-12 h-12 rounded-full transition-all ${
                target.type === 'target' 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-red-500 hover:bg-red-600'
              }`}
              style={{
                left: `${target.x}%`,
                top: `${target.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}
        </div>
      )}

      {!isPlaying && score > 0 && (
        <div className="text-center bg-pink-50 rounded-xl p-4">
          <p className="text-lg font-bold text-pink-800">Game Over!</p>
          <p className="text-gray-600">Final Score: {score}</p>
        </div>
      )}
    </div>
  );
};

// Wave Rider Game
const WaveRiderGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'pause'>('inhale');
  const [cycle, setCycle] = useState(0);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [waveHeight, setWaveHeight] = useState(50);

  const startGame = () => {
    setCycle(0);
    setScore(0);
    setIsPlaying(true);
    setPhase('inhale');
    startBreathingCycle();
  };

  const startBreathingCycle = () => {
    setPhase('inhale');
    setWaveHeight(20);
    let currentHeight = 20;
    const inhaleInterval = setInterval(() => {
      currentHeight += 2;
      setWaveHeight(currentHeight);
      if (currentHeight >= 80) {
        clearInterval(inhaleInterval);
      }
    }, 100);

    phaseTimerRef.current = setTimeout(() => {
      setPhase('hold');
      clearInterval(inhaleInterval);
      
      phaseTimerRef.current = setTimeout(() => {
        setPhase('exhale');
        let exhaleHeight = 80;
        const exhaleInterval = setInterval(() => {
          exhaleHeight -= 2;
          setWaveHeight(exhaleHeight);
          if (exhaleHeight <= 20) {
            clearInterval(exhaleInterval);
          }
        }, 100);

        phaseTimerRef.current = setTimeout(() => {
          setPhase('pause');
          clearInterval(exhaleInterval);
          
          phaseTimerRef.current = setTimeout(() => {
            const newCycle = cycle + 1;
            setCycle(newCycle);
            setScore(newCycle);
            
            if (newCycle >= 5) {
              setIsPlaying(false);
              setTimeout(() => {
                onComplete({ game: 'wave_rider', score: newCycle });
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

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">
        ← Back to Games
      </button>
      
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Wave Rider</h3>
        <p className="text-gray-600 mb-2">Breathe with the ocean waves</p>
        <div className="flex justify-center gap-4">
          <div className="bg-blue-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Cycle</p>
            <p className="text-xl font-bold text-blue-600">{cycle}/5</p>
          </div>
          <div className="bg-indigo-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-xl font-bold text-indigo-600">{score}</p>
          </div>
        </div>
      </div>

      {!isPlaying && cycle === 0 && (
        <button
          onClick={startGame}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          Start Breathing Exercise
        </button>
      )}

      <div className="relative bg-gradient-to-b from-blue-300 to-blue-600 rounded-xl h-64 overflow-hidden">
        <div
          className="absolute bottom-0 left-0 right-0 bg-white opacity-20 transition-all duration-1000"
          style={{
            height: `${waveHeight}%`,
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 80%)'
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Waves size={64} className="text-white opacity-50" />
        </div>
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white">
          <p className="text-2xl font-bold">
            {phase === 'inhale' ? 'Breathe In' : 
             phase === 'hold' ? 'Hold' : 
             phase === 'exhale' ? 'Breathe Out' : 
             'Pause'}
          </p>
        </div>
      </div>

      {isPlaying && (
        <button
          onClick={stopGame}
          className="w-full px-6 py-2 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
        >
          Stop
        </button>
      )}

      {cycle >= 5 && (
        <div className="text-center bg-blue-50 rounded-xl p-4">
          <p className="text-lg font-bold text-blue-800">Complete!</p>
          <p className="text-gray-600">You completed 5 breathing cycles</p>
        </div>
      )}
    </div>
  );
};

// Mood Meter Game
const MoodMeterGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [currentMood, setCurrentMood] = useState<{ valence: number; arousal: number } | null>(null);
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [moods, setMoods] = useState<{ mood: string; timestamp: Date }[]>([]);
  const [exercises, setExercises] = useState<string[]>([]);
  const [showExercise, setShowExercise] = useState(false);

  const moodLabels = [
    { name: 'Calm', valence: 0.5, arousal: 0.2, color: 'bg-blue-500' },
    { name: 'Happy', valence: 0.8, arousal: 0.6, color: 'bg-yellow-500' },
    { name: 'Excited', valence: 0.9, arousal: 0.9, color: 'bg-orange-500' },
    { name: 'Anxious', valence: 0.2, arousal: 0.8, color: 'bg-red-500' },
    { name: 'Sad', valence: 0.2, arousal: 0.3, color: 'bg-purple-500' },
    { name: 'Neutral', valence: 0.5, arousal: 0.5, color: 'bg-gray-500' },
  ];

  const moodExercises: { [key: string]: string[] } = {
    'Anxious': ['Take 5 deep breaths', 'Try a 5-minute meditation', 'Go for a walk'],
    'Sad': ['Write 3 things you\'re grateful for', 'Listen to uplifting music', 'Call a friend'],
    'Excited': ['Practice grounding exercises', 'Take a moment to breathe', 'Write down your thoughts'],
    'Happy': ['Share your joy with someone', 'Practice gratitude', 'Savor this moment'],
    'Calm': ['Maintain this peaceful state', 'Practice mindfulness', 'Enjoy the present'],
    'Neutral': ['Check in with yourself', 'Take a mindful break', 'Practice self-awareness'],
  };

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    const moodData = moodLabels.find(m => m.name === mood);
    if (moodData) {
      setCurrentMood({ valence: moodData.valence, arousal: moodData.arousal });
      setMoods(prev => [...prev, { mood, timestamp: new Date() }]);
      
      if (moodExercises[mood]) {
        setExercises(moodExercises[mood]);
        setShowExercise(true);
      }
    }
  };

  const completeSession = () => {
    const score = moods.length * 10;
    onComplete({ game: 'mood_meter', score, attempts: moods.length });
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">
        ← Back to Games
      </button>
      
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Mood Meter</h3>
        <p className="text-gray-600 mb-2">Track and regulate your emotions</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {moodLabels.map(mood => (
          <button
            key={mood.name}
            onClick={() => handleMoodSelect(mood.name)}
            className={`${mood.color} text-white p-4 rounded-xl font-medium hover:opacity-90 transition-all ${
              selectedMood === mood.name ? 'ring-4 ring-offset-2 ring-white' : ''
            }`}
          >
            <Heart className="mx-auto mb-2" size={24} />
            <p>{mood.name}</p>
          </button>
        ))}
      </div>

      {moods.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold text-gray-800 mb-2">Recent Moods</h4>
          <div className="space-y-2">
            {moods.slice(-5).reverse().map((m, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-2">
                <span className="font-medium text-gray-800">{m.mood}</span>
                <span className="text-xs text-gray-600">
                  {m.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showExercise && exercises.length > 0 && (
        <div className="bg-rose-50 rounded-xl p-4">
          <h4 className="font-semibold text-rose-800 mb-2">Suggested Exercises</h4>
          <ul className="space-y-2">
            {exercises.map((exercise, idx) => (
              <li key={idx} className="text-gray-700">• {exercise}</li>
            ))}
          </ul>
        </div>
      )}

      {moods.length > 0 && (
        <button
          onClick={completeSession}
          className="w-full py-3 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 transition-colors"
        >
          Complete Session ({moods.length} moods tracked)
        </button>
      )}
    </div>
  );
};

// ==================== ATTENTION & FOCUS GAMES ====================

// Focus Shift Game
const FocusShiftGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [currentTask, setCurrentTask] = useState<'color' | 'shape' | 'number'>('color');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [target, setTarget] = useState<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const taskTimerRef = useRef<NodeJS.Timeout | null>(null);

  const tasks = {
    color: { name: 'Color', options: ['Red', 'Blue', 'Green', 'Yellow'] },
    shape: { name: 'Shape', options: ['Circle', 'Square', 'Triangle', 'Star'] },
    number: { name: 'Number', options: ['1', '2', '3', '4'] }
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setIsPlaying(true);
    switchTask();
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const switchTask = () => {
    const taskTypes: Array<'color' | 'shape' | 'number'> = ['color', 'shape', 'number'];
    const newTask = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    setCurrentTask(newTask);
    const options = tasks[newTask].options;
    setTarget(options[Math.floor(Math.random() * options.length)]);
    
    taskTimerRef.current = setTimeout(() => {
      if (isPlaying) switchTask();
    }, 3000);
  };

  const handleClick = (value: string) => {
    if (!isPlaying) return;
    if (value === target) {
      setScore(prev => prev + 10);
      switchTask();
    } else {
      setScore(prev => Math.max(0, prev - 5));
    }
  };

  const endGame = () => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (taskTimerRef.current) clearTimeout(taskTimerRef.current);
    setTimeout(() => {
      onComplete({ game: 'focus_shift', score, attempts: 1 });
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (taskTimerRef.current) clearTimeout(taskTimerRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">← Back to Games</button>
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Focus Shift</h3>
        <p className="text-gray-600 mb-2">Switch between different tasks</p>
        <div className="flex justify-center gap-4">
          <div className="bg-cyan-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-xl font-bold text-cyan-600">{score}</p>
          </div>
          <div className="bg-blue-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Time</p>
            <p className="text-xl font-bold text-blue-600">{timeLeft}s</p>
          </div>
        </div>
      </div>
      {!isPlaying && (
        <button onClick={startGame} className="w-full py-3 bg-cyan-600 text-white rounded-xl font-medium hover:bg-cyan-700">
          Start Game
        </button>
      )}
      {isPlaying && target && (
        <div className="text-center">
          <div className="bg-cyan-100 rounded-xl p-6 mb-4">
            <p className="text-sm text-gray-600 mb-2">Current Task:</p>
            <p className="text-2xl font-bold text-cyan-800">{tasks[currentTask].name}</p>
            <p className="text-lg text-gray-700 mt-2">Find: <span className="font-bold">{target}</span></p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {tasks[currentTask].options.map(opt => (
              <button
                key={opt}
                onClick={() => handleClick(opt)}
                className="py-4 bg-cyan-100 hover:bg-cyan-200 rounded-xl font-medium text-gray-800 transition-colors"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Visual Filter Game
const VisualFilterGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [targetPattern, setTargetPattern] = useState<string>('');
  const [items, setItems] = useState<Array<{ id: number; pattern: string; isTarget: boolean }>>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const patterns = ['●', '■', '▲', '★', '◆'];

  const startGame = () => {
    setScore(0);
    setTimeLeft(45);
    setIsPlaying(true);
    generateRound();
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const generateRound = () => {
    const target = patterns[Math.floor(Math.random() * patterns.length)];
    setTargetPattern(target);
    const newItems: Array<{ id: number; pattern: string; isTarget: boolean }> = [];
    for (let i = 0; i < 20; i++) {
      const pattern = patterns[Math.floor(Math.random() * patterns.length)];
      newItems.push({ id: i, pattern, isTarget: pattern === target });
    }
    setItems(newItems.sort(() => Math.random() - 0.5));
  };

  const handleClick = (isTarget: boolean) => {
    if (!isPlaying) return;
    if (isTarget) {
      setScore(prev => prev + 10);
      generateRound();
    } else {
      setScore(prev => Math.max(0, prev - 3));
    }
  };

  const endGame = () => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => {
      onComplete({ game: 'visual_filter', score, attempts: 1 });
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">← Back to Games</button>
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Visual Filter</h3>
        <p className="text-gray-600 mb-2">Find the target pattern</p>
        <div className="flex justify-center gap-4">
          <div className="bg-violet-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-xl font-bold text-violet-600">{score}</p>
          </div>
          <div className="bg-purple-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Time</p>
            <p className="text-xl font-bold text-purple-600">{timeLeft}s</p>
          </div>
        </div>
      </div>
      {!isPlaying && (
        <button onClick={startGame} className="w-full py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700">
          Start Game
        </button>
      )}
      {isPlaying && targetPattern && (
        <div>
          <div className="bg-violet-100 rounded-xl p-4 mb-4 text-center">
            <p className="text-sm text-gray-600 mb-2">Find this pattern:</p>
            <p className="text-4xl font-bold">{targetPattern}</p>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {items.map(item => (
              <button
                key={item.id}
                onClick={() => handleClick(item.isTarget)}
                className={`aspect-square rounded-lg text-2xl flex items-center justify-center transition-all ${
                  item.isTarget ? 'bg-green-200 hover:bg-green-300' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {item.pattern}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Task Switcher Game
const TaskSwitcherGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [tasks, setTasks] = useState<Array<{ id: number; type: string; completed: boolean }>>([]);
  const [activeTask, setActiveTask] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const taskTypes = ['Count', 'Color', 'Shape', 'Pattern'];

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setIsPlaying(true);
    generateTasks();
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const generateTasks = () => {
    const newTasks = taskTypes.map((type, idx) => ({
      id: idx,
      type,
      completed: false
    }));
    setTasks(newTasks);
    setActiveTask(0);
  };

  const completeTask = (taskId: number) => {
    if (!isPlaying || activeTask !== taskId) return;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));
    setScore(prev => prev + 20);
    const nextTask = tasks.find(t => !t.completed && t.id !== taskId);
    if (nextTask) {
      setActiveTask(nextTask.id);
    } else {
      // All tasks complete, generate new set
      setTimeout(() => {
        generateTasks();
      }, 1000);
    }
  };

  const endGame = () => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => {
      onComplete({ game: 'task_switcher', score, attempts: 1 });
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">← Back to Games</button>
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Task Switcher</h3>
        <p className="text-gray-600 mb-2">Switch between tasks quickly</p>
        <div className="flex justify-center gap-4">
          <div className="bg-indigo-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-xl font-bold text-indigo-600">{score}</p>
          </div>
          <div className="bg-blue-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Time</p>
            <p className="text-xl font-bold text-blue-600">{timeLeft}s</p>
          </div>
        </div>
      </div>
      {!isPlaying && (
        <button onClick={startGame} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">
          Start Game
        </button>
      )}
      {isPlaying && (
        <div className="space-y-3">
          {tasks.map(task => (
            <button
              key={task.id}
              onClick={() => completeTask(task.id)}
              disabled={activeTask !== task.id || task.completed}
              className={`w-full py-4 rounded-xl font-medium transition-all ${
                task.completed ? 'bg-green-100 text-green-800' :
                activeTask === task.id ? 'bg-indigo-600 text-white hover:bg-indigo-700' :
                'bg-gray-100 text-gray-600'
              }`}
            >
              {task.type} {task.completed ? '✓' : activeTask === task.id ? '← Active' : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Attention Trainer Game
const AttentionTrainerGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [targets, setTargets] = useState<Array<{ id: number; x: number; y: number; type: 'target' | 'distraction'; size: number }>>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = () => {
    setScore(0);
    setTimeLeft(45);
    setTargets([]);
    setIsPlaying(true);
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    spawnTargets();
  };

  const spawnTargets = () => {
    if (!isPlaying) return;
    const newTarget = {
      id: Date.now(),
      x: Math.random() * 85 + 5,
      y: Math.random() * 70 + 15,
      type: Math.random() > 0.4 ? 'target' : 'distraction' as 'target' | 'distraction',
      size: 8 + Math.random() * 8
    };
    setTargets(prev => [...prev, newTarget].slice(-15));
    spawnTimerRef.current = setTimeout(() => spawnTargets(), 1200 - (score * 5));
  };

  const handleClick = (target: { id: number; type: 'target' | 'distraction' }) => {
    if (!isPlaying) return;
    if (target.type === 'target') {
      setScore(prev => prev + 15);
      setTargets(prev => prev.filter(t => t.id !== target.id));
    } else {
      setScore(prev => Math.max(0, prev - 10));
      setTargets(prev => prev.filter(t => t.id !== target.id));
    }
  };

  const endGame = () => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    setTimeout(() => {
      onComplete({ game: 'attention_trainer', score, attempts: 1 });
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">← Back to Games</button>
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Attention Trainer</h3>
        <p className="text-gray-600 mb-2">Click only the blue circles</p>
        <div className="flex justify-center gap-4">
          <div className="bg-pink-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-xl font-bold text-pink-600">{score}</p>
          </div>
          <div className="bg-rose-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Time</p>
            <p className="text-xl font-bold text-rose-600">{timeLeft}s</p>
          </div>
        </div>
      </div>
      {!isPlaying && (
        <button onClick={startGame} className="w-full py-3 bg-pink-600 text-white rounded-xl font-medium hover:bg-pink-700">
          Start Game
        </button>
      )}
      {isPlaying && (
        <div className="relative bg-gray-100 rounded-xl h-96 overflow-hidden">
          {targets.map(target => (
            <button
              key={target.id}
              onClick={() => handleClick(target)}
              className={`absolute rounded-full transition-all ${
                target.type === 'target' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-400 hover:bg-red-500'
              }`}
              style={{
                left: `${target.x}%`,
                top: `${target.y}%`,
                width: `${target.size}px`,
                height: `${target.size}px`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Concentration Challenge Game
const ConcentrationChallengeGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [focusTime, setFocusTime] = useState(0);
  const [targetTime, setTargetTime] = useState(10);
  const [isFocused, setIsFocused] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRound = () => {
    setFocusTime(0);
    setTargetTime(5 + level * 2);
    setIsFocused(true);
    
    timerRef.current = setInterval(() => {
      setFocusTime(prev => {
        const newTime = prev + 0.1;
        if (newTime >= targetTime) {
          completeRound();
          return targetTime;
        }
        return newTime;
      });
    }, 100);
  };

  const completeRound = () => {
    setIsFocused(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setScore(prev => prev + targetTime * 10);
    setLevel(prev => prev + 1);
    
    if (level >= 10) {
      setTimeout(() => {
        onComplete({ game: 'concentration_challenge', score: score + targetTime * 10, attempts: level });
      }, 1500);
    }
  };

  const loseFocus = () => {
    if (!isFocused) return;
    setIsFocused(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => {
      onComplete({ game: 'concentration_challenge', score, attempts: level });
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">← Back to Games</button>
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Concentration Challenge</h3>
        <p className="text-gray-600 mb-2">Focus for increasing time</p>
        <div className="flex justify-center gap-4">
          <div className="bg-amber-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Level</p>
            <p className="text-xl font-bold text-amber-600">{level}</p>
          </div>
          <div className="bg-orange-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-xl font-bold text-orange-600">{score}</p>
          </div>
        </div>
      </div>
      {!isFocused && level === 1 && (
        <button onClick={startRound} className="w-full py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700">
          Start Challenge
        </button>
      )}
      {isFocused && (
        <div className="text-center">
          <div className="bg-amber-100 rounded-xl p-8 mb-4">
            <p className="text-4xl font-bold text-amber-800 mb-2">
              {focusTime.toFixed(1)}s / {targetTime}s
            </p>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-amber-600 h-4 rounded-full transition-all"
                style={{ width: `${(focusTime / targetTime) * 100}%` }}
              />
            </div>
          </div>
          <p className="text-gray-600 mb-4">Keep focused! Don't click anywhere.</p>
          <button
            onClick={loseFocus}
            className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
          >
            I Lost Focus
          </button>
        </div>
      )}
      {!isFocused && level > 1 && level < 10 && (
        <div>
          <div className="bg-green-50 rounded-xl p-4 mb-4 text-center">
            <p className="text-lg font-bold text-green-800">Level {level - 1} Complete!</p>
            <p className="text-gray-600">Next: Focus for {targetTime}s</p>
          </div>
          <button onClick={startRound} className="w-full py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700">
            Continue to Level {level}
          </button>
        </div>
      )}
    </div>
  );
};

// ==================== BREATHING & RELAXATION GAMES ====================

// Breathe Mountain Game
const BreatheMountainGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'pause'>('inhale');
  const [cycle, setCycle] = useState(0);
  const [mountainHeight, setMountainHeight] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = () => {
    setCycle(0);
    setIsPlaying(true);
    setPhase('inhale');
    startCycle();
  };

  const startCycle = () => {
    setPhase('inhale');
    let height = 30;
    const inhaleInterval = setInterval(() => {
      height += 1.5;
      setMountainHeight(height);
      if (height >= 80) clearInterval(inhaleInterval);
    }, 100);

    phaseTimerRef.current = setTimeout(() => {
      setPhase('hold');
      clearInterval(inhaleInterval);
      
      phaseTimerRef.current = setTimeout(() => {
        setPhase('exhale');
        let exhaleHeight = 80;
        const exhaleInterval = setInterval(() => {
          exhaleHeight -= 1.5;
          setMountainHeight(exhaleHeight);
          if (exhaleHeight <= 30) clearInterval(exhaleInterval);
        }, 100);

        phaseTimerRef.current = setTimeout(() => {
          setPhase('pause');
          clearInterval(exhaleInterval);
          
          phaseTimerRef.current = setTimeout(() => {
            const newCycle = cycle + 1;
            setCycle(newCycle);
            if (newCycle >= 5) {
              setIsPlaying(false);
              setTimeout(() => onComplete({ game: 'breathe_mountain', score: newCycle }), 1000);
            } else {
              startCycle();
            }
          }, 2000);
        }, 4000);
      }, 4000);
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">← Back to Games</button>
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Breathe Mountain</h3>
        <p className="text-gray-600 mb-2">Breathe with the mountain</p>
        <div className="bg-emerald-50 rounded-xl px-4 py-2 inline-block">
          <p className="text-sm text-gray-600">Cycle</p>
          <p className="text-xl font-bold text-emerald-600">{cycle}/5</p>
        </div>
      </div>
      {!isPlaying && cycle === 0 && (
        <button onClick={startGame} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700">
          Start Breathing
        </button>
      )}
      <div className="relative bg-gradient-to-b from-sky-300 to-emerald-400 rounded-xl h-64 overflow-hidden">
        <div
          className="absolute bottom-0 left-0 right-0 bg-emerald-600 transition-all duration-1000"
          style={{ height: `${mountainHeight}%`, clipPath: 'polygon(0 100%, 50% 0%, 100% 100%)' }}
        />
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white">
          <p className="text-2xl font-bold">
            {phase === 'inhale' ? 'Breathe In' : phase === 'hold' ? 'Hold' : phase === 'exhale' ? 'Breathe Out' : 'Pause'}
          </p>
        </div>
      </div>
    </div>
  );
};

// Relaxing Ripples Game
const RelaxingRipplesGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [ripples, setRipples] = useState<Array<{ id: number; size: number; opacity: number }>>([]);
  const [cycle, setCycle] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const rippleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = () => {
    setCycle(0);
    setIsPlaying(true);
    createRipple();
  };

  const createRipple = () => {
    const newRipple = { id: Date.now(), size: 0, opacity: 1 };
    setRipples(prev => [...prev, newRipple]);
    
    const interval = setInterval(() => {
      setRipples(prev => prev.map(r => 
        r.id === newRipple.id 
          ? { ...r, size: r.size + 2, opacity: Math.max(0, r.opacity - 0.02) }
          : r
      ).filter(r => r.opacity > 0));
    }, 50);

    setTimeout(() => {
      clearInterval(interval);
      const newCycle = cycle + 1;
      setCycle(newCycle);
      if (newCycle >= 8) {
        setIsPlaying(false);
        setTimeout(() => onComplete({ game: 'relaxing_ripples', score: newCycle }), 1000);
      } else {
        setTimeout(() => createRipple(), 2000);
      }
    }, 4000);
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">← Back to Games</button>
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Relaxing Ripples</h3>
        <p className="text-gray-600 mb-2">Create ripples with deep breathing</p>
        <div className="bg-blue-50 rounded-xl px-4 py-2 inline-block">
          <p className="text-sm text-gray-600">Ripples</p>
          <p className="text-xl font-bold text-blue-600">{cycle}/8</p>
        </div>
      </div>
      {!isPlaying && cycle === 0 && (
        <button onClick={startGame} className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">
          Start Breathing
        </button>
      )}
      <div className="relative bg-gradient-to-b from-blue-200 to-cyan-300 rounded-xl h-64 overflow-hidden flex items-center justify-center">
        {ripples.map(ripple => (
          <div
            key={ripple.id}
            className="absolute border-4 border-blue-400 rounded-full"
            style={{
              width: `${ripple.size}px`,
              height: `${ripple.size}px`,
              opacity: ripple.opacity,
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}
        <p className="text-white text-lg font-medium">Breathe deeply...</p>
      </div>
    </div>
  );
};

// Calm Colors Game
const CalmColorsGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [colorIntensity, setColorIntensity] = useState(50);
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [cycle, setCycle] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const colors = [
    { name: 'Calm Blue', from: 'from-blue-200', to: 'to-blue-600' },
    { name: 'Peaceful Green', from: 'from-green-200', to: 'to-green-600' },
    { name: 'Serene Purple', from: 'from-purple-200', to: 'to-purple-600' },
  ];
  const [currentColor, setCurrentColor] = useState(0);

  const startGame = () => {
    setCycle(0);
    setIsPlaying(true);
    setPhase('inhale');
    startBreathing();
  };

  const startBreathing = () => {
    setPhase('inhale');
    let intensity = 50;
    const inhaleInterval = setInterval(() => {
      intensity += 1;
      setColorIntensity(intensity);
      if (intensity >= 100) clearInterval(inhaleInterval);
    }, 80);

    phaseTimerRef.current = setTimeout(() => {
      setPhase('exhale');
      let exhaleIntensity = 100;
      const exhaleInterval = setInterval(() => {
        exhaleIntensity -= 1;
        setColorIntensity(exhaleIntensity);
        if (exhaleIntensity <= 50) {
          clearInterval(exhaleInterval);
          const newCycle = cycle + 1;
          setCycle(newCycle);
          if (newCycle >= 6) {
            setIsPlaying(false);
            setTimeout(() => onComplete({ game: 'calm_colors', score: newCycle }), 1000);
          } else {
            if (newCycle % 2 === 0) {
              setCurrentColor(prev => (prev + 1) % colors.length);
            }
            startBreathing();
          }
        }
      }, 80);
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">← Back to Games</button>
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Calm Colors</h3>
        <p className="text-gray-600 mb-2">Change colors with breathing</p>
        <div className="bg-pink-50 rounded-xl px-4 py-2 inline-block">
          <p className="text-sm text-gray-600">Cycle</p>
          <p className="text-xl font-bold text-pink-600">{cycle}/6</p>
        </div>
      </div>
      {!isPlaying && cycle === 0 && (
        <button onClick={startGame} className="w-full py-3 bg-pink-600 text-white rounded-xl font-medium hover:bg-pink-700">
          Start Breathing
        </button>
      )}
      <div className={`bg-gradient-to-br ${colors[currentColor].from} ${colors[currentColor].to} rounded-xl h-64 flex items-center justify-center transition-all duration-1000`}
        style={{ opacity: colorIntensity / 100 }}>
        <div className="text-center text-white">
          <p className="text-2xl font-bold mb-2">{colors[currentColor].name}</p>
          <p className="text-lg">{phase === 'inhale' ? 'Breathe In' : 'Breathe Out'}</p>
        </div>
      </div>
    </div>
  );
};

// Soothing Soundscape Game
const SoothingSoundscapeGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [soundLevel, setSoundLevel] = useState(0);
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [cycle, setCycle] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const sounds = ['🌊 Ocean', '🌧️ Rain', '🍃 Forest', '🔥 Fire'];

  const startGame = () => {
    setCycle(0);
    setIsPlaying(true);
    setPhase('inhale');
    startBreathing();
  };

  const startBreathing = () => {
    setPhase('inhale');
    let level = 0;
    const inhaleInterval = setInterval(() => {
      level += 2;
      setSoundLevel(level);
      if (level >= 100) clearInterval(inhaleInterval);
    }, 80);

    phaseTimerRef.current = setTimeout(() => {
      setPhase('exhale');
      let exhaleLevel = 100;
      const exhaleInterval = setInterval(() => {
        exhaleLevel -= 2;
        setSoundLevel(exhaleLevel);
        if (exhaleLevel <= 0) {
          clearInterval(exhaleInterval);
          const newCycle = cycle + 1;
          setCycle(newCycle);
          if (newCycle >= 5) {
            setIsPlaying(false);
            setTimeout(() => onComplete({ game: 'soothing_soundscape', score: newCycle }), 1000);
          } else {
            startBreathing();
          }
        }
      }, 80);
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">← Back to Games</button>
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Soothing Soundscape</h3>
        <p className="text-gray-600 mb-2">Create peaceful sounds</p>
        <div className="bg-teal-50 rounded-xl px-4 py-2 inline-block">
          <p className="text-sm text-gray-600">Cycle</p>
          <p className="text-xl font-bold text-teal-600">{cycle}/5</p>
        </div>
      </div>
      {!isPlaying && cycle === 0 && (
        <button onClick={startGame} className="w-full py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700">
          Start Breathing
        </button>
      )}
      <div className="bg-gradient-to-br from-teal-200 to-green-400 rounded-xl h-64 flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">{sounds[cycle % sounds.length]}</p>
          <p className="text-xl text-white font-bold">{phase === 'inhale' ? 'Breathe In' : 'Breathe Out'}</p>
          <div className="w-64 bg-gray-200 rounded-full h-2 mt-4">
            <div className="bg-teal-600 h-2 rounded-full transition-all" style={{ width: `${soundLevel}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Mindful Moments Game
const MindfulMomentsGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [focusTime, setFocusTime] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [distractions, setDistractions] = useState<Array<{ id: number; text: string; x: number; y: number }>>([]);
  const [score, setScore] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const distractionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const distractionTexts = ['Worry', 'Stress', 'Anxiety', 'Past', 'Future'];

  const startGame = () => {
    setFocusTime(0);
    setScore(0);
    setIsFocused(true);
    setDistractions([]);
    
    timerRef.current = setInterval(() => {
      setFocusTime(prev => prev + 0.1);
      setScore(prev => prev + 1);
    }, 100);

    distractionTimerRef.current = setTimeout(() => {
      spawnDistraction();
    }, 2000);
  };

  const spawnDistraction = () => {
    if (!isFocused) return;
    const newDistraction = {
      id: Date.now(),
      text: distractionTexts[Math.floor(Math.random() * distractionTexts.length)],
      x: Math.random() * 80 + 10,
      y: Math.random() * 70 + 15
    };
    setDistractions(prev => [...prev, newDistraction]);
    
    setTimeout(() => {
      setDistractions(prev => prev.filter(d => d.id !== newDistraction.id));
    }, 3000);

    distractionTimerRef.current = setTimeout(() => {
      spawnDistraction();
    }, 2500);
  };

  const letGo = (id: number) => {
    setDistractions(prev => prev.filter(d => d.id !== id));
    setScore(prev => prev + 5);
  };

  const endGame = () => {
    setIsFocused(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (distractionTimerRef.current) clearTimeout(distractionTimerRef.current);
    setTimeout(() => {
      onComplete({ game: 'mindful_moments', score: Math.floor(score) });
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (distractionTimerRef.current) clearTimeout(distractionTimerRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">← Back to Games</button>
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Mindful Moments</h3>
        <p className="text-gray-600 mb-2">Focus on the present moment</p>
        <div className="flex justify-center gap-4">
          <div className="bg-indigo-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Time</p>
            <p className="text-xl font-bold text-indigo-600">{focusTime.toFixed(1)}s</p>
          </div>
          <div className="bg-blue-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-xl font-bold text-blue-600">{Math.floor(score)}</p>
          </div>
        </div>
      </div>
      {!isFocused && (
        <button onClick={startGame} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">
          Start Mindfulness
        </button>
      )}
      {isFocused && (
        <div className="relative bg-gradient-to-br from-indigo-100 to-blue-200 rounded-xl h-96 overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <p className="text-4xl font-bold text-indigo-800 mb-2">Be Present</p>
            <p className="text-lg text-gray-700">Let go of distractions</p>
          </div>
          {distractions.map(distraction => (
            <button
              key={distraction.id}
              onClick={() => letGo(distraction.id)}
              className="absolute px-4 py-2 bg-red-200 hover:bg-red-300 rounded-lg text-red-800 font-medium transition-all"
              style={{
                left: `${distraction.x}%`,
                top: `${distraction.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {distraction.text} ✕
            </button>
          ))}
          <button onClick={endGame} className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
            Complete
          </button>
        </div>
      )}
    </div>
  );
};

// ==================== MEMORY & COGNITION GAMES ====================

// Memory Matrix 2.0 Game
const MemoryMatrix2Game: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [grid, setGrid] = useState<Array<{ id: number; hasObject: boolean; revealed: boolean; clicked: boolean }>>([]);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [isShowing, setIsShowing] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const gridSize = 3 + level;

  const startGame = () => {
    setLevel(1);
    setScore(0);
    setGameOver(false);
    generateGrid();
  };

  const generateGrid = () => {
    const totalCells = gridSize * gridSize;
    const objectCount = 2 + level;
    const positions = new Set<number>();
    while (positions.size < objectCount) {
      positions.add(Math.floor(Math.random() * totalCells));
    }
    
    const newGrid = Array.from({ length: totalCells }, (_, i) => ({
      id: i,
      hasObject: positions.has(i),
      revealed: false,
      clicked: false
    }));
    setGrid(newGrid);
    setIsShowing(true);
    
    setTimeout(() => {
      setIsShowing(false);
      setGrid(prev => prev.map(cell => ({ ...cell, revealed: true })));
    }, 3000);
  };

  const handleClick = (id: number) => {
    if (isShowing || gameOver) return;
    const cell = grid.find(c => c.id === id);
    if (!cell || cell.clicked) return;
    
    setGrid(prev => prev.map(c => c.id === id ? { ...c, clicked: true } : c));
    
    if (cell.hasObject) {
      setScore(prev => prev + 10);
      const allClicked = grid.filter(c => c.hasObject).every(c => c.id === id || c.clicked);
      if (allClicked) {
        const newLevel = level + 1;
        setLevel(newLevel);
        setTimeout(() => generateGrid(), 1000);
      }
    } else {
      setGameOver(true);
      setTimeout(() => {
        onComplete({ game: 'memory_matrix_2', score, attempts: level });
      }, 2000);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">← Back to Games</button>
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Memory Matrix 2.0</h3>
        <p className="text-gray-600 mb-2">Remember positions in reverse</p>
        <div className="flex justify-center gap-4">
          <div className="bg-purple-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Level</p>
            <p className="text-xl font-bold text-purple-600">{level}</p>
          </div>
          <div className="bg-pink-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-xl font-bold text-pink-600">{score}</p>
          </div>
        </div>
      </div>
      {level === 1 && !isShowing && !gameOver && (
        <button onClick={startGame} className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700">
          Start Game
        </button>
      )}
      {isShowing && (
        <div className="text-center py-8">
          <p className="text-2xl font-bold text-purple-600 mb-2">Watch carefully...</p>
          <p className="text-gray-600">Remember the positions</p>
        </div>
      )}
      {!isShowing && !gameOver && (
        <div className="grid gap-2 mx-auto" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, maxWidth: '300px' }}>
          {grid.map(cell => (
            <button
              key={cell.id}
              onClick={() => handleClick(cell.id)}
              disabled={cell.clicked}
              className={`aspect-square rounded-lg transition-all ${
                cell.clicked && cell.hasObject ? 'bg-green-500' :
                cell.clicked ? 'bg-red-500' :
                'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {cell.hasObject && (isShowing || cell.clicked) && '●'}
            </button>
          ))}
        </div>
      )}
      {gameOver && (
        <div className="text-center bg-red-50 rounded-xl p-4">
          <p className="text-lg font-bold text-red-800">Game Over!</p>
          <p className="text-gray-600">You reached level {level}</p>
        </div>
      )}
    </div>
  );
};

// Word Scramble Game
const WordScrambleGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [words] = useState(['WELLNESS', 'FITNESS', 'HEALTH', 'STRENGTH', 'BALANCE', 'ENERGY', 'FOCUS', 'CALM']);
  const [currentWord, setCurrentWord] = useState('');
  const [scrambled, setScrambled] = useState('');
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const scrambleWord = (word: string) => {
    return word.split('').sort(() => Math.random() - 0.5).join('');
  };

  const startGame = () => {
    setLevel(1);
    setScore(0);
    setTimeLeft(30);
    setIsPlaying(true);
    newWord();
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const newWord = () => {
    const word = words[Math.floor(Math.random() * words.length)];
    setCurrentWord(word);
    setScrambled(scrambleWord(word));
    setUserInput('');
  };

  const handleSubmit = () => {
    if (userInput.toUpperCase() === currentWord) {
      setScore(prev => prev + 20);
      setLevel(prev => prev + 1);
      setTimeout(() => newWord(), 1000);
    } else {
      setScore(prev => Math.max(0, prev - 5));
    }
  };

  const endGame = () => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => {
      onComplete({ game: 'word_scramble', score, attempts: level });
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">← Back to Games</button>
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Word Scramble</h3>
        <p className="text-gray-600 mb-2">Unscramble the word</p>
        <div className="flex justify-center gap-4">
          <div className="bg-orange-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Level</p>
            <p className="text-xl font-bold text-orange-600">{level}</p>
          </div>
          <div className="bg-red-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-xl font-bold text-red-600">{score}</p>
          </div>
          <div className="bg-amber-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Time</p>
            <p className="text-xl font-bold text-amber-600">{timeLeft}s</p>
          </div>
        </div>
      </div>
      {!isPlaying && (
        <button onClick={startGame} className="w-full py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700">
          Start Game
        </button>
      )}
      {isPlaying && (
        <div className="text-center">
          <div className="bg-orange-100 rounded-xl p-6 mb-4">
            <p className="text-sm text-gray-600 mb-2">Scrambled:</p>
            <p className="text-4xl font-bold text-orange-800">{scrambled}</p>
          </div>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full p-4 text-2xl text-center border-2 border-orange-300 rounded-xl focus:border-orange-500 focus:outline-none mb-4"
            placeholder="Type your answer"
          />
          <button onClick={handleSubmit} className="w-full py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700">
            Submit
          </button>
        </div>
      )}
    </div>
  );
};

// Math Bingo 2.0 Game
const MathBingo2Game: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [problem, setProblem] = useState<{ num1: number; num2: number; operator: string; answer: number } | null>(null);
  const [bingoCard, setBingoCard] = useState<Array<{ num: number; marked: boolean }>>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  const generateBingoCard = () => {
    const numbers: number[] = [];
    while (numbers.length < 9) {
      const num = Math.floor(Math.random() * 50) + 1;
      if (!numbers.includes(num)) numbers.push(num);
    }
    setBingoCard(numbers.map(num => ({ num, marked: false })));
  };

  const generateProblem = () => {
    const num1 = Math.floor(Math.random() * (10 + level * 5)) + 1;
    const num2 = Math.floor(Math.random() * (10 + level * 5)) + 1;
    const operators = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    let answer = 0;
    if (operator === '+') answer = num1 + num2;
    else if (operator === '-') answer = num1 - num2;
    else answer = num1 * num2;
    setProblem({ num1, num2, operator, answer });
  };

  const startGame = () => {
    setLevel(1);
    setScore(0);
    setIsPlaying(true);
    generateBingoCard();
    generateProblem();
  };

  const handleAnswer = (num: number) => {
    if (!problem || !isPlaying) return;
    if (num === problem.answer) {
      setBingoCard(prev => prev.map(cell => cell.num === num ? { ...cell, marked: true } : cell));
      setScore(prev => prev + 10);
      const allMarked = bingoCard.every(c => c.marked || c.num === num);
      if (allMarked) {
        setLevel(prev => prev + 1);
        generateBingoCard();
      }
      generateProblem();
    } else {
      setScore(prev => Math.max(0, prev - 5));
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">← Back to Games</button>
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Math Bingo 2.0</h3>
        <p className="text-gray-600 mb-2">Solve math to mark bingo</p>
        <div className="flex justify-center gap-4">
          <div className="bg-green-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Level</p>
            <p className="text-xl font-bold text-green-600">{level}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-xl font-bold text-emerald-600">{score}</p>
          </div>
        </div>
      </div>
      {!isPlaying && (
        <button onClick={startGame} className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700">
          Start Game
        </button>
      )}
      {isPlaying && problem && (
        <div>
          <div className="bg-green-100 rounded-xl p-6 mb-4 text-center">
            <p className="text-3xl font-bold text-green-800">
              {problem.num1} {problem.operator} {problem.num2} = ?
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {bingoCard.map((cell, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(cell.num)}
                disabled={cell.marked}
                className={`aspect-square rounded-xl font-bold text-xl transition-all ${
                  cell.marked ? 'bg-green-500 text-white' : 'bg-green-100 hover:bg-green-200 text-green-800'
                }`}
              >
                {cell.num}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Storyteller 2.0 Game
const Storyteller2Game: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [story, setStory] = useState<string[]>([]);
  const [currentSentence, setCurrentSentence] = useState('');
  const [userInput, setUserInput] = useState('');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const sentences = [
    'Once upon a time',
    'in a peaceful garden',
    'a flower began to bloom',
    'with colors bright and true',
    'it reached toward the sun',
    'growing stronger every day',
    'spreading joy to all around',
    'a symbol of new life'
  ];

  const startGame = () => {
    setLevel(1);
    setScore(0);
    setStory([]);
    setIsPlaying(true);
    setCurrentSentence(sentences[0]);
  };

  const handleSubmit = () => {
    if (userInput.trim().toLowerCase() === currentSentence.toLowerCase()) {
      setStory(prev => [...prev, currentSentence]);
      setScore(prev => prev + 20);
      const nextLevel = level + 1;
      setLevel(nextLevel);
      if (nextLevel <= sentences.length) {
        setCurrentSentence(sentences[nextLevel - 1]);
        setUserInput('');
      } else {
        setIsPlaying(false);
        setTimeout(() => {
          onComplete({ game: 'storyteller_2', score, attempts: level });
        }, 1500);
      }
    } else {
      setScore(prev => Math.max(0, prev - 5));
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">← Back to Games</button>
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Storyteller 2.0</h3>
        <p className="text-gray-600 mb-2">Recall and add to story</p>
        <div className="flex justify-center gap-4">
          <div className="bg-amber-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Level</p>
            <p className="text-xl font-bold text-amber-600">{level}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-xl font-bold text-yellow-600">{score}</p>
          </div>
        </div>
      </div>
      {!isPlaying && level === 1 && (
        <button onClick={startGame} className="w-full py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700">
          Start Game
        </button>
      )}
      {isPlaying && (
        <div>
          <div className="bg-amber-50 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">Story so far:</p>
            {story.map((s, idx) => (
              <p key={idx} className="text-gray-800">{s}</p>
            ))}
          </div>
          <div className="bg-amber-100 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">Next sentence:</p>
            <p className="text-lg font-bold text-amber-800">{currentSentence}</p>
          </div>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full p-4 border-2 border-amber-300 rounded-xl focus:border-amber-500 focus:outline-none mb-4"
            placeholder="Type the sentence"
          />
          <button onClick={handleSubmit} className="w-full py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700">
            Submit
          </button>
        </div>
      )}
    </div>
  );
};

// Anagram Challenge Game
const AnagramChallengeGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [words] = useState(['PEACE', 'CALM', 'FOCUS', 'STRENGTH', 'BALANCE', 'ENERGY', 'WELLNESS', 'HAPPY']);
  const [currentWord, setCurrentWord] = useState('');
  const [scrambled, setScrambled] = useState('');
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const scrambleWord = (word: string) => {
    return word.split('').sort(() => Math.random() - 0.5).join('');
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(20);
    setIsPlaying(true);
    newWord();
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const newWord = () => {
    const word = words[Math.floor(Math.random() * words.length)];
    setCurrentWord(word);
    setScrambled(scrambleWord(word));
    setUserInput('');
    setTimeLeft(20);
  };

  const handleSubmit = () => {
    if (userInput.toUpperCase() === currentWord) {
      setScore(prev => prev + 30);
      newWord();
    } else {
      setScore(prev => Math.max(0, prev - 10));
    }
  };

  const endGame = () => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => {
      onComplete({ game: 'anagram_challenge', score, attempts: 1 });
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">← Back to Games</button>
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Anagram Challenge</h3>
        <p className="text-gray-600 mb-2">Solve anagrams quickly</p>
        <div className="flex justify-center gap-4">
          <div className="bg-blue-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-xl font-bold text-blue-600">{score}</p>
          </div>
          <div className="bg-indigo-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Time</p>
            <p className="text-xl font-bold text-indigo-600">{timeLeft}s</p>
          </div>
        </div>
      </div>
      {!isPlaying && (
        <button onClick={startGame} className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">
          Start Game
        </button>
      )}
      {isPlaying && (
        <div className="text-center">
          <div className="bg-blue-100 rounded-xl p-6 mb-4">
            <p className="text-sm text-gray-600 mb-2">Anagram:</p>
            <p className="text-4xl font-bold text-blue-800">{scrambled}</p>
          </div>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full p-4 text-2xl text-center border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:outline-none mb-4"
            placeholder="Type your answer"
          />
          <button onClick={handleSubmit} className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">
            Submit
          </button>
        </div>
      )}
    </div>
  );
};

// ==================== MOTOR CONTROL & COORDINATION GAMES ====================

// Finger Tapping Game
const FingerTappingGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const fingers = ['👆', '✌️', '🤟', '🖐️'];

  const startGame = () => {
    setLevel(1);
    setScore(0);
    setGameOver(false);
    generateSequence();
  };

  const generateSequence = () => {
    const length = 3 + level;
    const newSequence: number[] = [];
    for (let i = 0; i < length; i++) {
      newSequence.push(Math.floor(Math.random() * 4));
    }
    setSequence(newSequence);
    setUserSequence([]);
    setIsPlaying(true);
  };

  const handleTap = (fingerIndex: number) => {
    if (!isPlaying || gameOver) return;
    const newInput = [...userSequence, fingerIndex];
    setUserSequence(newInput);
    
    if (newInput[newInput.length - 1] !== sequence[newInput.length - 1]) {
      setGameOver(true);
      setTimeout(() => {
        onComplete({ game: 'finger_tapping', score, attempts: level });
      }, 2000);
      return;
    }
    
    if (newInput.length === sequence.length) {
      setScore(prev => prev + level * 10);
      setLevel(prev => prev + 1);
      setTimeout(() => generateSequence(), 1000);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">← Back to Games</button>
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Finger Tapping</h3>
        <p className="text-gray-600 mb-2">Tap fingers in sequence</p>
        <div className="flex justify-center gap-4">
          <div className="bg-pink-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Level</p>
            <p className="text-xl font-bold text-pink-600">{level}</p>
          </div>
          <div className="bg-rose-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-xl font-bold text-rose-600">{score}</p>
          </div>
        </div>
      </div>
      {level === 1 && userSequence.length === 0 && !isPlaying && !gameOver && (
        <button onClick={startGame} className="w-full py-3 bg-pink-600 text-white rounded-xl font-medium hover:bg-pink-700">
          Start Game
        </button>
      )}
      {isPlaying && (
        <div>
          <div className="bg-pink-100 rounded-xl p-4 mb-4 text-center">
            <p className="text-sm text-gray-600 mb-2">Sequence:</p>
            <p className="text-2xl">{sequence.map(i => fingers[i]).join(' ')}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {fingers.map((finger, idx) => (
              <button
                key={idx}
                onClick={() => handleTap(idx)}
                className="py-8 bg-pink-100 hover:bg-pink-200 rounded-xl text-4xl transition-colors"
              >
                {finger}
              </button>
            ))}
          </div>
          {userSequence.length > 0 && (
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">Your input:</p>
              <p className="text-xl">{userSequence.map(i => fingers[i]).join(' ')}</p>
            </div>
          )}
        </div>
      )}
      {gameOver && (
        <div className="text-center bg-red-50 rounded-xl p-4">
          <p className="text-lg font-bold text-red-800">Game Over!</p>
          <p className="text-gray-600">You reached level {level}</p>
        </div>
      )}
    </div>
  );
};

// Reaction Time Challenge Game
const ReactionTimeChallengeGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [state, setState] = useState<'ready' | 'waiting' | 'now' | 'finished'>('ready');
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const startRound = () => {
    setState('waiting');
    setCurrentTime(null);
    const delay = 1000 + Math.random() * 3000;
    timerRef.current = setTimeout(() => {
      setState('now');
      startTimeRef.current = performance.now();
    }, delay);
  };

  const handleClick = () => {
    if (state === 'waiting') {
      if (timerRef.current) clearTimeout(timerRef.current);
      setState('ready');
      return;
    }
    if (state === 'now' && startTimeRef.current) {
      const reaction = Math.round(performance.now() - startTimeRef.current);
      setCurrentTime(reaction);
      setReactionTimes(prev => [...prev, reaction]);
      setAttempts(prev => prev + 1);
      setState('finished');
      
      if (attempts + 1 >= 5) {
        setTimeout(() => {
          const avg = reactionTimes.reduce((a, b) => a + b, reaction) / (attempts + 1);
          onComplete({ game: 'reaction_time_challenge', reaction_ms: reaction, score: Math.round(avg) });
        }, 2000);
      }
    }
  };

  const reset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState('ready');
    setCurrentTime(null);
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">← Back to Games</button>
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Reaction Time Challenge</h3>
        <p className="text-gray-600 mb-2">React to visual cues</p>
        <div className="flex justify-center gap-4">
          <div className="bg-green-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Attempts</p>
            <p className="text-xl font-bold text-green-600">{attempts}/5</p>
          </div>
          <div className="bg-emerald-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Avg Time</p>
            <p className="text-xl font-bold text-emerald-600">
              {reactionTimes.length > 0 
                ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
                : '--'}ms
            </p>
          </div>
        </div>
      </div>
      <div className={`p-12 rounded-xl text-center transition-all ${
        state === 'now' ? 'bg-green-200' : 
        state === 'waiting' ? 'bg-yellow-100' : 
        state === 'finished' ? 'bg-blue-100' : 
        'bg-gray-100'
      }`}>
        <p className="text-3xl font-bold mb-2">
          {state === 'now' ? 'Click Now!' : 
           state === 'waiting' ? 'Wait...' : 
           state === 'finished' ? `${currentTime}ms` : 
           'Ready'}
        </p>
        {currentTime && (
          <p className="text-lg text-gray-700">Reaction: {currentTime}ms</p>
        )}
      </div>
      <div className="flex gap-2 justify-center">
        {(state === 'ready' || state === 'finished') && (
          <button onClick={startRound} className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700">
            {state === 'finished' ? 'Next Round' : 'Start'}
          </button>
        )}
        {state === 'waiting' || state === 'now' ? (
          <button onClick={handleClick} className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700">
            {state === 'waiting' ? 'Wait...' : 'Click!'}
          </button>
        ) : null}
        {state === 'finished' && (
          <button onClick={reset} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300">
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

// Maze Runner 2.0 Game
const MazeRunner2Game: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [maze, setMaze] = useState<Array<Array<'wall' | 'path' | 'player' | 'end'>>>([]);
  const [playerPos, setPlayerPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [moves, setMoves] = useState(0);

  const generateMaze = (size: number) => {
    const newMaze: Array<Array<'wall' | 'path' | 'player' | 'end'>> = [];
    for (let i = 0; i < size; i++) {
      const row: Array<'wall' | 'path' | 'player' | 'end'> = [];
      for (let j = 0; j < size; j++) {
        if (i === 0 && j === 0) row.push('player');
        else if (i === size - 1 && j === size - 1) row.push('end');
        else row.push(Math.random() > 0.3 ? 'path' : 'wall');
      }
      newMaze.push(row);
    }
    setMaze(newMaze);
    setPlayerPos({ x: 0, y: 0 });
    setMoves(0);
  };

  const startGame = () => {
    setLevel(1);
    setScore(0);
    setIsPlaying(true);
    generateMaze(5);
  };

  const movePlayer = (dx: number, dy: number) => {
    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;
    if (newX < 0 || newY < 0 || newX >= maze.length || newY >= maze[0].length) return;
    if (maze[newY][newX] === 'wall') return;
    
    const newMaze = maze.map((row, y) => 
      row.map((cell, x) => {
        if (x === playerPos.x && y === playerPos.y) return 'path';
        if (x === newX && y === newY) return cell === 'end' ? 'end' : 'player';
        return cell;
      })
    );
    setMaze(newMaze);
    setPlayerPos({ x: newX, y: newY });
    setMoves(prev => prev + 1);
    
    if (newMaze[newY][newX] === 'end') {
      setScore(prev => prev + 100 - moves);
      const newLevel = level + 1;
      setLevel(newLevel);
      if (newLevel <= 5) {
        setTimeout(() => generateMaze(5 + newLevel), 1000);
      } else {
        setIsPlaying(false);
        setTimeout(() => {
          onComplete({ game: 'maze_runner_2', score: score + 100 - moves, attempts: level });
        }, 1500);
      }
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">← Back to Games</button>
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Maze Runner 2.0</h3>
        <p className="text-gray-600 mb-2">Navigate the maze</p>
        <div className="flex justify-center gap-4">
          <div className="bg-purple-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Level</p>
            <p className="text-xl font-bold text-purple-600">{level}</p>
          </div>
          <div className="bg-pink-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-xl font-bold text-pink-600">{score}</p>
          </div>
        </div>
      </div>
      {!isPlaying && level === 1 && (
        <button onClick={startGame} className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700">
          Start Game
        </button>
      )}
      {isPlaying && maze.length > 0 && (
        <div>
          <div className="grid gap-1 mx-auto mb-4" style={{ gridTemplateColumns: `repeat(${maze.length}, 1fr)`, maxWidth: '300px' }}>
            {maze.map((row, y) => 
              row.map((cell, x) => (
                <div
                  key={`${x}-${y}`}
                  className={`aspect-square rounded ${
                    cell === 'wall' ? 'bg-gray-800' :
                    cell === 'player' ? 'bg-purple-500' :
                    cell === 'end' ? 'bg-green-500' :
                    'bg-gray-200'
                  }`}
                />
              ))
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
            <div></div>
            <button onClick={() => movePlayer(0, -1)} className="py-3 bg-purple-600 text-white rounded-xl">↑</button>
            <div></div>
            <button onClick={() => movePlayer(-1, 0)} className="py-3 bg-purple-600 text-white rounded-xl">←</button>
            <div></div>
            <button onClick={() => movePlayer(1, 0)} className="py-3 bg-purple-600 text-white rounded-xl">→</button>
            <div></div>
            <button onClick={() => movePlayer(0, 1)} className="py-3 bg-purple-600 text-white rounded-xl">↓</button>
            <div></div>
          </div>
        </div>
      )}
    </div>
  );
};

// Rhythm Tap 2.0 Game
const RhythmTap2Game: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [beat, setBeat] = useState(0);
  const [userTaps, setUserTaps] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const beatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [pattern, setPattern] = useState<number[]>([]);

  const generatePattern = () => {
    const beats = [500, 750, 1000, 1250];
    const newPattern = Array.from({ length: 4 + level }, () => beats[Math.floor(Math.random() * beats.length)]);
    setPattern(newPattern);
  };

  const startGame = () => {
    setLevel(1);
    setScore(0);
    setIsPlaying(true);
    generatePattern();
    startBeats();
  };

  const startBeats = () => {
    let currentBeat = 0;
    const playBeat = () => {
      if (currentBeat >= pattern.length) {
        checkAccuracy();
        return;
      }
      setBeat(currentBeat);
      beatTimerRef.current = setTimeout(() => {
        currentBeat++;
        playBeat();
      }, pattern[currentBeat]);
    };
    playBeat();
  };

  const handleTap = () => {
    if (!isPlaying) return;
    setUserTaps(prev => [...prev, Date.now()]);
  };

  const checkAccuracy = () => {
    // Simple accuracy check
    const accuracy = userTaps.length / pattern.length;
    if (accuracy > 0.7) {
      setScore(prev => prev + level * 20);
      setLevel(prev => prev + 1);
      setUserTaps([]);
      if (level < 5) {
        setTimeout(() => {
          generatePattern();
          startBeats();
        }, 1000);
      } else {
        setIsPlaying(false);
        setTimeout(() => {
          onComplete({ game: 'rhythm_tap_2', score, attempts: level });
        }, 1500);
      }
    } else {
      setIsPlaying(false);
      setTimeout(() => {
        onComplete({ game: 'rhythm_tap_2', score, attempts: level });
      }, 1500);
    }
  };

  useEffect(() => {
    return () => {
      if (beatTimerRef.current) clearTimeout(beatTimerRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">← Back to Games</button>
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Rhythm Tap 2.0</h3>
        <p className="text-gray-600 mb-2">Tap to the changing beats</p>
        <div className="flex justify-center gap-4">
          <div className="bg-blue-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Level</p>
            <p className="text-xl font-bold text-blue-600">{level}</p>
          </div>
          <div className="bg-cyan-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-xl font-bold text-cyan-600">{score}</p>
          </div>
        </div>
      </div>
      {!isPlaying && level === 1 && (
        <button onClick={startGame} className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">
          Start Game
        </button>
      )}
      {isPlaying && (
        <div className="text-center">
          <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-4 transition-all ${
            beat % 2 === 0 ? 'bg-blue-500 scale-110' : 'bg-blue-300 scale-100'
          }`}>
            <Music2 size={48} className="text-white" />
          </div>
          <button onClick={handleTap} className="w-full py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">
            Tap
          </button>
          <p className="text-sm text-gray-600 mt-2">Taps: {userTaps.length} / {pattern.length}</p>
        </div>
      )}
    </div>
  );
};

// Balance Challenge Game
const BalanceChallengeGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [balance, setBalance] = useState(0);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const balanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [wind, setWind] = useState(0);

  const startGame = () => {
    setBalance(0);
    setTime(0);
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    setWind(0);

    balanceTimerRef.current = setInterval(() => {
      setBalance(prev => {
        const drift = (Math.random() - 0.5) * 3 + wind * 0.5;
        return Math.max(-50, Math.min(50, prev + drift));
      });
      setWind(prev => prev + (Math.random() - 0.5) * 0.5);
    }, 100);

    timerRef.current = setInterval(() => {
      setTime(prev => {
        const newTime = prev + 1;
        setScore(prev => prev + 10);
        if (newTime >= 60) {
          endGame();
          return 60;
        }
        return newTime;
      });
    }, 1000);
  };

  const adjustBalance = (direction: 'left' | 'right') => {
    if (!isPlaying || gameOver) return;
    const adjustment = direction === 'left' ? -5 : 5;
    setBalance(prev => {
      const newBalance = prev + adjustment;
      if (Math.abs(newBalance) >= 45) {
        endGame();
      }
      return Math.max(-50, Math.min(50, newBalance));
    });
  };

  const endGame = () => {
    setIsPlaying(false);
    setGameOver(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (balanceTimerRef.current) clearInterval(balanceTimerRef.current);
    setTimeout(() => {
      onComplete({ game: 'balance_challenge', score, attempts: 1 });
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (balanceTimerRef.current) clearInterval(balanceTimerRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">← Back to Games</button>
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Balance Challenge</h3>
        <p className="text-gray-600 mb-2">Balance on virtual beam</p>
        <div className="flex justify-center gap-4">
          <div className="bg-orange-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Time</p>
            <p className="text-xl font-bold text-orange-600">{time}s</p>
          </div>
          <div className="bg-red-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-xl font-bold text-red-600">{score}</p>
          </div>
        </div>
      </div>
      {!isPlaying && (
        <button onClick={startGame} className="w-full py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700">
          Start Game
        </button>
      )}
      {isPlaying && (
        <div>
          <div className="bg-gray-200 rounded-full h-4 relative overflow-hidden mb-4">
            <div
              className={`h-4 rounded-full transition-all ${
                Math.abs(balance) < 10 ? 'bg-green-500' :
                Math.abs(balance) < 25 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{
                width: '20px',
                marginLeft: `${50 + balance}%`,
                transform: 'translateX(-50%)'
              }}
            />
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => adjustBalance('left')}
              className="px-8 py-4 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600"
            >
              ← Left
            </button>
            <button
              onClick={() => adjustBalance('right')}
              className="px-8 py-4 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600"
            >
              Right →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== EMOTIONAL REGULATION GAMES ====================

// Emotion Chart Game
const EmotionChartGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [emotions, setEmotions] = useState<Array<{ emotion: string; intensity: number; timestamp: Date }>>([]);
  const [selectedEmotion, setSelectedEmotion] = useState<string>('');
  const [intensity, setIntensity] = useState(5);

  const emotionOptions = ['Happy', 'Sad', 'Anxious', 'Calm', 'Excited', 'Tired', 'Focused', 'Stressed'];

  const logEmotion = () => {
    if (!selectedEmotion) return;
    setEmotions(prev => [...prev, { emotion: selectedEmotion, intensity, timestamp: new Date() }]);
    setSelectedEmotion('');
    setIntensity(5);
  };

  const completeSession = () => {
    const score = emotions.length * 15;
    onComplete({ game: 'emotion_chart', score, attempts: emotions.length });
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">← Back to Games</button>
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Emotion Chart</h3>
        <p className="text-gray-600 mb-2">Track and identify emotions</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {emotionOptions.map(emotion => (
          <button
            key={emotion}
            onClick={() => setSelectedEmotion(emotion)}
            className={`py-3 rounded-xl font-medium transition-all ${
              selectedEmotion === emotion 
                ? 'bg-rose-600 text-white' 
                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
            }`}
          >
            {emotion}
          </button>
        ))}
      </div>
      {selectedEmotion && (
        <div>
          <p className="text-sm text-gray-600 mb-2">Intensity: {intensity}/10</p>
          <input
            type="range"
            min="1"
            max="10"
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="w-full"
          />
          <button onClick={logEmotion} className="w-full mt-4 py-3 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700">
            Log Emotion
          </button>
        </div>
      )}
      {emotions.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold mb-2">Emotion Log</h4>
          <div className="space-y-2">
            {emotions.slice(-5).reverse().map((e, idx) => (
              <div key={idx} className="flex justify-between bg-white rounded-lg p-2">
                <span className="font-medium">{e.emotion} ({e.intensity}/10)</span>
                <span className="text-xs text-gray-600">{e.timestamp.toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {emotions.length > 0 && (
        <button onClick={completeSession} className="w-full py-3 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700">
          Complete Session ({emotions.length} emotions)
        </button>
      )}
    </div>
  );
};

// Self-Care Checklist Game
const SelfCareChecklistGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [activities, setActivities] = useState<Array<{ id: number; name: string; completed: boolean }>>([
    { id: 1, name: 'Drink water', completed: false },
    { id: 2, name: 'Take a walk', completed: false },
    { id: 3, name: 'Practice gratitude', completed: false },
    { id: 4, name: 'Deep breathing', completed: false },
    { id: 5, name: 'Connect with someone', completed: false },
  ]);
  const [newActivity, setNewActivity] = useState('');

  const toggleActivity = (id: number) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, completed: !a.completed } : a));
  };

  const addActivity = () => {
    if (!newActivity.trim()) return;
    setActivities(prev => [...prev, { id: Date.now(), name: newActivity, completed: false }]);
    setNewActivity('');
  };

  const completeSession = () => {
    const completed = activities.filter(a => a.completed).length;
    const score = completed * 20;
    onComplete({ game: 'self_care_checklist', score, attempts: completed });
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">← Back to Games</button>
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Self-Care Checklist</h3>
        <p className="text-gray-600 mb-2">Create and track self-care</p>
      </div>
      <div className="space-y-2">
        {activities.map(activity => (
          <button
            key={activity.id}
            onClick={() => toggleActivity(activity.id)}
            className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-between ${
              activity.completed 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            <span>{activity.name}</span>
            <span>{activity.completed ? '✓' : '○'}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newActivity}
          onChange={(e) => setNewActivity(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addActivity()}
          placeholder="Add activity..."
          className="flex-1 p-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
        />
        <button onClick={addActivity} className="px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700">
          Add
        </button>
      </div>
      <button onClick={completeSession} className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700">
        Complete ({activities.filter(a => a.completed).length}/{activities.length})
      </button>
    </div>
  );
};

// Gratitude Reflection Game
const GratitudeReflectionGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [gratitudes, setGratitudes] = useState<string[]>([]);
  const [currentGratitude, setCurrentGratitude] = useState('');

  const prompts = [
    'What made you smile today?',
    'Who are you grateful for?',
    'What are you proud of?',
    'What beauty did you notice?',
    'What opportunity are you thankful for?'
  ];
  const [currentPrompt, setCurrentPrompt] = useState(0);

  const addGratitude = () => {
    if (!currentGratitude.trim()) return;
    setGratitudes(prev => [...prev, currentGratitude]);
    setCurrentGratitude('');
    if (currentPrompt < prompts.length - 1) {
      setCurrentPrompt(prev => prev + 1);
    }
  };

  const completeSession = () => {
    const score = gratitudes.length * 25;
    onComplete({ game: 'gratitude_reflection', score, attempts: gratitudes.length });
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">← Back to Games</button>
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Gratitude Reflection</h3>
        <p className="text-gray-600 mb-2">Reflect on positive experiences</p>
      </div>
      {currentPrompt < prompts.length && (
        <div className="bg-yellow-50 rounded-xl p-6 mb-4">
          <p className="text-lg font-semibold text-yellow-800 mb-4">{prompts[currentPrompt]}</p>
          <textarea
            value={currentGratitude}
            onChange={(e) => setCurrentGratitude(e.target.value)}
            placeholder="Write your reflection..."
            className="w-full p-3 border border-yellow-300 rounded-xl focus:border-yellow-500 focus:outline-none h-24 resize-none"
          />
          <button onClick={addGratitude} className="w-full mt-4 py-3 bg-yellow-600 text-white rounded-xl font-medium hover:bg-yellow-700">
            Add Reflection
          </button>
        </div>
      )}
      {gratitudes.length > 0 && (
        <div className="bg-yellow-50 rounded-xl p-4">
          <h4 className="font-semibold mb-2">Your Reflections</h4>
          <div className="space-y-2">
            {gratitudes.map((g, idx) => (
              <div key={idx} className="bg-white rounded-lg p-3">
                <p className="text-gray-800">{g}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {currentPrompt >= prompts.length && (
        <button onClick={completeSession} className="w-full py-3 bg-yellow-600 text-white rounded-xl font-medium hover:bg-yellow-700">
          Complete Session ({gratitudes.length} reflections)
        </button>
      )}
    </div>
  );
};

// Mindful Walking Game
const MindfulWalkingGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [steps, setSteps] = useState(0);
  const [isWalking, setIsWalking] = useState(false);
  const [focusTime, setFocusTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startWalking = () => {
    setIsWalking(true);
    setSteps(0);
    setFocusTime(0);
    
    timerRef.current = setInterval(() => {
      setSteps(prev => prev + 1);
      setFocusTime(prev => prev + 1);
    }, 2000);
  };

  const stopWalking = () => {
    setIsWalking(false);
    if (timerRef.current) clearInterval(timerRef.current);
    const score = steps * 10 + focusTime * 5;
    setTimeout(() => {
      onComplete({ game: 'mindful_walking', score, attempts: steps });
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">← Back to Games</button>
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Mindful Walking</h3>
        <p className="text-gray-600 mb-2">Practice mindful walking</p>
        <div className="flex justify-center gap-4">
          <div className="bg-blue-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Steps</p>
            <p className="text-xl font-bold text-blue-600">{steps}</p>
          </div>
          <div className="bg-indigo-50 rounded-xl px-4 py-2">
            <p className="text-sm text-gray-600">Time</p>
            <p className="text-xl font-bold text-indigo-600">{focusTime}s</p>
          </div>
        </div>
      </div>
      {!isWalking && (
        <button onClick={startWalking} className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">
          Start Walking
        </button>
      )}
      {isWalking && (
        <div className="text-center">
          <div className="bg-blue-100 rounded-xl p-8 mb-4">
            <Footprints size={64} className="mx-auto mb-4 text-blue-600" />
            <p className="text-2xl font-bold text-blue-800">Step {steps}</p>
            <p className="text-gray-600 mt-2">Focus on each step</p>
          </div>
          <button onClick={stopWalking} className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">
            Complete Walk
          </button>
        </div>
      )}
    </div>
  );
};

// Self-Compassion Game
const SelfCompassionGame: React.FC<{ onComplete: (result: GameResult) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [reflections, setReflections] = useState<Array<{ prompt: string; response: string }>>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState(0);

  const prompts = [
    'What would you say to a friend in your situation?',
    'What are three things you appreciate about yourself?',
    'How have you grown recently?',
    'What kindness can you show yourself today?',
    'What strength did you show today?'
  ];

  const addReflection = () => {
    if (!currentResponse.trim()) return;
    setReflections(prev => [...prev, { prompt: prompts[currentPrompt], response: currentResponse }]);
    setCurrentResponse('');
    if (currentPrompt < prompts.length - 1) {
      setCurrentPrompt(prev => prev + 1);
    }
  };

  const completeSession = () => {
    const score = reflections.length * 30;
    onComplete({ game: 'self_compassion', score, attempts: reflections.length });
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-indigo-600 hover:text-indigo-700 mb-4">← Back to Games</button>
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold mb-2">Self-Compassion</h3>
        <p className="text-gray-600 mb-2">Practice self-kindness</p>
      </div>
      {currentPrompt < prompts.length && (
        <div className="bg-amber-50 rounded-xl p-6 mb-4">
          <p className="text-lg font-semibold text-amber-800 mb-4">{prompts[currentPrompt]}</p>
          <textarea
            value={currentResponse}
            onChange={(e) => setCurrentResponse(e.target.value)}
            placeholder="Write your reflection..."
            className="w-full p-3 border border-amber-300 rounded-xl focus:border-amber-500 focus:outline-none h-32 resize-none"
          />
          <button onClick={addReflection} className="w-full mt-4 py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700">
            Add Reflection
          </button>
        </div>
      )}
      {reflections.length > 0 && (
        <div className="bg-amber-50 rounded-xl p-4">
          <h4 className="font-semibold mb-2">Your Reflections</h4>
          <div className="space-y-3">
            {reflections.map((r, idx) => (
              <div key={idx} className="bg-white rounded-lg p-3">
                <p className="text-sm font-medium text-gray-600 mb-1">{r.prompt}</p>
                <p className="text-gray-800">{r.response}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {currentPrompt >= prompts.length && (
        <button onClick={completeSession} className="w-full py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700">
          Complete Session ({reflections.length} reflections)
        </button>
      )}
    </div>
  );
};

export default GamesHub;

