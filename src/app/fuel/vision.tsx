// src/app/fuel/vision.tsx
// Google Vision AI - Photo to calorie guess

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { analyzeFoodImage } from '../../services/externalFoods';
import { searchFatSecret, searchUSDA } from '../../services/externalFoods';
import { useRouter } from 'expo-router';

export default function VisionScreen() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [labels, setLabels] = useState<string[]>([]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll access');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      analyzeImage(result.assets[0].base64!);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera access');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      analyzeImage(result.assets[0].base64!);
    }
  };

  const analyzeImage = async (base64: string) => {
    try {
      setAnalyzing(true);
      setSuggestions([]);
      setLabels([]);

      // Analyze with Google Vision
      const visionResult = await analyzeFoodImage(base64);
      setLabels(visionResult.labels);

      // Search for foods based on labels
      if (visionResult.suggestions.length > 0) {
        const searchQueries = visionResult.suggestions.slice(0, 3);
        const allResults: any[] = [];

        for (const query of searchQueries) {
          const [fatsecret, usda] = await Promise.all([
            searchFatSecret(query),
            searchUSDA(query),
          ]);
          allResults.push(...fatsecret, ...usda);
        }

        // Deduplicate
        const uniqueResults = allResults.reduce((acc: any[], current) => {
          const exists = acc.find((item) => item.name.toLowerCase() === current.name.toLowerCase());
          if (!exists) {
            acc.push(current);
          }
          return acc;
        }, []);

        setSuggestions(uniqueResults.slice(0, 10));
      }
    } catch (error: any) {
      console.error('Vision analysis error:', error);
      Alert.alert('Error', error.message || 'Could not analyze image');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Food Recognition</Text>
      <Text style={styles.subtitle}>Take a photo or select from gallery</Text>

      {!image && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={takePhoto}>
            <Text style={styles.buttonText}>📷 Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>🖼️ Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      )}

      {image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
          {analyzing && (
            <View style={styles.analyzingOverlay}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.analyzingText}>Analyzing...</Text>
            </View>
          )}
        </View>
      )}

      {labels.length > 0 && (
        <View style={styles.labelsContainer}>
          <Text style={styles.sectionTitle}>Detected:</Text>
          <View style={styles.labelsList}>
            {labels.map((label, index) => (
              <View key={index} style={styles.labelTag}>
                <Text style={styles.labelText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.sectionTitle}>Suggested Foods:</Text>
          {suggestions.map((food) => (
            <TouchableOpacity
              key={food.id}
              style={styles.suggestionItem}
              onPress={() => {
                router.push({
                  pathname: '/fuel/log',
                  params: { foodId: food.id, foodData: JSON.stringify(food) },
                });
              }}
            >
              <Text style={styles.suggestionName}>{food.name}</Text>
              <Text style={styles.suggestionCalories}>{food.calories} kcal</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {image && !analyzing && (
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => {
            setImage(null);
            setSuggestions([]);
            setLabels([]);
          }}
        >
          <Text style={styles.resetButtonText}>Try Another Photo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 24,
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  imageContainer: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  labelsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  labelsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  labelTag: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  labelText: {
    color: '#4CAF50',
    fontSize: 12,
  },
  suggestionsContainer: {
    flex: 1,
  },
  suggestionItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  suggestionCalories: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

