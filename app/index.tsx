import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, Dimensions, Animated, RefreshControl, Pressable, Platform, SafeAreaView } from 'react-native'; // Added SafeAreaView
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { fetchFirebaseOrders } from '@/services/api/firebase-orders';
import { fetchLatestWooOrders } from '@/services/api/woo-orders';
import type { FirebaseOrder } from '@/types/firebase-order';
import type { TransformedOrder } from '@/services/api/woo-orders';

const { width } = Dimensions.get('window');
const cardWidth = (width - 40) / 2; // Adjusted for padding and two columns

interface DashboardMetrics {
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

interface DashboardCardProps {
  title: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  subtitle?: string;
  gradientColors: string[]; // Use gradientColors instead of a single color
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

function DashboardCard({ title, value, icon, subtitle, gradientColors }: DashboardCardProps) {
  const colorScheme = useColorScheme();
  const { fadeAnim, translateY } = useFadeInAnimation();

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }], width: cardWidth, marginBottom: 20 }}>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          {
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
          // styles.cardShadow, // Removed shadow
        ]}
      >
        <LinearGradient
          colors={gradientColors as [string, string, ...string[]]}
          style={styles.cardContent}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: gradientColors[0] }]}>
              <MaterialCommunityIcons name={icon} size={24} color="white" />
            </View>
            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
              {title}
            </ThemedText>
          </View>
          <ThemedText type="title" style={[styles.cardValue, { color: 'white' }]}>
            {value}
          </ThemedText>
          {subtitle && (
            <ThemedText style={[styles.cardSubtitle, { color: 'white' }]}>
              {subtitle}
            </ThemedText>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

function RecentActivityCard({ activity }: { activity: DashboardMetrics['recentActivities'][0] }) {
  const colorScheme = useColorScheme();
  const { fadeAnim, translateY } = useFadeInAnimation(400, 10);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
      <Pressable
        style={({ pressed }) => [
          styles.activityCard,
          {
            backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF',
            transform: [{ scale: pressed ? 0.98 : 1 }],
            // borderWidth: 1, // Removed border
            // borderColor: colorScheme === 'dark' ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 1)', // Removed border
          },
          // styles.cardShadow, // Removed shadow
        ]}
      >
        <View style={styles.activityHeader}>
          <View style={[styles.activityAvatar, { backgroundColor: colorScheme === 'dark' ? '#374151' : '#E2E8F0' }]}>
            <ThemedText style={{color: colorScheme === 'dark' ? '#fff' : '#000'}}>{activity.user.name[0]}</ThemedText>
          </View>
          <View style={styles.activityContent}>
            <ThemedText type="defaultSemiBold">{activity.user.name}</ThemedText>
            <ThemedText style={styles.activityAction}>{activity.action}</ThemedText>
          </View>
        </View>
        <ThemedText style={styles.activityTime}>{activity.timestamp}</ThemedText>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
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
      const [firebaseOrders, wooOrders] = await Promise.all([
        fetchFirebaseOrders(),
        fetchLatestWooOrders(10),
      ]);
      const totalRevenue = calculateTotalRevenue(firebaseOrders, wooOrders);
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

    // Gradients
  const revenueGradient = ['#4CAF50', '#8BC34A'];
  const newOrdersGradient = ['#2196F3', '#42A5F5'];
  const activeOrdersGradient = ['#FF9800', '#FFB74D'];
  const totalProductsGradient = ['#9C27B0', '#BA68C8'];

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
    <SafeAreaView style={styles.safeArea}>  {/* Use SafeAreaView as the top-level container */}
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
            ? ['#1F2937', '#111827'] // Darker, more refined gradient
            : ['#F9FAFB', '#E5E7EB']}  // Lighter, more subtle gradient
          style={styles.headerGradient}>
            <LinearGradient
              colors={colorScheme === 'dark'
                ? ['rgba(139, 92, 246, 0.3)', 'rgba(139, 92, 246, 0.15)'] // More opaque
                : ['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.1)']} // Slightly more opaque
            style={styles.roundGradient}
            start={[0, 0]}
            end={[1, 1]}
          />
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <ThemedText type="title" style={styles.headerTitle}>
                  Dashboard
              </ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                 {format(new Date(), 'MMMM d, yyyy')}
              </ThemedText>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
      <Animated.ScrollView
        style={[styles.container, { backgroundColor: '#F5F5F5' }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C2BD9"/>}
        scrollEventThrottle={16}
          contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 100 + 16 } // Use safe area insets + header height
        ]}
      >

        <View style={styles.cardsContainer}>
          <DashboardCard
            title="Total Revenue"
            value={`₹${metrics.totalRevenue.toLocaleString('en-IN')}`}
            icon="currency-inr"
            subtitle="+23% from last month"
            gradientColors={revenueGradient}
          />
          <DashboardCard
            title="New Orders"
            value={metrics.newOrders.toString()}
            icon="shopping"
            subtitle="+12% increase"
            gradientColors={newOrdersGradient}
          />
          <DashboardCard
            title="Active Orders"
            value={metrics.activeOrders.toString()}
            icon="clock-outline"
            subtitle="Orders to process"
            gradientColors={activeOrdersGradient}
          />
          <DashboardCard
            title="Total Orders"
            value={metrics.totalProducts.toString()}
            icon="package-variant"
            subtitle="Combined orders"
            gradientColors={totalProductsGradient}
          />
        </View>
        <ThemedView style={[styles.recentSection, { backgroundColor: 'transparent' }]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
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

function calculateTotalRevenue(firebaseOrders: FirebaseOrder[], wooOrders: TransformedOrder[]): number {
  const firebaseRevenue = firebaseOrders.reduce((total, order) =>
    total + order.products.reduce((sum, product) => sum + (product.sale_price * product.qty), 0), 0);
  const wooRevenue = wooOrders.reduce((total, order) =>
    total + order.products.reduce((sum, product) => sum + (product.sale_price * product.qty), 0), 0);
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