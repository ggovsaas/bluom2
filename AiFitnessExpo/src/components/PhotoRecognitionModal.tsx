import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

interface RecognizedItem {
  name: string;
  confidence: number;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    servingSize: string;
    source: string;
  } | null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onAddFood: (item: any, quantity: number, meal: string) => void;
  meal: string;
}

export default function PhotoRecognitionModal({ visible, onClose, onAddFood, meal }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [recognizedItems, setRecognizedItems] = useState<RecognizedItem[]>([]);
  const [visionSource, setVisionSource] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<{[key: number]: number}>({});
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible]);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        setCapturedImage(photo.base64);
      } catch (err) {
        console.error('Error taking picture:', err);
        setError('Failed to capture photo');
      }
    }
  };

  const resizeBase64Image = (base64: string, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve) => {
      // For React Native, we'll use the image as-is since resizing requires additional libraries
      // The server will handle any necessary resizing
      resolve(base64);
    });
  };

  const recognizeFood = async () => {
    if (!capturedImage) return;

    try {
      setIsProcessing(true);
      setError(null);

      // Get session for auth
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Please log in to use photo recognition');
        return;
      }

      // Call Edge Function
      const apiUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/clarifai-recognize`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: capturedImage }),
      });

      const result = await response.json();

      if (result.error === 'recognition_failed') {
        setError("We couldn't recognize the food. Please try a clearer photo or enter items manually.");
        return;
      }

      if (result.error === 'server_error') {
        setError('Recognition Service Error. Please try again later.');
        return;
      }

      if (result.success && result.results && result.results.length > 0) {
        setRecognizedItems(result.results);
        setVisionSource(result.vision_source);

        // Initialize quantities to 1
        const initialQuantities: {[key: number]: number} = {};
        result.results.forEach((_: any, index: number) => {
          initialQuantities[index] = 1;
        });
        setQuantities(initialQuantities);

        // Log to database
        await logRecognition(result.results, result.vision_source);
      } else {
        setError('No food items detected in the image');
      }
    } catch (err) {
      console.error('Recognition error:', err);
      setError('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const logRecognition = async (items: any[], visionSource: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('food_recognition_logs').insert({
        user_id: user.id,
        detected_items: items,
        vision_source: visionSource,
        language: 'en',
        success: true,
      });
    } catch (error) {
      console.error('Failed to log recognition:', error);
    }
  };

  const handleAddFood = (item: RecognizedItem, index: number) => {
    if (!item.nutrition) {
      Alert.alert('No Nutrition Data', 'This item has no nutrition information available.');
      return;
    }

    const quantity = quantities[index] || 1;
    onAddFood({
      name: item.name,
      calories: item.nutrition.calories,
      protein: item.nutrition.protein,
      carbs: item.nutrition.carbs,
      fat: item.nutrition.fat,
      serving_size: item.nutrition.servingSize,
    }, quantity, meal);
  };

  const handleClose = () => {
    setCapturedImage(null);
    setRecognizedItems([]);
    setQuantities({});
    setError(null);
    setVisionSource('');
    onClose();
  };

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.container}>
          <View style={styles.permissionContainer}>
            <Ionicons name="camera-outline" size={64} color="#6b7280" />
            <Text style={styles.permissionText}>Camera permission required</Text>
            <TouchableOpacity style={styles.button} onPress={requestPermission}>
              <Text style={styles.buttonText}>Grant Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent={false} animationType="slide">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Food Recognition</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#1f2937" />
          </TouchableOpacity>
        </View>

        {recognizedItems.length > 0 ? (
          // Results View
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <View style={styles.resultsHeader}>
              <Ionicons name="sparkles" size={32} color="#10b981" />
              <Text style={styles.resultsTitle}>
                Detected {recognizedItems.length} Food Item{recognizedItems.length > 1 ? 's' : ''}
              </Text>
              <Text style={styles.resultsSubtitle}>
                Recognized by {visionSource === 'clarifai' ? 'Clarifai' : 'OpenAI GPT-4o'}
              </Text>
            </View>

            {recognizedItems.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemConfidence}>
                    {Math.round(item.confidence * 100)}% confident
                  </Text>
                </View>

                {item.nutrition ? (
                  <View style={styles.nutritionCard}>
                    <View style={styles.nutritionRow}>
                      <View style={styles.nutritionInfo}>
                        <Text style={styles.caloriesText}>
                          {Math.round(item.nutrition.calories * (quantities[index] || 1))} cal
                        </Text>
                        <View style={styles.macrosRow}>
                          <Text style={styles.macroText}>
                            P: {Math.round(item.nutrition.protein * (quantities[index] || 1))}g
                          </Text>
                          <Text style={styles.macroText}>
                            C: {Math.round(item.nutrition.carbs * (quantities[index] || 1))}g
                          </Text>
                          <Text style={styles.macroText}>
                            F: {Math.round(item.nutrition.fat * (quantities[index] || 1))}g
                          </Text>
                        </View>
                      </View>

                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          onPress={() => {
                            const newQty = Math.max(0.5, (quantities[index] || 1) - 0.5);
                            setQuantities({...quantities, [index]: newQty});
                          }}
                          style={styles.quantityButton}
                        >
                          <Text style={styles.quantityButtonText}>-</Text>
                        </TouchableOpacity>
                        <TextInput
                          style={styles.quantityInput}
                          value={String(quantities[index] || 1)}
                          onChangeText={(text) => {
                            const val = parseFloat(text);
                            if (!isNaN(val) && val >= 0.5) {
                              setQuantities({...quantities, [index]: val});
                            }
                          }}
                          keyboardType="decimal-pad"
                        />
                        <TouchableOpacity
                          onPress={() => {
                            const newQty = (quantities[index] || 1) + 0.5;
                            setQuantities({...quantities, [index]: newQty});
                          }}
                          style={styles.quantityButton}
                        >
                          <Text style={styles.quantityButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={styles.servingText}>
                      {item.nutrition.servingSize} • {item.nutrition.source.toUpperCase()}
                    </Text>

                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => handleAddFood(item, index)}
                    >
                      <Text style={styles.addButtonText}>Add to {meal}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.warningCard}>
                    <Ionicons name="warning" size={16} color="#d97706" />
                    <Text style={styles.warningText}>
                      No nutrition data found for this item
                    </Text>
                  </View>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.retryButton} onPress={() => {
              setCapturedImage(null);
              setRecognizedItems([]);
              setQuantities({});
              setError(null);
            }}>
              <Ionicons name="camera-outline" size={20} color="#6b7280" />
              <Text style={styles.retryButtonText}>Scan Another Photo</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : capturedImage ? (
          // Captured Image View
          <View style={styles.contentContainer}>
            <Text style={styles.instruction}>Photo captured! Tap Analyze to recognize foods.</Text>

            {error && (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {isProcessing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.processingText}>Analyzing your food...</Text>
              </View>
            ) : (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.analyzeButton]}
                  onPress={recognizeFood}
                >
                  <Ionicons name="sparkles" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Analyze</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.retakeButton]}
                  onPress={() => {
                    setCapturedImage(null);
                    setError(null);
                  }}
                >
                  <Text style={[styles.actionButtonText, styles.retakeButtonText]}>Retake</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          // Camera View
          <View style={styles.contentContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="back"
            >
              <View style={styles.cameraOverlay}>
                <Text style={styles.instruction}>Position food in the frame</Text>
              </View>
            </CameraView>

            {error && (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 8,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  camera: {
    width: width - 32,
    height: height * 0.5,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    padding: 16,
  },
  instruction: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3b82f6',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  analyzeButton: {
    backgroundColor: '#10b981',
  },
  retakeButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  retakeButtonText: {
    color: '#6b7280',
  },
  processingContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  processingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6b7280',
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 12,
  },
  resultsSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  itemCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemHeader: {
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  itemConfidence: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  nutritionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nutritionInfo: {
    flex: 1,
  },
  caloriesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macroText: {
    fontSize: 12,
    color: '#6b7280',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  quantityInput: {
    width: 48,
    height: 32,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 14,
  },
  servingText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#d97706',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
});
