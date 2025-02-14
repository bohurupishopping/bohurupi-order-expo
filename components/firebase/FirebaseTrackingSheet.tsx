import React, { memo, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '../ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { TrackingData } from '../../types/firebase-order';
import { formatDate } from '../../utils/date';
import { fetchTrackingInfo } from '../../services/api/tracking';

const { height } = Dimensions.get('window');
const isSmallScreen = Dimensions.get('window').width < 380;

interface FirebaseTrackingSheetProps {
  trackingId: string;
  visible: boolean;
  onClose: () => void;
}

const TimelineItem = memo(({ scan, index, total }: {
  scan: TrackingData['ShipmentData'][0]['Shipment']['Scans'][0];
  index: number;
  total: number;
}) => {
  const colorScheme = useColorScheme();
  
  return (
    <View style={styles.timelineItem}>
      <View style={[
        styles.timelineLine,
        index === total - 1 && styles.lastTimelineLine,
        { backgroundColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB' }
      ]} />
      <View style={[
        styles.timelineDot,
        index === 0 && styles.activeTimelineDot,
        { borderColor: index === 0 ? '#8B5CF6' : colorScheme === 'dark' ? '#4B5563' : '#9CA3AF' }
      ]} />
      <View style={[
        styles.timelineContent,
        {
          backgroundColor: colorScheme === 'dark' ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.5)',
          borderColor: colorScheme === 'dark' ? 'rgba(75, 85, 99, 0.4)' : 'rgba(229, 231, 235, 0.8)'
        }
      ]}>
        <View style={styles.timelineHeader}>
          <ThemedText type="defaultSemiBold" style={styles.scanText}>
            {scan.ScanDetail.Scan}
          </ThemedText>
          <ThemedText style={styles.timeText}>
            {formatDate(scan.ScanDetail.ScanDateTime)}
          </ThemedText>
        </View>
        <ThemedText style={styles.locationText}>
          {scan.ScanDetail.ScanLocation || 'Location not available'}
        </ThemedText>
        {scan.ScanDetail.Instructions ? (
          <View style={[
            styles.instructionsContainer,
            {
              backgroundColor: colorScheme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)'
            }
          ]}>
            <ThemedText style={styles.instructionsText}>
              {scan.ScanDetail.Instructions}
            </ThemedText>
          </View>
        ) : null}
      </View>
    </View>
  );
});

TimelineItem.displayName = 'TimelineItem';

