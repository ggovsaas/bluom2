import React, { useRef, useEffect } from 'react';
import { Animated, TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Ripple effect for button presses
export const RippleButton: React.FC<{
  children: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
  rippleColor?: string;
}> = ({ children, onPress, style, rippleColor = 'rgba(59, 130, 246, 0.3)' }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={style}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        }}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Sparkle effect for habit completion
export const SparkleEffect: React.FC<{
  visible: boolean;
  size?: number;
  color?: string;
}> = ({ visible, size = 20, color = '#fbbf24' }) => {
  const sparkles = useRef(
    Array.from({ length: 6 }, () => ({
      x: useRef(new Animated.Value(0)).current,
      y: useRef(new Animated.Value(0)).current,
      opacity: useRef(new Animated.Value(0)).current,
      scale: useRef(new Animated.Value(0)).current,
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      sparkles.forEach((sparkle, index) => {
        const angle = (index * 60 * Math.PI) / 180;
        const distance = 30;
        
        Animated.parallel([
          Animated.timing(sparkle.x, {
            toValue: Math.cos(angle) * distance,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(sparkle.y, {
            toValue: Math.sin(angle) * distance,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(sparkle.opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(sparkle.opacity, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.spring(sparkle.scale, {
              toValue: 1.5,
              useNativeDriver: true,
            }),
            Animated.timing(sparkle.scale, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          sparkle.x.setValue(0);
          sparkle.y.setValue(0);
          sparkle.opacity.setValue(0);
          sparkle.scale.setValue(0);
        });
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.sparkleContainer} pointerEvents="none">
      {sparkles.map((sparkle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.sparkle,
            {
              width: size,
              height: size,
              transform: [
                { translateX: sparkle.x },
                { translateY: sparkle.y },
                { scale: sparkle.scale },
              ],
              opacity: sparkle.opacity,
            },
          ]}
        >
          <Ionicons name="star" size={size} color={color} />
        </Animated.View>
      ))}
    </View>
  );
};

// Bounce animation for mood icons
export const BounceView: React.FC<{
  children: React.ReactNode;
  trigger: boolean;
  style?: ViewStyle;
}> = ({ children, trigger, style }) => {
  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (trigger) {
      Animated.sequence([
        Animated.spring(bounceAnim, {
          toValue: 1.2,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [trigger]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ scale: bounceAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Glow effect for sleep log
export const GlowView: React.FC<{
  children: React.ReactNode;
  visible: boolean;
  color?: string;
  style?: ViewStyle;
}> = ({ children, visible, color = '#3b82f6', style }) => {
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      glowAnim.setValue(0);
    }
  }, [visible]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <View style={[style, { position: 'relative' }]}>
      {visible && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: color,
              opacity: glowOpacity,
              borderRadius: 12,
              shadowColor: color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: 20,
              elevation: 10,
            },
          ]}
          pointerEvents="none"
        />
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  sparkleContainer: {
    position: 'absolute',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    top: -40,
    left: -40,
    zIndex: 1000,
  },
  sparkle: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

