import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

export default function ProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useUser();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: profile?.name || '',
    age: profile?.age || 0,
    weight: profile?.weight || 0,
    height: profile?.height || 0,
    weightUnit: profile?.weightUnit || 'lbs',
    heightUnit: profile?.heightUnit || 'ft'
  });

  const profileStats = [
    { 
      label: 'Days Active', 
      value: '47', 
      icon: 'calendar',
      color: '#3b82f6',
      bgColor: '#dbeafe'
    },
    { 
      label: 'Goal Progress', 
      value: '68%', 
      icon: 'locate',
      color: '#16a34a',
      bgColor: '#dcfce7'
    },
    { 
      label: 'Achievements', 
      value: '12', 
      icon: 'trophy',
      color: '#eab308',
      bgColor: '#fef3c7'
    },
  ];

  const menuItems = [
    { 
      icon: 'volume-high', 
      label: 'Sound & Haptics', 
      subtitle: 'Sound effects and soundscapes',
      action: () => navigation.navigate('SoundSettings' as never)
    },
    { 
      icon: 'settings', 
      label: 'Settings', 
      subtitle: 'App preferences and units',
      action: () => Alert.alert('Settings', 'Settings coming soon!')
    },
    { 
      icon: 'notifications', 
      label: 'Notifications', 
      subtitle: 'Manage reminders and alerts',
      action: () => navigation.navigate('NotificationSettings' as never)
    },
    { 
      icon: 'shield-checkmark', 
      label: 'Privacy & Security', 
      subtitle: 'Data and account security',
      action: () => Alert.alert('Privacy', 'Privacy settings coming soon!')
    },
    { 
      icon: 'help-circle', 
      label: 'Help & Support', 
      subtitle: 'FAQ and customer support',
      action: () => Alert.alert('Help', 'Help & Support coming soon!')
    },
  ];

  const handleEditSave = () => {
    // Convert units if needed
    let weightInKg = editForm.weight;
    let heightInCm = editForm.height;

    if (editForm.weightUnit === 'lbs') {
      weightInKg = editForm.weight * 0.453592;
    }

    if (editForm.heightUnit === 'ft') {
      heightInCm = (Math.floor(editForm.height) * 30.48) + ((editForm.height % 1) * 12 * 2.54);
    }

    updateProfile({
      ...editForm,
      weightInKg,
      heightInCm
    });
    setShowEditModal(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('aifit_onboarding_completed');
      Alert.alert('Success', 'Onboarding reset. Please restart the app.');
    } catch (error) {
      Alert.alert('Error', 'Failed to reset onboarding');
    }
  };

  const formatHeight = (height: number, unit: string) => {
    if (unit === 'ft') {
      const feet = Math.floor(height);
      const inches = Math.round((height % 1) * 12);
      return `${feet}'${inches}"`;
    }
    return `${height} cm`;
  };

  const formatWeight = (weight: number, unit: string) => {
    return `${weight} ${unit}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {profile?.name?.charAt(0) || 'U'}
                </Text>
              </View>
              {profile?.isPremium && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="diamond" size={16} color="#ffffff" />
                </View>
              )}
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setShowEditModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="create" size={16} color="#1e293b" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.profileName}>{profile?.name || 'User'}</Text>
            <Text style={styles.profileInfo}>
              {profile?.age || 0} years old • {profile?.gender || 'Not set'}
            </Text>
            <View style={styles.profileMetrics}>
              <View style={styles.metricItem}>
                <Ionicons name="scale" size={14} color="#64748b" />
                <Text style={styles.metricText}>
                  {profile?.weight ? formatWeight(profile.weight, profile.weightUnit || 'lbs') : 'Not set'}
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Ionicons name="resize" size={14} color="#64748b" />
                <Text style={styles.metricText}>
                  {profile?.height ? formatHeight(profile.height, profile.heightUnit || 'ft') : 'Not set'}
                </Text>
              </View>
            </View>
            {profile?.isPremium && (
              <View style={styles.premiumTag}>
                <Ionicons name="diamond" size={14} color="#eab308" />
                <Text style={styles.premiumTagText}>Premium Member</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {profileStats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: stat.bgColor }]}>
                <Ionicons name={stat.icon as any} size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{stat.value}</Text>
              <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Profile Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Profile</Text>
          
          <View style={styles.profileDetails}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Primary Goal</Text>
                <Text style={styles.detailValue}>{profile?.fitnessGoal || 'Not set'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Experience</Text>
                <Text style={styles.detailValue}>{profile?.experience || 'Not set'}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Daily Calories</Text>
                <Text style={styles.detailValue}>{profile?.dailyCalories || 2000} cal</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Activity Level</Text>
                <Text style={styles.detailValue}>
                  {profile?.activityLevel?.split('(')[0] || 'Not set'}
                </Text>
              </View>
            </View>

            {profile?.bmr && profile?.tdee && (
              <View style={[styles.detailRow, styles.detailRowBorder]}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>BMR</Text>
                  <Text style={styles.detailValue}>{profile.bmr} cal/day</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>TDEE</Text>
                  <Text style={styles.detailValue}>{profile.tdee} cal/day</Text>
                </View>
              </View>
            )}
            
            <View style={[styles.detailRow, styles.detailRowBorder]}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Nutrition Style</Text>
                <Text style={styles.detailValue}>{profile?.nutritionPreference || 'Not set'}</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Premium' as never)}>
                <Text style={styles.editLink}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Premium Upgrade */}
        {!profile?.isPremium && (
          <TouchableOpacity
            style={styles.premiumCard}
            onPress={() => navigation.navigate('Premium' as never)}
            activeOpacity={0.7}
          >
            <View style={styles.premiumCardContent}>
              <View style={styles.premiumCardText}>
                <Text style={styles.premiumCardTitle}>Upgrade to Premium</Text>
                <Text style={styles.premiumCardSubtitle}>
                  Unlock unlimited features and personalized coaching
                </Text>
              </View>
              <Ionicons name="diamond" size={32} color="#ffffff" />
            </View>
            <TouchableOpacity style={styles.premiumCardButton} activeOpacity={0.7}>
              <Text style={styles.premiumCardButtonText}>View Plans</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.action}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuItemIconContainer}>
                  <Ionicons name={item.icon as any} size={24} color="#64748b" />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={resetOnboarding}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>Restart Onboarding</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.signOutButton]}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out" size={20} color="#dc2626" />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 12 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowEditModal(false)}>
        <SafeAreaView style={styles.modalContent} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={editForm.name}
                onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                placeholder="Enter your name"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.input}
                value={editForm.age.toString()}
                onChangeText={(text) => setEditForm({ ...editForm, age: Number(text) || 0 })}
                keyboardType="numeric"
                placeholder="Enter your age"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weight</Text>
              <View style={styles.unitInputRow}>
                <TextInput
                  style={[styles.input, styles.unitInput]}
                  value={editForm.weight.toString()}
                  onChangeText={(text) => setEditForm({ ...editForm, weight: Number(text) || 0 })}
                  keyboardType="numeric"
                  placeholder={editForm.weightUnit === 'lbs' ? "150" : "68"}
                />
                <View style={styles.unitSelector}>
                  <TouchableOpacity
                    style={[styles.unitButton, editForm.weightUnit === 'lbs' && styles.unitButtonActive]}
                    onPress={() => setEditForm({ ...editForm, weightUnit: 'lbs' })}
                  >
                    <Text style={[styles.unitButtonText, editForm.weightUnit === 'lbs' && styles.unitButtonTextActive]}>lbs</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.unitButton, editForm.weightUnit === 'kg' && styles.unitButtonActive]}
                    onPress={() => setEditForm({ ...editForm, weightUnit: 'kg' })}
                  >
                    <Text style={[styles.unitButtonText, editForm.weightUnit === 'kg' && styles.unitButtonTextActive]}>kg</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Height</Text>
              <View style={styles.unitInputRow}>
                <TextInput
                  style={[styles.input, styles.unitInput]}
                  value={editForm.height.toString()}
                  onChangeText={(text) => setEditForm({ ...editForm, height: Number(text) || 0 })}
                  keyboardType="numeric"
                  placeholder={editForm.heightUnit === 'ft' ? "5.8" : "175"}
                />
                <View style={styles.unitSelector}>
                  <TouchableOpacity
                    style={[styles.unitButton, editForm.heightUnit === 'ft' && styles.unitButtonActive]}
                    onPress={() => setEditForm({ ...editForm, heightUnit: 'ft' })}
                  >
                    <Text style={[styles.unitButtonText, editForm.heightUnit === 'ft' && styles.unitButtonTextActive]}>ft</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.unitButton, editForm.heightUnit === 'cm' && styles.unitButtonActive]}
                    onPress={() => setEditForm({ ...editForm, heightUnit: 'cm' })}
                  >
                    <Text style={[styles.unitButtonText, editForm.heightUnit === 'cm' && styles.unitButtonTextActive]}>cm</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.inputHint}>
                {editForm.heightUnit === 'ft' ? 'Enter as decimal (e.g., 5.8 for 5\'8")' : 'Enter in centimeters'}
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleEditSave}
              >
                <Text style={styles.modalButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ebf2fe',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  profileHeader: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  premiumBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eab308',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  editButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  profileInfo: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  profileMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 14,
    color: '#64748b',
  },
  premiumTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  premiumTagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#eab308',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#ffffff',
    padding: isSmallScreen ? 12 : 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
    minHeight: isSmallScreen ? 22 : 24,
  },
  statLabel: {
    fontSize: isSmallScreen ? 10 : 12,
    color: '#64748b',
    minHeight: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  profileDetails: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  detailRowBorder: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#64748b',
  },
  editLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
    marginTop: 20,
  },
  premiumCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  premiumCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  premiumCardText: {
    flex: 1,
    paddingRight: 12,
  },
  premiumCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  premiumCardSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  premiumCardButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  premiumCardButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  menuContainer: {
    marginHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  menuItemIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  actionButtons: {
    marginHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  signOutButton: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
  // Modal styles
  modalContent: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalScroll: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1e293b',
  },
  unitInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  unitInput: {
    flex: 1,
  },
  unitSelector: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    overflow: 'hidden',
  },
  unitButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
  },
  unitButtonActive: {
    backgroundColor: '#2563eb',
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  unitButtonTextActive: {
    color: '#ffffff',
  },
  inputHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalButtonSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
});
