import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { fetchOrderMetrics } from '@/services/api/orders';

const { width } = Dimensions.get('window');
const cardWidth = (width - 40) / 2; // Adjusted for padding and two columns

interface DashboardCardProps {
  title: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  subtitle?: string;
  gradientColors: string[]; // Use gradientColors instead of a single color
}

function useFadeInAnimation(duration: number = 500, initialTranslateY: number = 20): { fadeAnim: Animated.Value; translateY: Animated.Value } {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(initialTranslateY)).current;
  React.useEffect(() => {
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

interface DashboardMetricsProps {
  // metrics: {
  //   totalRevenue: number;
  //   newOrders: number;
  //   activeOrders: number;
  //   totalProducts: number;
  // };
}

export function DashboardMetrics() {
  const [metrics, setMetrics] = useState({
    pendingOrders: 0,
    processingOrders: 0,
    deliveredOrders: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    async function fetchMetrics() {
      const fetchedMetrics = await fetchOrderMetrics();
      setMetrics(fetchedMetrics);
    }

    fetchMetrics();
  }, []);

  // Gradients
  const revenueGradient = ['#4CAF50', '#8BC34A'];
  const newOrdersGradient = ['#2196F3', '#42A5F5'];
  const activeOrdersGradient = ['#FF9800', '#FFB74D'];
  const totalProductsGradient = ['#9C27B0', '#BA68C8'];

  return (
    <View style={styles.cardsContainer}>
      <DashboardCard
        title="Total Revenue"
        value={`₹${metrics.totalRevenue.toLocaleString('en-IN')}`}
        icon="currency-inr"
        subtitle="from delivered orders"
        gradientColors={revenueGradient}
      />
      <DashboardCard
        title="Pending Orders"
        value={metrics.pendingOrders.toString()}
        icon="shopping"
        subtitle="awaiting confirmation"
        gradientColors={newOrdersGradient}
      />
      <DashboardCard
        title="Processing Orders"
        value={metrics.processingOrders.toString()}
        icon="clock-outline"
        subtitle="currently being processed"
        gradientColors={activeOrdersGradient}
      />
      <DashboardCard
        title="Delivered Orders"
        value={metrics.deliveredOrders.toString()}
        icon="package-variant"
        subtitle="successfully delivered"
        gradientColors={totalProductsGradient}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
}); 