import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  RefreshControl,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { useColorScheme } from '../hooks/useColorScheme';
import { FirebaseOrder } from '../types/firebase-order';
import { FirebaseOrdersTable } from '../components/firebase/FirebaseOrdersTable';
import { FirebaseOrderDetailsSheet } from '../components/firebase/FirebaseOrderDetailsSheet';
import { FirebaseTrackingSheet } from '../components/firebase/FirebaseTrackingSheet';
import { fetchPendingOrders } from '../services/api/firebase-orders';

export default function FirebasePendingOrders() {
  const [orders, setOrders] = useState<FirebaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<FirebaseOrder | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingId, setTrackingId] = useState<string>('');
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const colorScheme = useColorScheme();

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const handleFetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchPendingOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    handleFetchOrders();
  }, [handleFetchOrders]);

  const handleOrderPress = useCallback((order: FirebaseOrder) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  }, []);

  const handleTrackingPress = useCallback((id: string) => {
    setTrackingId(id);
    setIsTrackingOpen(true);
  }, []);

  const handleEditSuccess = useCallback(async () => {
    // Refresh orders list
    await handleFetchOrders();
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [handleFetchOrders]);

  return (
    <ThemedView style={styles.container}>
      <Animated.View style={[
        styles.header,
        {
          transform: [{ translateY: headerTranslateY }],
          opacity: headerOpacity
        }
      ]}>
        <LinearGradient
          colors={colorScheme === 'dark'
            ? ['#1a1b1e', '#2d2f34']
            : ['#ffffff', '#f5f5f5']}
          style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <ThemedText type="title" style={styles.headerTitle}>
              Pending Orders
            </ThemedText>

            <View style={styles.headerActions}>
              <View style={styles.statBadge}>
                <MaterialCommunityIcons
                  name="package-variant"
                  size={14}
                  color="#8B5CF6"
                />
                <ThemedText style={styles.statText}>
                  {orders.length}
                </ThemedText>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleFetchOrders}
            tintColor={colorScheme === 'dark' ? '#A1CEDC' : '#1D3D47'}
          />
        }>
        <FirebaseOrdersTable
          orders={orders}
          onOrderPress={handleOrderPress}
          onTrackingPress={handleTrackingPress}
          onEditSuccess={handleEditSuccess}
          loading={loading}
        />
      </Animated.ScrollView>

      <FirebaseOrderDetailsSheet
        order={selectedOrder}
        visible={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedOrder(null);
        }}
        onPressTracking={handleTrackingPress}
      />

      <FirebaseTrackingSheet
        trackingId={trackingId}
        visible={isTrackingOpen}
        onClose={() => {
          setIsTrackingOpen(false);
          setTrackingId('');
        }}
      />
    </ThemedView>
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
    ...Platform.select({
      ios: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerGradient: {
    padding: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  statText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
  },
}); 