import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Picker } from '@react-native-picker/picker';
import Animated, { 
  FadeIn,
  SlideInUp,
  SlideOutDown,
  FadeOut,
  useAnimatedStyle, 
  withSpring, 
  useSharedValue, 
  withTiming,
  runOnJS
} from 'react-native-reanimated';

import { ThemedText } from '../ThemedText';
import { FirebaseOrder } from '@/types/firebase-order';
import { updateFirebaseOrder } from '@/services/api/firebase-orders';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 380;

interface OrderEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrder: FirebaseOrder | null;
  onSuccess?: () => void;
}

const initialFormState: Partial<FirebaseOrder> = {
  status: 'pending',
  orderstatus: 'Prepaid',
  trackingId: '',
  designUrl: '',
};

function FormField({ 
  label, 
  children 
}: { 
  label: string; 
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      {children}
    </View>
  );
}

export function OrderEditModal({ isOpen, onClose, selectedOrder, onSuccess }: OrderEditModalProps) {
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<FirebaseOrder>>(initialFormState);

  const translateY = useSharedValue(height);
  const opacity = useSharedValue(0);

  const handleDismiss = useCallback(() => {
    translateY.value = withSpring(height, {
      damping: 15,
      stiffness: 150
    });
    opacity.value = withTiming(0, {
      duration: 200
    }, () => {
      runOnJS(onClose)();
    });
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedOrder) {
      setFormData({
        ...initialFormState,
        ...selectedOrder,
        status: selectedOrder.status || initialFormState.status,
        orderstatus: selectedOrder.orderstatus || initialFormState.orderstatus,
        trackingId: selectedOrder.trackingId || '',
        designUrl: selectedOrder.designUrl || '',
      });
    } else {
      setFormData(initialFormState);
    }
  }, [selectedOrder]);

  const handleChange = useCallback((name: keyof FirebaseOrder, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedOrder?.id) return;
    
    setLoading(true);
    try {
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Validate tracking ID if provided
      if (formData.trackingId) {
        const trackingPattern = /^[A-Z0-9]{8,15}$/;
        if (!trackingPattern.test(formData.trackingId.trim())) {
          if (Platform.OS !== 'web') {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          }
          return;
        }
      }

      const updateData = {
        status: formData.status,
        orderstatus: formData.orderstatus,
        trackingId: formData.trackingId,
        designUrl: formData.designUrl,
        updatedAt: new Date().toISOString(),
      };

      await updateFirebaseOrder(selectedOrder.id, updateData);
      onSuccess?.();
      handleDismiss();
    } catch (error) {
      console.error('Error updating order:', error);
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedOrder, formData, onSuccess, handleDismiss]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!isOpen || !selectedOrder) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={styles.backdropPressable} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}} onPress={handleDismiss} />
        </Animated.View>

        <Animated.View style={[styles.modalContainer, modalStyle]}>
          <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#111827' : '#FFFFFF' }]}>
            <View style={styles.dragHandle} />

            <View style={[styles.header, { 
              backgroundColor: colorScheme === 'dark' ? 'rgba(31, 41, 55, 0.9)' : 'rgba(249, 250, 251, 0.9)',
              borderBottomColor: colorScheme === 'dark' ? 'rgba(55, 65, 81, 0.4)' : 'rgba(229, 231, 235, 0.4)'
            }]}>
              <Pressable
                style={[
                  styles.closeButton,
                  { 
                    backgroundColor: colorScheme === 'dark' ? 'rgba(55, 65, 81, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    borderColor: colorScheme === 'dark' ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.3)'
                  }
                ]}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                onPress={handleDismiss}
              >
                <MaterialCommunityIcons 
                  name="close"
                  size={24}
                  color={colorScheme === 'dark' ? '#D1D5DB' : '#4B5563'}
                />
              </Pressable>

              <View style={styles.headerContent}>
                <View style={[styles.headerIconContainer, { 
                  backgroundColor: colorScheme === 'dark' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
                  borderColor: colorScheme === 'dark' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'
                }]}>
                  <MaterialCommunityIcons
                    name="pencil"
                    size={20}
                    color="#8B5CF6"
                  />
                </View>
                <ThemedText type="title" style={[styles.formTitle, { color: colorScheme === 'dark' ? '#F3F4F6' : '#1F2937' }]}>
                  Edit Order
                </ThemedText>
              </View>
            </View>

            <View style={styles.formContent}>
              <FormField label="Order Status">
                <View style={[styles.input, { 
                  backgroundColor: colorScheme === 'dark' ? 'rgba(17, 24, 39, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                  borderColor: colorScheme === 'dark' ? 'rgba(79, 70, 229, 0.4)' : 'rgba(139, 92, 246, 0.4)'
                }]}>
                  <Picker
                    selectedValue={formData.status}
                    onValueChange={(value: string) => handleChange('status', value)}
                    style={[styles.picker, { color: colorScheme === 'dark' ? '#E5E7EB' : '#1F2937' }]}
                    dropdownIconColor={colorScheme === 'dark' ? '#E5E7EB' : '#6B7280'}
                  >
                    <Picker.Item 
                      label="PENDING" 
                      value="pending" 
                      style={{ color: colorScheme === 'dark' ? '#E5E7EB' : '#1F2937' }} 
                    />
                    <Picker.Item 
                      label="COMPLETED" 
                      value="completed" 
                      style={{ color: colorScheme === 'dark' ? '#E5E7EB' : '#1F2937' }}
                    />
                  </Picker>
                </View>
              </FormField>

              <FormField label="Payment Status">
                <View style={[styles.input, { 
                  backgroundColor: colorScheme === 'dark' ? 'rgba(17, 24, 39, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                  borderColor: colorScheme === 'dark' ? 'rgba(79, 70, 229, 0.4)' : 'rgba(139, 92, 246, 0.4)'
                }]}>
                  <Picker
                    selectedValue={formData.orderstatus}
                    onValueChange={(value: string) => handleChange('orderstatus', value)}
                    style={[styles.picker, { color: colorScheme === 'dark' ? '#E5E7EB' : '#1F2937' }]}
                    dropdownIconColor={colorScheme === 'dark' ? '#E5E7EB' : '#6B7280'}
                  >
                    <Picker.Item 
                      label="Prepaid" 
                      value="Prepaid" 
                      style={{ color: colorScheme === 'dark' ? '#E5E7EB' : '#1F2937' }}
                    />
                    <Picker.Item 
                      label="COD" 
                      value="COD" 
                      style={{ color: colorScheme === 'dark' ? '#E5E7EB' : '#1F2937' }}
                    />
                  </Picker>
                </View>
              </FormField>

              <FormField label="Tracking/AWB Number">
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      backgroundColor: colorScheme === 'dark' ? 'rgba(17, 24, 39, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                      color: colorScheme === 'dark' ? '#F3F4F6' : '#1F2937',
                      borderColor: colorScheme === 'dark' ? 'rgba(79, 70, 229, 0.4)' : 'rgba(139, 92, 246, 0.4)'
                    }
                  ]}
                  value={formData.trackingId}
                  onChangeText={(value) => handleChange('trackingId', value)}
                  placeholder="Enter tracking number"
                  placeholderTextColor={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'}
                />
              </FormField>

              <FormField label="Design URL">
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      backgroundColor: colorScheme === 'dark' ? 'rgba(17, 24, 39, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                      color: colorScheme === 'dark' ? '#F3F4F6' : '#1F2937',
                      borderColor: colorScheme === 'dark' ? 'rgba(79, 70, 229, 0.4)' : 'rgba(139, 92, 246, 0.4)'
                    }
                  ]}
                  value={formData.designUrl}
                  onChangeText={(value) => handleChange('designUrl', value)}
                  placeholder="Enter design URL"
                  placeholderTextColor={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'}
                />
              </FormField>
            </View>

            <View style={styles.footer}>
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.cancelButton,
                  {
                    opacity: pressed ? 0.7 : 1,
                    backgroundColor: colorScheme === 'dark' ? 'rgba(31, 41, 55, 0.7)' : 'rgba(249, 250, 251, 0.7)',
                    borderColor: colorScheme === 'dark' ? 'rgba(55, 65, 81, 0.4)' : 'rgba(209, 213, 219, 0.4)'
                  }
                ]}
                onPress={handleDismiss}
              >
                <ThemedText style={{ color: colorScheme === 'dark' ? '#E5E7EB' : '#374151' }}>
                  Cancel
                </ThemedText>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.submitButton,
                  { opacity: pressed ? 0.7 : 1 }
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.submitButtonText}>
                    Save Changes
                  </ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropPressable: {
    flex: 1,
  },
  modalContainer: {
    height: '90%',
    backgroundColor: 'transparent',
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(156, 163, 175, 0.4)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(75, 85, 99, 0.2)',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    paddingTop: 4,
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  formTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  formContent: {
    flex: 1,
    padding: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#6B7280',
    fontWeight: '500',
  },
  input: {
    height: 60,
    paddingVertical: 12,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    justifyContent: 'center',
  },
  picker: {
    height: 60,
    width: '100%',
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(75, 85, 99, 0.15)',
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.15)',
  },
  submitButton: {
    backgroundColor: '#8B5CF6',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
