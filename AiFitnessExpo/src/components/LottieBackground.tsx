import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

interface LottieBackgroundProps {
  type: 'particles' | 'waves' | 'clouds' | 'fireflies' | 'aurora';
  style?: any;
}

// Placeholder component for Lottie animations
// When you add actual Lottie JSON files, update the source paths
export default function LottieBackground({ type, style }: LottieBackgroundProps) {
  // Map animation types to file paths (placeholder - add actual files later)
  const animationSources: Record<string, any> = {
    particles: null, // require('../../assets/animations/particles.json'),
    waves: null, // require('../../assets/animations/waves.json'),
    clouds: null, // require('../../assets/animations/clouds.json'),
    fireflies: null, // require('../../assets/animations/fireflies.json'),
    aurora: null, // require('../../assets/animations/aurora.json'),
  };

  const source = animationSources[type];

  // If no Lottie file, render a simple gradient placeholder
  if (!source) {
    return (
      <View
        style={[
          styles.placeholder,
          style,
          {
            backgroundColor:
              type === 'particles' ? 'rgba(59, 130, 246, 0.1)' :
              type === 'waves' ? 'rgba(6, 182, 212, 0.1)' :
              type === 'clouds' ? 'rgba(255, 255, 255, 0.1)' :
              type === 'fireflies' ? 'rgba(251, 191, 36, 0.1)' :
              'rgba(139, 92, 246, 0.1)',
          },
        ]}
      />
    );
  }

  return (
    <LottieView
      source={source}
      autoPlay
      loop
      style={[styles.animation, style]}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  animation: {
    width: width,
    height: height,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  placeholder: {
    width: width,
    height: height,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});


