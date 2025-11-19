// src/app/fuel/water.tsx
// Add water screen

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { addWater } from '../../services/fuel';

const WATER_AMOUNTS = [250, 500, 750, 1000];

export default function AddWaterScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleAddWater = async (ml: number) => {
    try {
      setLoading(true);
      await addWater(user!.id, ml);
      Alert.alert('Success', `${ml}ml added!`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not add water');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Water</Text>
      <Text style={styles.subtitle}>Select amount</Text>

      <View style={styles.amountsGrid}>
        {WATER_AMOUNTS.map((amount) => (
          <TouchableOpacity
            key={amount}
            style={styles.amountButton}
            onPress={() => handleAddWater(amount)}
            disabled={loading}
          >
            <Text style={styles.amountText}>{amount}ml</Text>
          </TouchableOpacity>
        ))}
      </View>
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
    marginBottom: 32,
  },
  amountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  amountButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#2196F3',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  amountText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

