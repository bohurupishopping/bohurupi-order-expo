import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
  Dimensions,
  Platform,
  ColorSchemeName,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

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

const STATUS_COLORS = {
  delivered: {
    bg: 'rgba(16, 185, 129, 0.1)',
    text: '#059669',
    dark: {
      bg: 'rgba(6, 78, 59, 0.3)',
      text: '#34D399'
    }
  },
  transit: {
    bg: 'rgba(59, 130, 246, 0.1)',
    text: '#2563EB',
    dark: {
      bg: 'rgba(30, 58, 138, 0.3)',
      text: '#60A5FA'
    }
  },
  picked: {
    bg: 'rgba(139, 92, 246, 0.1)',
    text: '#7C3AED',
    dark: {
      bg: 'rgba(76, 29, 149, 0.3)',
      text: '#A78BFA'
    }
  },
  default: {
    bg: 'rgba(156, 163, 175, 0.1)',
    text: '#4B5563',
    dark: {
      bg: 'rgba(75, 85, 99, 0.3)',
      text: '#9CA3AF'
    }
  }
} as const;

function getStatusColor(status: string) {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('delivered')) return STATUS_COLORS.delivered;
  if (statusLower.includes('transit')) return STATUS_COLORS.transit;
  if (statusLower.includes('picked')) return STATUS_COLORS.picked;
  return STATUS_COLORS.default;
}

const TimelineItem = memo(({ scan, index, total }: {
  scan: TrackingData['ShipmentData'][0]['Shipment']['Scans'][0];
  index: number;
  total: number;
}) => {
  const colorScheme = useColorScheme();
  const isFirst = index === 0;
  
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withTiming(1, {
        duration: 150,
        easing: Easing.out(Easing.ease),
      });
      translateY.value = withSpring(0, {
        mass: 0.3,
        stiffness: 100,
        damping: 10
      });
    }, index * 30);
    
    return () => clearTimeout(timeout);
  }, []);
  
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }));
  
  return (
    <Animated.View style={[styles.timelineItem, animStyle]}>
      {index !== total - 1 && (
        <View style={[
          styles.timelineLine,
          { backgroundColor: colorScheme === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)' }
        ]} />
      )}
      
      <View style={[
        styles.timelineDot,
        isFirst && styles.activeTimelineDot,
        {
          backgroundColor: colorScheme === 'dark' 
            ? isFirst ? 'rgba(139, 92, 246, 0.2)' : 'rgba(75, 85, 99, 0.2)'
            : isFirst ? 'rgba(139, 92, 246, 0.1)' : 'rgba(229, 231, 235, 0.5)',
          borderColor: isFirst ? '#8B5CF6' : colorScheme === 'dark' ? '#4B5563' : '#9CA3AF'
        }
      ]}>
        <MaterialCommunityIcons
          name={isFirst ? "map-marker-radius" : "warehouse"}
          size={12}
          color={isFirst ? '#8B5CF6' : colorScheme === 'dark' ? '#6B7280' : '#4B5563'}
        />
      </View>
      
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
        
        <View style={styles.locationContainer}>
          <MaterialCommunityIcons
            name="map-marker"
            size={14}
            color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
          />
          <ThemedText style={styles.locationText}>
            {scan.ScanDetail.ScanLocation || 'Location not available'}
          </ThemedText>
        </View>
        
        {scan.ScanDetail.Instructions && (
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
        )}
      </View>
    </Animated.View>
  );
});

TimelineItem.displayName = 'TimelineItem';

const LoadingContent = memo(() => (
  <View style={styles.centerContainer}>
    <ActivityIndicator size="large" color="#8B5CF6" />
    <ThemedText style={styles.loadingText}>Loading tracking information...</ThemedText>
  </View>
));

LoadingContent.displayName = 'LoadingContent';

const ErrorContent = memo(({ error, colorScheme }: { error: string; colorScheme: ColorSchemeName }) => (
  <View style={[
    styles.errorContainer,
    {
      backgroundColor: colorScheme === 'dark' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(254, 226, 226, 1)'
    }
  ]}>
    <MaterialCommunityIcons
      name="alert-circle"
      size={24}
      color={colorScheme === 'dark' ? '#FCA5A5' : '#DC2626'}
      style={styles.errorIcon}
    />
    <ThemedText style={[
      styles.errorText,
      { color: colorScheme === 'dark' ? '#FCA5A5' : '#DC2626' }
    ]}>
      {error}
    </ThemedText>
  </View>
));

ErrorContent.displayName = 'ErrorContent';

