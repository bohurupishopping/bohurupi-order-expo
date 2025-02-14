import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolate,
  withSequence,
  withTiming,
  withDelay,
  FadeIn,
} from 'react-native-reanimated';

import { ThemedText } from '../components/ThemedText';
import { useColorScheme } from '../hooks/useColorScheme';
import { FirebaseOrder } from '../types/firebase-order';
import { FirebaseOrderCard } from '../components/firebase/FirebaseOrderCard';
import { FirebaseOrderDetailsSheet } from '../components/firebase/FirebaseOrderDetailsSheet';
import { FirebaseTrackingSheet } from '../components/firebase/FirebaseTrackingSheet';
import { fetchPendingOrders } from '../services/api/firebase-orders';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;
const HEADER_MAX_HEIGHT = Platform.OS === 'ios' ? 150 : 130;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 100 : 80;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

export default function FirebasePendingOrders() {
  const [orders, setOrders] = useState<FirebaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();

  // Sheet states
  const [selectedOrder, setSelectedOrder] = useState<FirebaseOrder | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingId, setTrackingId] = useState<string>('');

  // Animation values
  const scrollY = useSharedValue(0);
  const headerHeight = useSharedValue(HEADER_MAX_HEIGHT);
  const refreshHeight = useSharedValue(0);
  const listOpacity = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      headerHeight.value = Math.max(
        HEADER_MIN_HEIGHT,
        HEADER_MAX_HEIGHT - event.contentOffset.y
      );
      
      // Update refresh height for pull-to-refresh animation
      if (event.contentOffset.y < 0) {
        refreshHeight.value = Math.abs(event.contentOffset.y);
      } else {
        refreshHeight.value = 0;
      }
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE],
      [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      [-100, 0],
      [1.2, 1],
      Extrapolate.CLAMP
    );

    return {
      height,
      transform: [
        { scale },
        {
          translateY: interpolate(
            scrollY.value,
            [0, HEADER_SCROLL_DISTANCE],
            [0, -HEADER_SCROLL_DISTANCE / 2],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  const headerContentStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE / 2],
      [1, 0],
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE],
      [0, -20],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      refreshHeight.value,
      [0, 100],
      [1, 1.1],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [
        { translateY },
        { scale }
      ],
    };
  });

  const titleStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE],
      [1, 0.8],
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      refreshHeight.value,
      [0, 100],
      [0, 20],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { scale },
        { translateY }
      ],
    };
  });

  const listStyle = useAnimatedStyle(() => {
    return {
      opacity: listOpacity.value,
      transform: [
        {
          translateY: interpolate(
            listOpacity.value,
            [0, 1],
            [50, 0],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  const fetchOrders = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const data = await fetchPendingOrders();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching pending orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pending orders');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Animate list entrance
    listOpacity.value = withDelay(
      300,
      withTiming(1, { duration: 500 })
    );
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders(false);
    setRefreshing(false);
  };

  const handlePressDetails = (order: FirebaseOrder) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handlePressTracking = (id: string) => {
    setTrackingId(id);
    setIsTrackingOpen(true);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[styles.centerContainer, { opacity: loading ? 1 : 0 }]}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <ThemedText style={styles.loadingText}>Loading orders...</ThemedText>
        </Animated.View>
      );
    }

    if (error) {
      return (
        <View style={[
          styles.errorContainer,
          {
            backgroundColor: colorScheme === 'dark'
              ? 'rgba(220, 38, 38, 0.1)'
              : 'rgba(254, 226, 226, 1)'
          }
        ]}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={24}
            color={colorScheme === 'dark' ? '#FCA5A5' : '#DC2626'}
          />
          <ThemedText style={[
            styles.errorText,
            { color: colorScheme === 'dark' ? '#FCA5A5' : '#DC2626' }
          ]}>
            {error}
          </ThemedText>
        </View>
      );
    }

    if (orders.length === 0) {
      return (
        <View style={[
          styles.emptyContainer,
          {
            backgroundColor: colorScheme === 'dark'
              ? 'rgba(31, 41, 55, 0.5)'
              : 'rgba(255, 255, 255, 0.5)'
          }
        ]}>
          <View style={[
            styles.emptyIconContainer,
            {
              backgroundColor: colorScheme === 'dark'
                ? 'rgba(139, 92, 246, 0.1)'
                : 'rgba(139, 92, 246, 0.05)'
            }
          ]}>
            <MaterialCommunityIcons
              name="package-variant"
              size={32}
              color="#8B5CF6"
            />
          </View>
          <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
            No pending orders
          </ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            You don't have any pending orders at the moment
          </ThemedText>
        </View>
      );
    }

    return (
      <Animated.View style={[styles.ordersList, listStyle]}>
        {orders.map((order, index) => (
          <FirebaseOrderCard
            key={order.id}
            order={order}
            onPressDetails={handlePressDetails}
            onPressTracking={handlePressTracking}
            index={index}
          />
        ))}
      </Animated.View>
    );
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colorScheme === 'dark' ? '#111827' : '#F9FAFB'
      }
    ]}>
      <Animated.View style={[styles.header, headerStyle]}>
        {Platform.OS === 'ios' && (
          <BlurView
            intensity={scrollY.value > 0 ? 50 : 0}
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        )}
        <LinearGradient
          colors={colorScheme === 'dark'
            ? ['#1F2937CC', '#111827CC']
            : ['#FFFFFFCC', '#F9FAFBCC']}
          style={styles.headerGradient}>
          <Animated.View style={[styles.headerContent, headerContentStyle]}>
            <Animated.View style={[styles.titleContainer, titleStyle]}>
              <ThemedText type="title" style={styles.title}>
                Pending Orders
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                View and manage your pending orders
              </ThemedText>
            </Animated.View>

            <View style={styles.statsContainer}>
              <View style={[
                styles.statBadge,
                {
                  backgroundColor: colorScheme === 'dark'
                    ? 'rgba(139, 92, 246, 0.1)'
                    : 'rgba(139, 92, 246, 0.05)'
                }
              ]}>
                <MaterialCommunityIcons
                  name="package-variant"
                  size={16}
                  color="#8B5CF6"
                />
                <ThemedText style={[styles.statText, { color: '#8B5CF6' }]}>
                  {orders.length} Orders
                </ThemedText>
              </View>
            </View>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={scrollHandler}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#8B5CF6"
            colors={['#8B5CF6']}
            progressBackgroundColor={colorScheme === 'dark' ? '#1F2937' : '#FFFFFF'}
            progressViewOffset={HEADER_MAX_HEIGHT}
          />
        }>
        {renderContent()}
      </Animated.ScrollView>

      <FirebaseOrderDetailsSheet
        order={selectedOrder}
        visible={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedOrder(null);
        }}
        onPressTracking={handlePressTracking}
      />

      <FirebaseTrackingSheet
        trackingId={trackingId}
        visible={isTrackingOpen}
        onClose={() => {
          setIsTrackingOpen(false);
          setTrackingId('');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(75, 85, 99, 0.1)',
  },
  headerGradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  headerContent: {
    padding: 16,
  },
  titleContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: isSmallScreen ? 24 : 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: isSmallScreen ? 14 : 16,
    opacity: 0.7,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statText: {
    fontSize: isSmallScreen ? 12 : 13,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: HEADER_MAX_HEIGHT + 16,
    paddingBottom: 16,
    minHeight: '100%',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  loadingText: {
    marginTop: 12,
    fontSize: isSmallScreen ? 13 : 14,
    opacity: 0.7,
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: isSmallScreen ? 13 : 14,
  },
  emptyContainer: {
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.2)',
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: isSmallScreen ? 13 : 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  ordersList: {
    padding: 16,
    gap: 12,
  },
}); 