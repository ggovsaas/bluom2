import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MyRecipesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Recipes</Text>
      <Text style={styles.subtitle}>Personal recipe collection coming soon!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
});