export const FirebaseTrackingSheet = memo(({
  trackingId,
  visible,
  onClose,
}: FirebaseTrackingSheetProps) => {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(height);

  const handleDismiss = useCallback(() => {
    translateY.value = withSpring(height, {
      mass: 0.3,
      stiffness: 100,
      damping: 10
    });
    opacity.value = withTiming(0, {
      duration: 150,
      easing: Easing.out(Easing.ease),
    }, () => {
      runOnJS(onClose)();
    });
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, {
        duration: 150,
        easing: Easing.out(Easing.ease),
      });
      translateY.value = withSpring(0, {
        mass: 0.3,
        stiffness: 100,
        damping: 10
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
  const statusColors = useMemo(() => 
    currentShipment ? getStatusColor(currentShipment.Status.Status) : null, 
    [currentShipment]
  );

  const statusIcon = useMemo(() => {
    if (!currentShipment) return 'package-variant';
    const status = currentShipment.Status.Status.toLowerCase();
    if (status.includes('delivered')) return 'package-variant-closed';
    if (status.includes('transit')) return 'truck-fast';
    return 'package-variant';
  }, [currentShipment]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}>
      <View style={styles.container}>
        <Animated.View 
          style={[styles.backdrop, backdropStyle]}
          pointerEvents={visible ? 'auto' : 'none'}>
          <Pressable 
            style={styles.backdropPressable} 
            onPress={handleDismiss}
          />
        </Animated.View>

        <Animated.View 
          style={[styles.modalContainer, modalStyle]}
          pointerEvents={visible ? 'auto' : 'none'}>
          <View style={[
            styles.sheetContainer,
            { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF' }
          ]}>
            <View style={styles.dragHandle} />

            <View style={[
              styles.header,
              { backgroundColor: colorScheme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)' }
            ]}>
              <Pressable
                style={[
                  styles.closeButton,
                  { backgroundColor: colorScheme === 'dark' ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)' }
                ]}
                onPress={handleDismiss}
                android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}>
                <MaterialCommunityIcons 
                  name="arrow-left"
                  size={24}
                  color={colorScheme === 'dark' ? '#E5E7EB' : '#374151'}
                />
              </Pressable>

              <View style={styles.headerContent}>
                <View style={[
                  styles.headerIconContainer,
                  { backgroundColor: colorScheme === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)' }
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
              bounces={Platform.OS === 'ios'}
              overScrollMode="never"
              removeClippedSubviews={true}>
              {loading ? (
                <LoadingContent />
              ) : error ? (
                <ErrorContent error={error} colorScheme={colorScheme} />
              ) : currentShipment ? (
                <View style={styles.trackingContent}>
                  <View style={[
                    styles.statusContainer,
                    { backgroundColor: colorScheme === 'dark' ? statusColors?.dark.bg : statusColors?.bg }
                  ]}>
                    <View style={[
                      styles.statusIconContainer,
                      { backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.9)' }
                    ]}>
                      <MaterialCommunityIcons
                        name={statusIcon}
                        size={24}
                        color={colorScheme === 'dark' ? statusColors?.dark.text : statusColors?.text}
                      />
                    </View>
                    <ThemedText type="defaultSemiBold" style={[
                      styles.statusText,
                      { color: colorScheme === 'dark' ? statusColors?.dark.text : statusColors?.text }
                    ]}>
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
                      { backgroundColor: colorScheme === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)' }
                    ]}>
                      <View style={[
                        styles.estimatedDeliveryIcon,
                        { backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.9)' }
                      ]}>
                        <MaterialCommunityIcons
                          name="calendar-clock"
                          size={20}
                          color="#6366F1"
                        />
                      </View>
                      <View>
                        <ThemedText type="defaultSemiBold" style={[styles.estimatedDeliveryTitle, { color: '#6366F1' }]}>
                          Estimated Delivery
                        </ThemedText>
                        <ThemedText style={styles.estimatedDeliveryDate}>
                          {formatDate(currentShipment.EstimatedDeliveryDate)}
                        </ThemedText>
                      </View>
                    </View>
                  )}

                  <View style={styles.historyContainer}>
                    <View style={styles.historyHeader}>
                      <View style={[
                        styles.historyIconContainer,
                        { backgroundColor: colorScheme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)' }
                      ]}>
                        <MaterialCommunityIcons
                          name="clock-outline"
                          size={16}
                          color="#8B5CF6"
                        />
                      </View>
                      <ThemedText type="defaultSemiBold" style={styles.historyTitle}>
                        Tracking History
                      </ThemedText>
                    </View>
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
              ) : null}
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
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
    borderRadius: 12,
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  trackingContent: {
    padding: 16,
    gap: 16,
  },
  statusContainer: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  statusText: {
    fontSize: isSmallScreen ? 16 : 18,
    marginBottom: 4,
    textAlign: 'center',
  },
  statusLocation: {
    fontSize: isSmallScreen ? 13 : 14,
    opacity: 0.8,
    marginBottom: 2,
    textAlign: 'center',
  },
  statusTime: {
    fontSize: isSmallScreen ? 11 : 12,
    opacity: 0.6,
    textAlign: 'center',
  },
  estimatedDeliveryContainer: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  estimatedDeliveryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
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
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTitle: {
    fontSize: isSmallScreen ? 15 : 16,
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
  timelineDot: {
    position: 'absolute',
    left: 0,
    top: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTimelineDot: {
    borderWidth: 2,
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
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: isSmallScreen ? 12 : 13,
    opacity: 0.7,
    flex: 1,
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