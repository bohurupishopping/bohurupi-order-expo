import { ScrollView, StyleSheet, View, Dimensions, Animated, RefreshControl, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { fetchFirebaseOrders } from '@/services/api/firebase-orders';
import { fetchLatestWooOrders } from '@/services/api/woo-orders';
import type { FirebaseOrder } from '@/types/firebase-order';
import type { TransformedOrder } from '@/services/api/woo-orders';

const { width } = Dimensions.get('window');
const cardWidth = (width - 32) / 2.2;

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
  color?: string;
}

function DashboardCard({ title, value, icon, subtitle, color = '#A1CEDC' }: DashboardCardProps) {
  const colorScheme = useColorScheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[
      { opacity: fadeAnim, transform: [{ translateY }] }
    ]}>
      <Pressable
        style={({ pressed }) => [
          styles.card, 
          {
            backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF',
            elevation: 3,
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
            transform: [{ scale: pressed ? 0.98 : 1 }]
          }
        ]}
      >
        <LinearGradient
          colors={colorScheme === 'dark' 
            ? ['rgba(31, 41, 55, 0.8)', 'rgba(31, 41, 55, 0.9)'] 
            : ['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.9)']}
          style={styles.cardContent}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: color }]}>
              <MaterialCommunityIcons name={icon} size={20} color="white" />
            </View>
            <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
              {title}
            </ThemedText>
          </View>
          <ThemedText type="title" style={styles.cardValue}>
            {value}
          </ThemedText>
          {subtitle && (
            <ThemedText style={styles.cardSubtitle}>
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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[
      { opacity: fadeAnim, transform: [{ translateY }] }
    ]}>
      <Pressable
        style={({ pressed }) => [
          styles.activityCard,
          {
            backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF',
            elevation: 3,
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
            transform: [{ scale: pressed ? 0.98 : 1 }]
          }
        ]}
      >
        <View style={styles.activityHeader}>
          <View style={[
            styles.activityAvatar,
            {
              backgroundColor: colorScheme === 'dark' ? '#374151' : '#E2E8F0'
            }
          ]}>
            <ThemedText>{activity.user.name[0]}</ThemedText>
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

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch orders from both Firebase and WooCommerce
      const [firebaseOrders, wooOrders] = await Promise.all([
        fetchFirebaseOrders(),
        fetchLatestWooOrders(10),
      ]);

      // Calculate metrics
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

  return (
    <Animated.ScrollView
      style={[styles.container, { backgroundColor: '#F8FAFC' }]}
      showsVerticalScrollIndicator={false}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
      )}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      scrollEventThrottle={16}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Dashboard</ThemedText>
        <ThemedText style={styles.date}>{format(new Date(), 'MMMM d, yyyy')}</ThemedText>
      </ThemedView>

      <View style={styles.cardsContainer}>
        <DashboardCard
          title="Total Revenue"
          value={`₹${metrics.totalRevenue.toLocaleString('en-IN')}`}
          icon="currency-inr"
          subtitle="+23% from last month"
          color="#4CAF50"
        />
        <DashboardCard
          title="New Orders"
          value={metrics.newOrders.toString()}
          icon="shopping"
          subtitle="+12% increase"
          color="#2196F3"
        />
        <DashboardCard
          title="Active Orders"
          value={metrics.activeOrders.toString()}
          icon="clock-outline"
          subtitle="Orders to process"
          color="#FF9800"
        />
        <DashboardCard
          title="Total Orders"
          value={metrics.totalProducts.toString()}
          icon="package-variant"
          subtitle="Combined orders"
          color="#9C27B0"
        />
      </View>

      <ThemedView style={styles.recentSection}>
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
  );
}

// Helper functions
function calculateTotalRevenue(firebaseOrders: FirebaseOrder[], wooOrders: TransformedOrder[]): number {
  const firebaseRevenue = firebaseOrders.reduce((total, order) => {
    return total + order.products.reduce((sum, product) => {
      return sum + (product.sale_price * product.qty);
    }, 0);
  }, 0);

  const wooRevenue = wooOrders.reduce((total, order) => {
    return total + order.products.reduce((sum, product) => {
      return sum + (product.sale_price * product.qty);
    }, 0);
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
      timestamp: format(new Date(order.createdAt || new Date()), 'MMM d, h:mm a'),
    })),
    ...wooOrders.map(order => ({
      id: order.orderId || `woo-${Date.now()}`,
      user: { name: order.customerName },
      action: `Placed WooCommerce order`,
      timestamp: format(new Date(), 'MMM d, h:mm a'),
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
   .slice(0, 10);

  return activities;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  header: {
    marginTop: 20,
    marginBottom: 14,
  },
  date: {
    opacity: 0.7,
    marginTop: 4,
    fontSize: 14,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  card: {
    width: cardWidth,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.1)',
  },
  cardContent: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 13,
  },
  cardValue: {
    fontSize: 18,
    marginBottom: 4,
  },
  cardSubtitle: {
    opacity: 0.7,
    fontSize: 12,
  },
  recentSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  activitiesContainer: {
    gap: 8,
  },
  activityCard: {
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.1)',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
}); 