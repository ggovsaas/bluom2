// src/components/FoodSearchModal.tsx
// Food search modal with FatSecret, USDA, and user foods

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { searchFatSecret, searchUSDA } from '../services/externalFoods';
import { searchUserFoods } from '../services/fuel';

interface FoodSearchModalProps {
  userId: string;
  onSelect: (food: any) => void;
  onClose: () => void;
}

export default function FoodSearchModal({ userId, onSelect, onClose }: FoodSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (query.length > 2) {
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 500); // Debounce

      return () => clearTimeout(timeoutId);
    } else {
      setResults([]);
    }
  }, [query]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      setSearching = true;
      setLoading(true);

      const [userFoods, fatsecretFoods, usdaFoods] = await Promise.all([
        searchUserFoods(query, userId),
        searchFatSecret(query),
        searchUSDA(query),
      ]);

      // Combine and deduplicate
      const allResults = [
        ...userFoods.map((f) => ({ ...f, source: 'custom' })),
        ...fatsecretFoods,
        ...usdaFoods,
      ];

      // Remove duplicates by name (simple deduplication)
      const uniqueResults = allResults.reduce((acc: any[], current) => {
        const exists = acc.find((item) => item.name.toLowerCase() === current.name.toLowerCase());
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);

      setResults(uniqueResults.slice(0, 50)); // Limit to 50 results
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const handleSelectFood = (food: any) => {
    onSelect(food);
  };

  return (
    <Modal
      visible={true}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Search Food</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search foods..."
            placeholderTextColor="#666"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
            </View>
          )}

          {!loading && results.length > 0 && (
            <ScrollView style={styles.resultsList}>
              {results.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.resultItem}
                  onPress={() => handleSelectFood(item)}
                >
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{item.name}</Text>
                    {item.brand && (
                      <Text style={styles.resultBrand}>{item.brand}</Text>
                    )}
                    <Text style={styles.resultMacros}>
                      {item.calories} kcal • {item.protein}g P • {item.carbs}g C • {item.fat}g F
                    </Text>
                    {item.source && (
                      <Text style={styles.resultSource}>
                        {item.source === 'custom' ? 'Your food' : item.source.toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.resultCalories}>{item.calories} kcal</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {!loading && query.length > 2 && results.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No results found</Text>
            </View>
          )}

          {query.length <= 2 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyHint}>Type at least 3 characters to search</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    fontSize: 32,
    color: '#aaa',
    lineHeight: 32,
  },
  searchInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  resultsList: {
    maxHeight: 500,
  },
  resultItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultBrand: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 4,
  },
  resultMacros: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
  },
  resultSource: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  resultCalories: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  emptyHint: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
});

