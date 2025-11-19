# Visual & Sound Effects Guide

## Overview
This guide documents all visual animations, micro-interactions, and sound effects implemented in the AiFitness app.

---

## 🎵 Sound Effects

### Location
`AiFitnessExpo/src/utils/soundEffects.ts`

### Available Sound Types

| Sound Type | Use Case | Status |
|------------|----------|--------|
| `chime` | Habit completed | ⚠️ Placeholder (file needed) |
| `tick` | Mood selected | ⚠️ Placeholder (file needed) |
| `pop` | General success | ⚠️ Placeholder (file needed) |
| `waterDroplet` | Water logged | ⚠️ Placeholder (file needed) |
| `swipe` | Food added | ⚠️ Placeholder (file needed) |
| `pageTurn` | Food DB opened | ⚠️ Placeholder (file needed) |
| `impact` | Exercise set complete | ⚠️ Placeholder (file needed) |
| `ding` | Workout finished | ⚠️ Placeholder (file needed) |
| `heartbeat` | HIIT timer | ⚠️ Placeholder (file needed) |
| `whistle` | Interval start | ⚠️ Placeholder (file needed) |
| `click` | Focus game | ⚠️ Placeholder (file needed) |
| `spark` | Win/achievement | ⚠️ Placeholder (file needed) |
| `paper` | Journaling saved | ⚠️ Placeholder (file needed) |
| `gong` | Meditation start | ⚠️ Placeholder (file needed) |
| `breathingIn` | Breathing inhale | ⚠️ Placeholder (file needed) |
| `breathingOut` | Breathing exhale | ⚠️ Placeholder (file needed) |

### Usage

```typescript
import { playSound } from '../utils/soundEffects';

// Play a sound effect
await playSound('chime'); // Habit completed
await playSound('waterDroplet'); // Water logged
await playSound('ding'); // Workout finished
```

### Sound Settings

Users can control sound effects via:
- `soundEffectsEnabled`: Toggle all sound effects on/off
- `soundscapesEnabled`: Toggle background soundscapes
- `volume`: Volume level (0.0 to 1.0)

Settings are stored in AsyncStorage under `aifit_sound_settings`.

### Adding Sound Files

1. Add sound files to `AiFitnessExpo/assets/sounds/`
2. Update `SOUND_FILES` mapping in `soundEffects.ts`:
   ```typescript
   const SOUND_FILES: Record<SoundEffectType, string | null> = {
     chime: require('../../assets/sounds/chime.mp3'),
     tick: require('../../assets/sounds/tick.mp3'),
     // ... etc
   };
   ```

### Sound File Requirements
- Format: MP3 (recommended) or WAV
- Duration: 0.5-2 seconds for effects
- Volume: Normalized to prevent clipping
- File size: Keep under 100KB per file

---

## 🎨 Visual Effects & Micro-Interactions

### Location
`AiFitnessExpo/src/components/MicroInteractions.tsx`

### Available Components

#### 1. **RippleButton**
Button with press animation (scale + opacity).

**Props:**
- `children`: React node
- `onPress`: Function to call on press
- `style?`: Optional ViewStyle
- `rippleColor?`: Ripple color (default: `rgba(59, 130, 246, 0.3)`)

**Usage:**
```typescript
import { RippleButton } from '../components/MicroInteractions';

<RippleButton onPress={() => handleAction()}>
  <Text>Press Me</Text>
</RippleButton>
```

**Animation:**
- Scale: 1.0 → 0.95 on press
- Opacity: 1.0 → 0.8 on press
- Spring animation for smooth feel

---

#### 2. **SparkleEffect**
Animated sparkles that radiate outward (for achievements/habit completion).

**Props:**
- `visible`: Boolean to trigger animation
- `size?`: Sparkle size (default: 20)
- `color?`: Sparkle color (default: `#fbbf24`)

**Usage:**
```typescript
import { SparkleEffect } from '../components/MicroInteractions';

<SparkleEffect 
  visible={habitCompleted} 
  size={24}
  color="#f59e0b"
/>
```

**Animation:**
- 6 sparkles radiate in 60° increments
- Fade in → scale up → fade out
- Duration: 600ms

---

#### 3. **BounceView**
Bouncy animation for emphasis (e.g., when adding food).

**Props:**
- `children`: React node
- `trigger`: String/number that triggers animation when changed
- `scale?`: Bounce scale (default: 1.1)

