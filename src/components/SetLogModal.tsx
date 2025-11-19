// src/components/SetLogModal.tsx
// Modal for logging a set (weight, reps, RPE)

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

interface SetLogModalProps {
  visible: boolean;
  exerciseName: string;
  setNumber: number;
  defaultReps?: number;
  onSave: (data: { weight?: number; reps?: number; rpe?: number }) => void;
  onClose: () => void;
}

export default function SetLogModal({
  visible,
  exerciseName,
  setNumber,
  defaultReps,
  onSave,
  onClose,
}: SetLogModalProps) {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState(defaultReps?.toString() || '');
  const [rpe, setRpe] = useState('');

  const handleSave = () => {
    onSave({
      weight: weight ? parseFloat(weight) : undefined,
      reps: reps ? parseInt(reps) : undefined,
      rpe: rpe ? parseFloat(rpe) : undefined,
    });
    setWeight('');
    setReps(defaultReps?.toString() || '');
    setRpe('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Log Set {setNumber}</Text>
            <Text style={styles.exerciseName}>{exerciseName}</Text>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#666"
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Reps</Text>
              <TextInput
                style={styles.input}
                placeholder={defaultReps?.toString() || "0"}
                placeholderTextColor="#666"
                value={reps}
                onChangeText={setReps}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>RPE (1-10, optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="8"
                placeholderTextColor="#666"
                value={rpe}
                onChangeText={setRpe}
                keyboardType="decimal-pad"
              />
              <Text style={styles.hint}>
                Rate of Perceived Exertion: How hard did this set feel?
              </Text>
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save Set</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 16,
    color: '#aaa',
  },
  content: {
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#333',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#333',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

