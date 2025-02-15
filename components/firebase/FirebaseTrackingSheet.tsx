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
    bg: 'rgba(22, 163, 74, 0.2)', // More vibrant green
    text: '#16A34A',
    dark: {
      bg: 'rgba(22, 163, 74, 0.3)',
      text: '#4ADE80' // Brighter green
    }
  },
  transit: {
    bg: 'rgba(60, 131, 246, 0.2)', // Vibrant blue
    text: '#3C83F6',
    dark: {
      bg: 'rgba(60, 131, 246, 0.3)',
      text: '#60A5FA'
    }
  },
  picked: {
    bg: 'rgba(168, 85, 247, 0.2)', // Vibrant purple
    text: '#A855F7',
    dark: {
      bg: 'rgba(168, 85, 247, 0.3)',
      text: '#C084FC' // Brighter purple
    }
  },
  default: {
    bg: 'rgba(166, 180, 208, 0.2)', // Soft gray-blue
    text: '#6B7280',
    dark: {
      bg: 'rgba(166, 180, 208, 0.3)',
      text: '#A1A1AA'
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
      opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) }); // Smoother easing
      translateY.value = withSpring(0, { mass: 0.5, stiffness: 120, damping: 14 }); // More refined spring
    }, index * 50); // Increased delay for a more staggered effect

    return () => clearTimeout(timeout);
  }, [index]); // Only re-run if index changes

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.timelineItem, animStyle]}>
      {index !== total - 1 && (
        <Animated.View style={[
          styles.timelineLine,
          { backgroundColor: colorScheme === 'dark' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(168, 85, 247, 0.2)' } // More vibrant line color
        ]} />
      )}

      <View style={[
        styles.timelineDot,
        isFirst && styles.activeTimelineDot,
        {
          backgroundColor: colorScheme === 'dark'
            ? isFirst ? 'rgba(168, 85, 247, 0.3)' : 'rgba(107, 114, 128, 0.3)' // Darker and more vibrant dot
            : isFirst ? 'rgba(168, 85, 247, 0.2)' : 'rgba(229, 231, 235, 0.7)', // Lighter and more vibrant dot
          borderColor: isFirst ? '#A855F7' : colorScheme === 'dark' ? '#6B7280' : '#9CA3AF',
          // ...Platform.select({ // Consistent, more pronounced shadow
          //   ios: {
          //     shadowColor: isFirst ? '#A855F7' : '#000',
          //     shadowOffset: { width: 0, height: 2 },
          //     shadowOpacity: isFirst ? 0.3 : 0.2,
          //     shadowRadius: 4,
          //   },
          //   android: {
          //     elevation: isFirst ? 6 : 3,
          //   },
          // }),
        }
      ]}>
        <MaterialCommunityIcons
          name={isFirst ? "map-marker-radius" : "warehouse"}
          size={14}  // Slightly larger icons
          color={isFirst ? '#A855F7' : colorScheme === 'dark' ? '#9CA3AF' : '#4B5563'}
        />
      </View>

      <View style={[
        styles.timelineContent,
        {
          backgroundColor: colorScheme === 'dark' ? 'rgba(45, 55, 72, 0.7)' : 'rgba(255, 255, 255, 0.8)', // More opaque backgrounds
          borderColor: colorScheme === 'dark' ? 'rgba(107, 114, 128, 0.6)' : 'rgba(209, 213, 219, 0.8)', // Softer border
          // ...Platform.select({ // More refined shadow
          //   ios: {
          //     shadowColor: '#000',
          //     shadowOffset: { width: 0, height: 2 },
          //     shadowOpacity: 0.15,
          //     shadowRadius: 4,
          //   },
          //   android: {
          //     elevation: 3,
          //   },
          // }),
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
            size={16} // Slightly larger icon
            color={colorScheme === 'dark' ? '#A1A1AA' : '#6B7280'}
          />
          <ThemedText style={styles.locationText}>
            {scan.ScanDetail.ScanLocation || 'Location not available'}
          </ThemedText>
        </View>

        {scan.ScanDetail.Instructions && (
          <View style={[
            styles.instructionsContainer,
            {
              backgroundColor: colorScheme === 'dark' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.1)' // More vibrant instructions background
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
    <ActivityIndicator size="large" color="#A855F7" /> // More vibrant color
    <ThemedText style={styles.loadingText}>Loading tracking information...</ThemedText>
  </View>
));

LoadingContent.displayName = 'LoadingContent';

const ErrorContent = memo(({ error, colorScheme }: { error: string; colorScheme: ColorSchemeName }) => (
  <View style={[
    styles.errorContainer,
    {
      backgroundColor: colorScheme === 'dark' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(254, 202, 202, 0.8)', // More vibrant error background
      // ...Platform.select({ // More refined shadow
      //   ios: {
      //     shadowColor: '#000',
      //     shadowOffset: { width: 0, height: 2 },
      //     shadowOpacity: 0.15,
      //     shadowRadius: 4,
      //   },
      //   android: {
      //     elevation: 3,
      //   },
      // }),
    }
  ]}>
    <MaterialCommunityIcons
      name="alert-circle"
      size={26}  // Slightly larger icon
      color={colorScheme === 'dark' ? '#F87171' : '#EF4444'}
      style={styles.errorIcon}
    />
    <ThemedText style={[
      styles.errorText,
      { color: colorScheme === 'dark' ? '#F87171' : '#EF4444' }
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
    translateY.value = withSpring(height, { mass: 0.5, stiffness: 120, damping: 14 }); // More refined spring
    opacity.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) }, () => { // Smoother easing
      runOnJS(onClose)();
    });
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) }); // Smoother easing
      translateY.value = withSpring(0, { mass: 0.5, stiffness: 120, damping: 14 }); // More refined spring
    }
  }, [visible]);

    useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!trackingId || !visible) return;

      try {
        setLoading(true);
        setError(null);
        const data = await fetchTrackingInfo(trackingId);
        if (isMounted) {
          setTrackingData(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load tracking information');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
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
    [currentShipment?.Status.Status]
  );

  const statusIcon = useMemo(() => {
    if (!currentShipment) return 'package-variant';
    const status = currentShipment.Status.Status.toLowerCase();
    if (status.includes('delivered')) return 'package-variant-closed';
    if (status.includes('transit')) return 'truck-fast';
    return 'package-variant';
  }, [currentShipment?.Status.Status]);

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
            { backgroundColor: colorScheme === 'dark' ? '#2D3748' : '#FFFFFF' } // Darker background for dark mode
          ]}>
            <View style={styles.dragHandle} />

            <View style={[
              styles.header,
              { backgroundColor: colorScheme === 'dark' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.1)' } // More vibrant header
            ]}>
              <Pressable
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: colorScheme === 'dark' ? 'rgba(45, 55, 72, 0.8)' : 'rgba(249, 250, 251, 0.9)', // More opaque background
                    // ...Platform.select({ // Consistent shadow
                    //   ios: {
                    //     shadowColor: '#000',
                    //     shadowOffset: { width: 0, height: 2 },
                    //     shadowOpacity: 0.2,
                    //     shadowRadius: 4,
                    //   },
                    //   android: {
                    //     elevation: 4,
                    //   },
                    // }),
                  }
                ]}
                onPress={handleDismiss}
                android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}>
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={26} // Slightly larger icon
                  color={colorScheme === 'dark' ? '#E5E7EB' : '#374151'}
                />
              </Pressable>

              <View style={styles.headerContent}>
                <View style={[
                  styles.headerIconContainer,
                  { backgroundColor: colorScheme === 'dark' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(168, 85, 247, 0.2)' } // More vibrant icon background
                ]}>
                  <MaterialCommunityIcons
                    name="truck-delivery"
                    size={22} // Slightly larger icon
                    color="#A855F7"
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
                    {
                      backgroundColor: colorScheme === 'dark' ? statusColors?.dark.bg : statusColors?.bg,
                      // ...Platform.select({ // More pronounced shadow
                      //   ios: {
                      //     shadowColor: '#000',
                      //     shadowOffset: { width: 0, height: 3 },
                      //     shadowOpacity: 0.2,
                      //     shadowRadius: 5,
                      //   },
                      //   android: {
                      //     elevation: 4,
                      //   },
                      // }),
                    }
                  ]}>
                    <View style={[
                      styles.statusIconContainer,
                      { backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.9)' } // More opaque icon background
                    ]}>
                      <MaterialCommunityIcons
                        name={statusIcon}
                        size={28} // Slightly larger icon
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
                      { backgroundColor: colorScheme === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)' } // More vibrant estimated delivery container
                    ]}>
                      <View style={[
                        styles.estimatedDeliveryIcon,
                        { backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.9)' } // More opaque icon background
                      ]}>
                        <MaterialCommunityIcons
                          name="calendar-clock"
                          size={22} // Slightly larger icon
                          color="#8B5CF6"
                        />
                      </View>
                      <View>
                        <ThemedText type="defaultSemiBold" style={[styles.estimatedDeliveryTitle, { color: '#8B5CF6' }]}>
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
                        { backgroundColor: colorScheme === 'dark' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.1)' } // More vibrant icon background
                      ]}>
                        <MaterialCommunityIcons
                          name="clock-outline"
                          size={18} // Slightly larger icon
                          color="#A855F7"
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Slightly darker backdrop
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
    borderTopLeftRadius: 25, // Increased border radius
    borderTopRightRadius: 25,
    overflow: 'hidden',
  },
  dragHandle: {
    width: 50, // Larger drag handle
    height: 5,
    backgroundColor: 'rgba(156, 163, 175, 0.6)', // More visible drag handle
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: 10, // Increased margin
    marginBottom: 8,
  },
  header: {
    padding: 18, // Increased padding
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(156, 163, 175, 0.3)', // Softer border color
  },
  closeButton: {
    position: 'absolute',
    top: 18, // Adjusted position
    left: 18,
    zIndex: 1,
    width: 44, // Larger button
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10, // Increased margin
    paddingTop: 6, // Increased padding
  },
  headerIconContainer: {
    width: 40, // Larger icon container
    height: 40,
    borderRadius: 12, // Increased border radius
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10, // Increased margin
  },
  trackingTitle: {
    fontSize: isSmallScreen ? 17 : 19, // Slightly larger title
    fontWeight: '700', // Bolder font weight
    letterSpacing: 0.6, // Slightly increased letter spacing
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24, // Increased padding
    minHeight: 200,
  },
  loadingText: {
    marginTop: 14, // Increased margin
    fontSize: 15, // Slightly larger text
    opacity: 0.7,
  },
  errorContainer: {
    padding: 18, // Increased padding
    borderRadius: 14, // Increased border radius
    margin: 18, // Increased margin
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorIcon: {
    marginRight: 10, // Increased margin
  },
  errorText: {
    fontSize: isSmallScreen ? 15 : 16, // Slightly larger text
    flex: 1,
  },
  trackingContent: {
    padding: 18, // Increased padding
    gap: 18, // Increased gap
  },
  statusContainer: {
    padding: 18, // Increased padding
    borderRadius: 14, // Increased border radius
    alignItems: 'center',
  },
  statusIconContainer: {
    width: 52, // Larger icon container
    height: 52,
    borderRadius: 26, // Increased border radius
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14, // Increased margin
  },
  statusText: {
    fontSize: isSmallScreen ? 17 : 19, // Slightly larger text
    fontWeight: '700', // Bolder font weight
    marginBottom: 6, // Increased margin
    textAlign: 'center',
  },
  statusLocation: {
    fontSize: isSmallScreen ? 14 : 15, // Slightly larger text
    opacity: 0.8,
    marginBottom: 4, // Increased margin
    textAlign: 'center',
  },
  statusTime: {
    fontSize: isSmallScreen ? 12 : 13, // Slightly larger text
    opacity: 0.7, // Slightly reduced opacity
    textAlign: 'center',
  },
  estimatedDeliveryContainer: {
    padding: 18, // Increased padding
    borderRadius: 14, // Increased border radius
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14, // Increased gap
  },
  estimatedDeliveryIcon: {
    width: 44, // Larger icon container
    height: 44,
    borderRadius: 22, // Increased border radius
    alignItems: 'center',
    justifyContent: 'center',
  },
  estimatedDeliveryTitle: {
    fontSize: isSmallScreen ? 15 : 16, // Slightly larger text
    fontWeight: '700', // Bolder font weight
    marginBottom: 6, // Increased margin
  },
  estimatedDeliveryDate: {
    fontSize: isSmallScreen ? 14 : 15, // Slightly larger text
    opacity: 0.8,
  },
  historyContainer: {
    gap: 14, // Increased gap
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10, // Increased gap
  },
  historyIconContainer: {
    width: 36, // Larger icon container
    height: 36,
    borderRadius: 18, // Increased border radius
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTitle: {
    fontSize: isSmallScreen ? 16 : 17, // Slightly larger text
    fontWeight: '700', // Bolder font weight
  },
  timeline: {
    paddingLeft: 10, // Increased padding
  },
  timelineItem: {
    position: 'relative',
    paddingLeft: 28, // Increased padding
    paddingBottom: 18, // Increased padding
  },
  timelineLine: {
    position: 'absolute',
    left: 9, // Adjusted position
    top: 14, // Adjusted position
    bottom: 0,
    width: 2,
  },
  timelineDot: {
    position: 'absolute',
    left: 0,
    top: 4,
    width: 18, // Larger dot
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTimelineDot: {
    borderWidth: 2,
  },
  timelineContent: {
    padding: 14, // Increased padding
    borderRadius: 10, // Increased border radius
    borderWidth: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6, // Increased margin
  },
  scanText: {
    flex: 1,
    fontSize: isSmallScreen ? 14 : 15, // Slightly larger text
    fontWeight: '600', // Bolder font weight
    marginRight: 10, // Increased margin
  },
  timeText: {
    fontSize: isSmallScreen ? 12 : 13, // Slightly larger text
    opacity: 0.7,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6, // Increased gap
  },
  locationText: {
    fontSize: isSmallScreen ? 13 : 14, // Slightly larger text
    opacity: 0.7,
    flex: 1,
  },
  instructionsContainer: {
    marginTop: 10, // Increased margin
    padding: 10, // Increased padding
    borderRadius: 8, // Increased border radius
  },
  instructionsText: {
    fontSize: isSmallScreen ? 12 : 13, // Slightly larger text
    opacity: 0.8,
  },
});