export const FirebaseTrackingSheet = memo(({
  trackingId,
  visible,
  onClose,
}: FirebaseTrackingSheetProps) => {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();

  const translateY = useSharedValue(height);
  const opacity = useSharedValue(0);

  const handleDismiss = () => {
    translateY.value = withSpring(height, {
      damping: 15,
      stiffness: 150
    });
    opacity.value = withTiming(0, {
      duration: 200
    }, () => {
      runOnJS(onClose)();
    });
  };

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150
      });
    }
  }, [visible]);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      if (!trackingId || !visible) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await fetchTrackingInfo(trackingId);
        if (mounted) setTrackingData(data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load tracking information');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    return () => { mounted = false; };
  }, [trackingId, visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const currentShipment = trackingData?.ShipmentData[0]?.Shipment;

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <ThemedText style={styles.loadingText}>Loading tracking information...</ThemedText>
        </View>
      );
    }

    if (error) {
      return (
        <View style={[
          styles.errorContainer,
          { backgroundColor: colorScheme === 'dark' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(254, 226, 226, 1)' }
        ]}>
          <ThemedText style={[styles.errorText, { color: colorScheme === 'dark' ? '#FCA5A5' : '#DC2626' }]}>
            {error}
          </ThemedText>
        </View>
      );
    }

    if (!currentShipment) {
      return (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>No tracking information available</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.trackingContent}>
        <View style={[
          styles.statusContainer,
          {
            backgroundColor: colorScheme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)'
          }
        ]}>
          <ThemedText type="defaultSemiBold" style={[styles.statusText, { color: '#8B5CF6' }]}>
            {currentShipment.Status.Status}
          </ThemedText>
          <ThemedText style={styles.statusLocation}>
            {currentShipment.Status.StatusLocation}
          </ThemedText>
          <ThemedText style={styles.statusTime}>
            {formatDate(currentShipment.Status.StatusDateTime)}
          </ThemedText>
        </View>

        {currentShipment.EstimatedDeliveryDate && (
          <View style={[
            styles.estimatedDeliveryContainer,
            {
              backgroundColor: colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)'
            }
          ]}>
            <ThemedText type="defaultSemiBold" style={[styles.estimatedDeliveryTitle, { color: '#6366F1' }]}>
              Estimated Delivery
            </ThemedText>
            <ThemedText style={styles.estimatedDeliveryDate}>
              {formatDate(currentShipment.EstimatedDeliveryDate)}
            </ThemedText>
          </View>
        )}

        <View style={styles.historyContainer}>
          <ThemedText type="defaultSemiBold" style={styles.historyTitle}>
            Tracking History
          </ThemedText>
          <View style={styles.timeline}>
            {currentShipment.Scans.map((scan, index) => (
              <TimelineItem
                key={`${scan.ScanDetail.ScanDateTime}-${index}`}
                scan={scan}
                index={index}
                total={currentShipment.Scans.length}
              />
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}>
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={styles.backdropPressable} onPress={handleDismiss} />
        </Animated.View>

        <Animated.View style={[styles.modalContainer, modalStyle]}>
          <View style={[
            styles.sheetContainer,
            {
              backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF'
            }
          ]}>
            <View style={styles.dragHandle} />

            <View style={[
              styles.header,
              {
                backgroundColor: colorScheme === 'dark' 
                  ? 'rgba(88, 28, 135, 0.1)' 
                  : 'rgba(139, 92, 246, 0.1)'
              }
            ]}>
              <Pressable
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: colorScheme === 'dark' 
                      ? 'rgba(31, 41, 55, 0.8)' 
                      : 'rgba(255, 255, 255, 0.8)'
                  }
                ]}
                onPress={handleDismiss}>
                <MaterialCommunityIcons 
                  name="arrow-left"
                  size={24}
                  color={colorScheme === 'dark' ? '#E5E7EB' : '#374151'}
                />
              </Pressable>

              <View style={styles.headerContent}>
                <View style={[
                  styles.headerIconContainer,
                  {
                    backgroundColor: colorScheme === 'dark' 
                      ? 'rgba(139, 92, 246, 0.2)' 
                      : 'rgba(139, 92, 246, 0.1)'
                  }
                ]}>
                  <MaterialCommunityIcons
                    name="truck-delivery"
                    size={20}
                    color="#8B5CF6"
                  />
                </View>
                <ThemedText type="title" style={styles.trackingTitle}>
                  Tracking #{trackingId}
                </ThemedText>
              </View>
            </View>

            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              bounces={true}>
              {renderContent()}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
});

FirebaseTrackingSheet.displayName = 'FirebaseTrackingSheet';

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
    height: '95%',
    backgroundColor: 'transparent',
  },
  sheetContainer: {
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    marginBottom: 8,
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
  trackingTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    opacity: 0.7,
  },
  errorContainer: {
    padding: 16,
    borderRadius: 8,
    margin: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  trackingContent: {
    padding: 16,
    gap: 16,
  },
  statusContainer: {
    padding: 16,
    borderRadius: 12,
  },
  statusText: {
    fontSize: isSmallScreen ? 16 : 18,
    marginBottom: 4,
  },
  statusLocation: {
    fontSize: isSmallScreen ? 13 : 14,
    opacity: 0.8,
    marginBottom: 2,
  },
  statusTime: {
    fontSize: isSmallScreen ? 11 : 12,
    opacity: 0.6,
  },
  estimatedDeliveryContainer: {
    padding: 16,
    borderRadius: 12,
  },
  estimatedDeliveryTitle: {
    fontSize: isSmallScreen ? 14 : 15,
    marginBottom: 4,
  },
  estimatedDeliveryDate: {
    fontSize: isSmallScreen ? 13 : 14,
    opacity: 0.8,
  },
  historyContainer: {
    gap: 12,
  },
  historyTitle: {
    fontSize: isSmallScreen ? 15 : 16,
    fontWeight: '600',
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    position: 'relative',
    paddingLeft: 24,
    paddingBottom: 16,
  },
  timelineLine: {
    position: 'absolute',
    left: 7,
    top: 12,
    bottom: 0,
    width: 2,
  },
  lastTimelineLine: {
    display: 'none',
  },
  timelineDot: {
    position: 'absolute',
    left: 0,
    top: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
  },
  activeTimelineDot: {
    backgroundColor: '#EEF2FF',
  },
  timelineContent: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  scanText: {
    flex: 1,
    fontSize: isSmallScreen ? 13 : 14,
    marginRight: 8,
  },
  timeText: {
    fontSize: isSmallScreen ? 11 : 12,
    opacity: 0.7,
  },
  locationText: {
    fontSize: isSmallScreen ? 12 : 13,
    opacity: 0.7,
  },
  instructionsContainer: {
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
  },
  instructionsText: {
    fontSize: isSmallScreen ? 11 : 12,
    opacity: 0.8,
  },
}); 