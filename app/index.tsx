import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, Dimensions, Animated, RefreshControl, Pressable, Platform, SafeAreaView } from 'react-native'; // Added SafeAreaView
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addDays, subDays } from 'date-fns';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { fetchFirebaseOrders } from '@/services/api/firebase-orders';
import { fetchLatestWooOrders } from '@/services/api/woo-orders';
import type { FirebaseOrder } from '@/types/firebase-order';
import type { TransformedOrder } from '@/services/api/woo-orders';
import { DashboardMetrics } from '@/components/common/DashboardMetrics'; // Import the new component

const { width } = Dimensions.get('window');
const cardWidth = (width - 40) / 2; // Adjusted for padding and two columns

interface DashboardMetricsType {
  totalRevenue: number;
  newOrders: number;
  activeOrders: number;
  totalProducts: number;
  recentActivities: {
    id: string;
    user: {
      name: string;
    };
    action: string;
    timestamp: string;
  }[];
}

function useFadeInAnimation(duration: number = 500, initialTranslateY: number = 20): { fadeAnim: Animated.Value; translateY: Animated.Value } {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(initialTranslateY)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration, useNativeDriver: true })
    ]).start();
  }, [fadeAnim, translateY, duration]);
  return { fadeAnim, translateY };
}

function RecentActivityCard({ activity }: { activity: DashboardMetricsType['recentActivities'][0] }) {
  const colorScheme = useColorScheme();
  const { fadeAnim, translateY } = useFadeInAnimation(400, 10);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
      <Pressable
        style={({ pressed }) => [
          styles.activityCard,
          {
            backgroundColor: colorScheme === 'dark' ? '#111827' : '#FFFFFF',
            borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            borderWidth: 1,
          }
        ]}
      >
        <View style={styles.activityHeader}>
          <View style={[
            styles.activityAvatar, 
            { 
              backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#E2E8F0',
              borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              borderWidth: 1
            }
          ]}>
            <ThemedText style={{
              color: colorScheme === 'dark' ? '#E5E7EB' : '#1F293B',
              fontWeight: '600'
            }}>
              {activity.user.name[0]}
            </ThemedText>
          </View>
          <View style={styles.activityContent}>
            <ThemedText 
              type="defaultSemiBold" 
              style={{ color: colorScheme === 'dark' ? '#F3F4F6' : '#1F293B' }}
            >
              {activity.user.name}
            </ThemedText>
            <ThemedText style={[
              styles.activityAction,
              { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
            ]}>
              {activity.action}
            </ThemedText>
          </View>
        </View>
        <ThemedText style={[
          styles.activityTime,
          { color: colorScheme === 'dark' ? '#6B7280' : '#9CA3AF' }
        ]}>
          {activity.timestamp}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetricsType>({
    totalRevenue: 0,
    newOrders: 0,
    activeOrders: 0,
    totalProducts: 0,
    recentActivities: [],
  });
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const fetchDashboardData = useCallback(async () => {
    try {
      const today = new Date();
      const thirtyDaysAgo = subDays(today, 30);

      const [firebaseOrders, wooOrders] = await Promise.all([
        fetchFirebaseOrders(),
        fetchLatestWooOrders(10),
      ]);

      const totalRevenue = calculateTotalRevenue(firebaseOrders, wooOrders, thirtyDaysAgo);
      const newOrders = countNewOrders(firebaseOrders, wooOrders);
      const activeOrders = countActiveOrders(firebaseOrders, wooOrders);
      const recentActivities = generateRecentActivities(firebaseOrders, wooOrders);

      setMetrics({
        totalRevenue,
        newOrders,
        activeOrders,
        totalProducts: firebaseOrders.length + wooOrders.length,
        recentActivities,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

    // More pronounced header animations (same as Completed Orders)
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, -75],
    extrapolate: 'clamp',
  });

  const headerScale = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

    const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={[
      styles.safeArea, 
      { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#F5F5F5' }
    ]}>
        <Animated.View style={[
        styles.header,
        {
          transform: [{ translateY: headerTranslateY }, { scale: headerScale }],
          opacity: headerOpacity,
          paddingTop: insets.top + 16, // Use safe area insets
          paddingBottom: 16,
        }
      ]}>
        <LinearGradient
           colors={colorScheme === 'dark'
            ? ['#111827', '#1F2937'] // Darker gradient
            : ['#F9FAFB', '#E5E7EB']}  // Lighter, more subtle gradient
          style={styles.headerGradient}>
            <LinearGradient
              colors={colorScheme === 'dark'
                ? ['rgba(139, 92, 246, 0.4)', 'rgba(139, 92, 246, 0.2)'] 
                : ['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.1)']}
            style={styles.roundGradient}
            start={[0, 0]}
            end={[1, 1]}
          />
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <ThemedText type="title" style={[
                styles.headerTitle,
                { color: colorScheme === 'dark' ? '#F3F4F6' : '#1F293B' }
              ]}>
                  Dashboard
              </ThemedText>
              <ThemedText style={[
                styles.headerSubtitle,
                { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }
              ]}>
                 {format(new Date(), 'MMMM d, yyyy')}
              </ThemedText>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
      <Animated.ScrollView
        style={[
          styles.container, 
          { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#F5F5F5' }
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C2BD9"/>}
        scrollEventThrottle={16}
          contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 100 + 16 } // Use safe area insets + header height
        ]}
      >
        <DashboardMetrics />
        <ThemedView style={[styles.recentSection, { backgroundColor: 'transparent' }]}>
          <ThemedText 
            type="subtitle" 
            style={[
              styles.sectionTitle, 
              { color: colorScheme === 'dark' ? '#E5E7EB' : '#1F293B' }
            ]}
          >
            Recent Activities
          </ThemedText>
          <View style={styles.activitiesContainer}>
            {metrics.recentActivities.map((activity) => (
              <RecentActivityCard key={activity.id} activity={activity} />
            ))}
          </View>
        </ThemedView>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function calculateTotalRevenue(
  firebaseOrders: FirebaseOrder[],
  wooOrders: TransformedOrder[],
  startDate: Date
): number {
  const firebaseRevenue = firebaseOrders.reduce((total, order) => {
    if (!order.createdAt || new Date(order.createdAt) < startDate) {
      return total;
    }
    return total + order.products.reduce((sum, product) => sum + (product.sale_price * product.qty), 0);
  }, 0);

  const wooRevenue = wooOrders.reduce((total, order) => {
    const orderDate = new Date(); // Assuming 'date_created' is not available, using current date
    if (orderDate < startDate) {
      return total;
    }
    return total + order.products.reduce((sum, product) => sum + (product.sale_price * product.qty), 0);
  }, 0);

  return firebaseRevenue + wooRevenue;
}

function countNewOrders(firebaseOrders: FirebaseOrder[], wooOrders: TransformedOrder[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const newFirebaseOrders = firebaseOrders.filter(order => {
    if (!order.createdAt) return false;
    const orderDate = new Date(order.createdAt);
    return orderDate >= today;
  });
  return newFirebaseOrders.length + wooOrders.length;
}

function countActiveOrders(firebaseOrders: FirebaseOrder[], wooOrders: TransformedOrder[]): number {
  const pendingFirebaseOrders = firebaseOrders.filter(order => order.status === 'pending');
  const pendingWooOrders = wooOrders.filter(order => order.status === 'pending');
  return pendingFirebaseOrders.length + pendingWooOrders.length;
}

function generateRecentActivities(firebaseOrders: FirebaseOrder[], wooOrders: TransformedOrder[]) {
  const activities = [
    ...firebaseOrders.map(order => ({
      id: order.id || `firebase-${Date.now()}`,
      user: { name: order.customerName },
      action: `Ordered ${order.products.length} items`,
      timestamp: format(new Date(order.createdAt || new Date()), 'MMM d, h:mm a')
    })),
    ...wooOrders.map(order => ({
      id: order.orderId || `woo-${Date.now()}`,
      user: { name: order.customerName },
      action: `Placed WooCommerce order`,
      timestamp: format(new Date(), 'MMM d, h:mm a')
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
   .slice(0, 10);
  return activities;
}

const styles = StyleSheet.create({
    safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Consistent background
  },
  container: {
    flex: 1,
  },
    scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
   header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    opacity: 0.8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  statText: {
    fontSize: 15,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
    height: 140,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    color: 'white',
  },
  cardValue: {
    fontSize: 24,
  },
  cardSubtitle: {
    opacity: 0.9,
    fontSize: 12,
  },
  recentSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
      color: '#333',
  },
  activitiesContainer: {
    gap: 10,
  },
  activityCard: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    opacity: 0.7,
    fontSize: 12,
    marginTop: 2,
  },
  activityTime: {
    fontSize: 12,
    opacity: 0.7,
    marginLeft: 8,
  },
    cardShadow: {
    // ...Platform.select({ // Removed shadow
    //   ios: {
    //     shadowColor: '#000',
    //     shadowOffset: { width: 0, height: 4 },
    //     shadowOpacity: 0.2,
    //     shadowRadius: 6,
    //   },
    //   android: {
    //     elevation: 6,
    //   },
    // }),
  },
    roundGradient: {
    position: 'absolute',
    width: 400, // Larger gradient
    height: 400,
    borderRadius: 200, // Half of width/height
    top: -200, // Adjusted position
    right: -200,
    opacity: 0.5, // Slightly more opaque
  },
});