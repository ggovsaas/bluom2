// src/components/mindworld/MindWorldScreen.tsx
// Main Mind World screen - React Native + Web compatible

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useUser } from '../../context/UserContext';
import GardenView from './GardenView';
import DailyQuestCard from './DailyQuestCard';
import WeeklyQuestCard from './WeeklyQuestCard';
import XPBar from './XPBar';
import MindTokenBalance from './MindTokenBalance';

export default function MindWorldScreen() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'garden' | 'quests' | 'meditation' | 'games'>('garden');

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Please log in to access Mind World</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🌱 Mind Garden</Text>
        <XPBar userId={user.id} />
        <MindTokenBalance userId={user.id} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'garden' && styles.tabActive]}
          onPress={() => setActiveTab('garden')}
        >
          <Text style={[styles.tabText, activeTab === 'garden' && styles.tabTextActive]}>
            🌱 Garden
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'quests' && styles.tabActive]}
          onPress={() => setActiveTab('quests')}
        >
          <Text style={[styles.tabText, activeTab === 'quests' && styles.tabTextActive]}>
            📋 Quests
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'meditation' && styles.tabActive]}
          onPress={() => setActiveTab('meditation')}
        >
          <Text style={[styles.tabText, activeTab === 'meditation' && styles.tabTextActive]}>
            🧘 Meditate
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'games' && styles.tabActive]}
          onPress={() => setActiveTab('games')}
        >
          <Text style={[styles.tabText, activeTab === 'games' && styles.tabTextActive]}>
            🎮 Games
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'garden' && (
          <GardenView
            userId={user.id}
            onNavigate={(screen) => setActiveTab(screen as any)}
          />
        )}

        {activeTab === 'quests' && (
          <View>
            <DailyQuestCard userId={user.id} />
            <WeeklyQuestCard userId={user.id} />
          </View>
        )}

        {activeTab === 'meditation' && (
          <Text>Meditation Hub - Coming in Phase 5</Text>
        )}

        {activeTab === 'games' && (
          <Text>Games Hub - Coming in Phase 6</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
});

