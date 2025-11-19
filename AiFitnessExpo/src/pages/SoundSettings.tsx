import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { loadSoundSettings, saveSoundSettings } from '../utils/soundEffects';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

export default function SoundSettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);
  const [soundscapesEnabled, setSoundscapesEnabled] = useState(true);
  const [volume, setVolume] = useState(0.7);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await loadSoundSettings();
    setSoundEffectsEnabled(settings.soundEffectsEnabled);
    setSoundscapesEnabled(settings.soundscapesEnabled);
    setVolume(settings.volume);
  };

  const handleSoundEffectsToggle = async (value: boolean) => {
    setSoundEffectsEnabled(value);
    await saveSoundSettings({
      soundEffectsEnabled: value,
      soundscapesEnabled,
      volume,
    });
  };

  const handleSoundscapesToggle = async (value: boolean) => {
    setSoundscapesEnabled(value);
    await saveSoundSettings({
      soundEffectsEnabled,
      soundscapesEnabled: value,
      volume,
    });
  };

  const handleVolumeChange = async (newVolume: number) => {
    setVolume(newVolume);
    await saveSoundSettings({
      soundEffectsEnabled,
      soundscapesEnabled,
      volume: newVolume,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>Sound & Haptics</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Sound Effects Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="volume-high" size={24} color="#3b82f6" />
            <Text style={styles.sectionTitle}>Sound Effects</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Enable sound effects for UI interactions like completing habits, logging meals, and more.
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Sound Effects</Text>
              <Text style={styles.settingSubtext}>Play sounds for actions</Text>
            </View>
            <Switch
              value={soundEffectsEnabled}
              onValueChange={handleSoundEffectsToggle}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Soundscapes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="musical-notes" size={24} color="#14b8a6" />
            <Text style={styles.sectionTitle}>Soundscapes</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Enable background soundscapes for meditation, focus, and relaxation sessions.
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Soundscapes</Text>
              <Text style={styles.settingSubtext}>Background ambient sounds</Text>
            </View>
            <Switch
              value={soundscapesEnabled}
              onValueChange={handleSoundscapesToggle}
              trackColor={{ false: '#e5e7eb', true: '#14b8a6' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Volume Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="volume-medium" size={24} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Volume</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Adjust the volume for all sounds and soundscapes.
          </Text>

          <View style={styles.volumeContainer}>
            <View style={styles.volumeLabels}>
              <Text style={styles.volumeLabel}>0%</Text>
              <Text style={styles.volumeLabel}>50%</Text>
              <Text style={styles.volumeLabel}>100%</Text>
            </View>
            <View style={styles.volumeSliderContainer}>
              <View style={styles.volumeSliderTrack}>
                <View
                  style={[
                    styles.volumeSliderFill,
                    { width: `${volume * 100}%` },
                  ]}
                />
              </View>
              <View style={styles.volumeButtons}>
                {[0, 0.25, 0.5, 0.75, 1.0].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.volumeButton,
                      volume >= value && styles.volumeButtonActive,
                    ]}
                    onPress={() => handleVolumeChange(value)}
                    activeOpacity={0.7}
                  />
                ))}
              </View>
            </View>
            <Text style={styles.volumeValue}>{Math.round(volume * 100)}%</Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle" size={20} color="#64748b" />
          <Text style={styles.infoText}>
            Sound files are not yet available. When you add sound files to the assets folder,
            they will automatically be enabled.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 16,
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  sectionDescription: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: isSmallScreen ? 15 : 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4,
  },
  settingSubtext: {
    fontSize: isSmallScreen ? 12 : 13,
    color: '#64748b',
  },
  volumeContainer: {
    marginTop: 8,
  },
  volumeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  volumeLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  volumeSliderContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  volumeSliderTrack: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    position: 'relative',
  },
  volumeSliderFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  volumeButtons: {
    position: 'absolute',
    top: -8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  volumeButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  volumeButtonActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#3b82f6',
  },
  volumeValue: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginTop: 8,
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    margin: 24,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: isSmallScreen ? 12 : 13,
    color: '#64748b',
    lineHeight: 18,
  },
});