**Usage:**
```typescript
import { BounceView } from '../components/MicroInteractions';

<BounceView trigger={foodAdded}>
  <FoodCard />
</BounceView>
```

**Animation:**
- Scale: 1.0 → 1.1 → 1.0
- Spring animation with bounce
- Duration: ~400ms

---

#### 4. **GlowView**
Pulsing glow effect (e.g., for active streaks).

**Props:**
- `children`: React node
- `enabled`: Boolean to enable/disable glow
- `color?`: Glow color (default: `#fbbf24`)
- `intensity?`: Glow intensity (default: 0.5)

**Usage:**
```typescript
import { GlowView } from '../components/MicroInteractions';

<GlowView enabled={streakActive} color="#16a34a">
  <StreakBadge />
</GlowView>
```

**Animation:**
- Opacity pulse: 0.3 → 0.7 → 0.3
- Continuous loop
- Duration: 2000ms per cycle

---

## 🎯 Where Effects Are Used

### Home Screen
- **SparkleEffect**: Habit completion
- **GlowView**: Active streaks
- **RippleButton**: All interactive buttons

### Fuel Screen
- **BounceView**: When food is added
- **playSound('swipe')**: Food added
- **playSound('waterDroplet')**: Water logged
- **playSound('pageTurn')**: Opening food database

### Move Screen
- **playSound('impact')**: Exercise set complete
- **playSound('ding')**: Workout finished
- **playSound('heartbeat')**: HIIT timer
- **playSound('whistle')**: Interval start

### Wellness Screen
- **SparkleEffect**: Gratitude entry saved
- **playSound('paper')**: Journal entry saved
- **playSound('gong')**: Meditation started
- **playSound('breathingIn/Out')**: Breathing exercises

### Games Hub
- **playSound('click')**: Game interactions
- **playSound('spark')**: Win/achievement unlocked
- **SparkleEffect**: Achievement unlocked

---

## 🔧 Implementation Details

### Sound System Architecture

1. **Loading**: Sounds are lazy-loaded on first use
2. **Caching**: Loaded sounds are cached in memory
3. **Settings**: Respects user preferences (enabled/disabled, volume)
4. **Error Handling**: Gracefully fails if sound files are missing

### Visual Effects Architecture

1. **Native Driver**: All animations use `useNativeDriver: true` for 60fps
2. **Performance**: Effects are lightweight and don't block UI
3. **Accessibility**: Effects don't interfere with screen readers
4. **Customization**: Colors and sizes are configurable via props

---

## 📝 Adding New Effects

### Adding a New Sound Effect

1. Add the sound file to `assets/sounds/`
2. Add the type to `SoundEffectType` in `soundEffects.ts`
3. Add the file path to `SOUND_FILES` mapping
4. Use `playSound('newType')` in your component

### Adding a New Visual Effect

1. Create the component in `MicroInteractions.tsx`
2. Use `Animated` API with `useNativeDriver: true`
3. Export the component
4. Import and use in your screens

---

## 🎨 Design Principles

1. **Subtlety**: Effects enhance UX without being distracting
2. **Performance**: All animations run at 60fps
3. **Accessibility**: Effects can be disabled via settings
4. **Consistency**: Similar actions trigger similar effects
5. **Feedback**: Every user action should have visual/audio feedback

---

## ⚠️ Current Status

### ✅ Implemented
- Sound effect system architecture
- Visual micro-interaction components
- Settings management
- Error handling

### ⚠️ Pending
- Actual sound files (currently placeholders)
- Sound file optimization
- Additional visual effects (if needed)

---

## 📚 Related Files

- `AiFitnessExpo/src/utils/soundEffects.ts` - Sound system
- `AiFitnessExpo/src/utils/soundscapes.ts` - Background soundscapes
- `AiFitnessExpo/src/components/MicroInteractions.tsx` - Visual effects
- `AiFitnessExpo/src/pages/SoundSettings.tsx` - User settings UI

---

## 🎵 Sound File Sources

Recommended sources for free sound effects:
- [Freesound.org](https://freesound.org/)
- [Zapsplat](https://www.zapsplat.com/)
- [Adobe Stock](https://stock.adobe.com/audio)
- [Pixabay](https://pixabay.com/music/)

---

**Last Updated**: November 2025

