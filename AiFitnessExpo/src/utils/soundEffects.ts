import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sound effect types
export type SoundEffectType = 
  | 'chime'           // Habit completed
  | 'tick'            // Mood selected
  | 'pop'             // General success
  | 'waterDroplet'    // Water logged
  | 'swipe'           // Food added
  | 'pageTurn'        // Food DB opened
  | 'impact'          // Exercise set complete
  | 'ding'            // Workout finished
  | 'heartbeat'       // HIIT timer
  | 'whistle'         // Interval start
  | 'click'           // Focus game
  | 'spark'           // Win/achievement
  | 'paper'           // Journaling saved
  | 'gong'            // Meditation start
  | 'breathingIn'     // Breathing inhale
  | 'breathingOut';   // Breathing exhale

// Sound settings interface
interface SoundSettings {
  soundEffectsEnabled: boolean;
  soundscapesEnabled: boolean;
  volume: number; // 0.0 to 1.0
}

const DEFAULT_SETTINGS: SoundSettings = {
  soundEffectsEnabled: true,
  soundscapesEnabled: true,
  volume: 0.7,
};

// Sound file mapping (placeholder paths - you'll need to add actual sound files)
// For now, we'll use a try-catch approach to handle missing files gracefully
const SOUND_FILES: Record<SoundEffectType, string | null> = {
  chime: null, // require('../../assets/sounds/chime.mp3'),
  tick: null, // require('../../assets/sounds/tick.mp3'),
  pop: null, // require('../../assets/sounds/pop.mp3'),
  waterDroplet: null, // require('../../assets/sounds/water_droplet.mp3'),
  swipe: null, // require('../../assets/sounds/swipe.mp3'),
  pageTurn: null, // require('../../assets/sounds/page_turn.mp3'),
  impact: null, // require('../../assets/sounds/impact.mp3'),
  ding: null, // require('../../assets/sounds/ding.mp3'),
  heartbeat: null, // require('../../assets/sounds/heartbeat.mp3'),
  whistle: null, // require('../../assets/sounds/whistle.mp3'),
  click: null, // require('../../assets/sounds/click.mp3'),
  spark: null, // require('../../assets/sounds/spark.mp3'),
  paper: null, // require('../../assets/sounds/paper.mp3'),
  gong: null, // require('../../assets/sounds/gong.mp3'),
  breathingIn: null, // require('../../assets/sounds/breathing_in.mp3'),
  breathingOut: null, // require('../../assets/sounds/breathing_out.mp3'),
};

// Cache for loaded sounds
const soundCache: Map<SoundEffectType, Audio.Sound> = new Map();

// Load sound settings
export const loadSoundSettings = async (): Promise<SoundSettings> => {
  try {
    const settings = await AsyncStorage.getItem('aifit_sound_settings');
    if (settings) {
      return JSON.parse(settings);
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error loading sound settings:', error);
    return DEFAULT_SETTINGS;
  }
};

// Save sound settings
export const saveSoundSettings = async (settings: SoundSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem('aifit_sound_settings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving sound settings:', error);
  }
};

// Load a sound file
const loadSound = async (type: SoundEffectType): Promise<Audio.Sound | null> => {
  try {
    if (soundCache.has(type)) {
      return soundCache.get(type)!;
    }

    const soundFile = SOUND_FILES[type];
    if (!soundFile) {
      // Sound file not available yet (placeholder)
      return null;
    }

    const { sound } = await Audio.Sound.createAsync(soundFile, {
      shouldPlay: false,
      volume: 0.7,
    });

    soundCache.set(type, sound);
    return sound;
  } catch (error) {
    console.error(`Error loading sound ${type}:`, error);
    return null;
  }
};

// Play a sound effect
export const playSound = async (type: SoundEffectType): Promise<void> => {
  try {
    const settings = await loadSoundSettings();
    
    if (!settings.soundEffectsEnabled) {
      return; // Sound effects disabled
    }

    const sound = await loadSound(type);
    if (!sound) {
      // Sound file not available yet - this is expected until files are added
      // Visual effects will still work
      return;
    }

    // Reset position and play
    await sound.setPositionAsync(0);
    await sound.setVolumeAsync(settings.volume);
    await sound.playAsync();
  } catch (error) {
    // Silently fail - don't interrupt user experience
    // This is expected when sound files aren't available yet
  }
};

// Unload all sounds (call on app unmount)
export const unloadAllSounds = async (): Promise<void> => {
  try {
    for (const sound of soundCache.values()) {
      await sound.unloadAsync();
    }
    soundCache.clear();
  } catch (error) {
    console.error('Error unloading sounds:', error);
  }
};

