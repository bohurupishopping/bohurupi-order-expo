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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { useColorScheme } from '../hooks/useColorScheme';
import { FirebaseOrder } from '../types/firebase-order';
import { FirebaseOrdersTable } from '../components/firebase/FirebaseOrdersTable';
import { FirebaseOrderDetailsSheet } from '../components/firebase/FirebaseOrderDetailsSheet';
import { FirebaseTrackingSheet } from '../components/firebase/FirebaseTrackingSheet';
import { fetchCompletedOrders } from '../services/api/firebase-orders';

export default function FirebaseCompletedOrders() {
  const [orders, setOrders] = useState<FirebaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<FirebaseOrder | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingId, setTrackingId] = useState<string>('');
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

    // More pronounced header animations
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 150], // Increased range for more movement
    outputRange: [0, -75], // Increased translateY for more movement
    extrapolate: 'clamp',
  });

  const headerScale = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0.9], // Scale down the header slightly
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
      const data = await fetchCompletedOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Consider adding user-facing error handling (e.g., a toast message)
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
      // Haptic feedback on press
     if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
     }
  }, []);

  const handleTrackingPress = useCallback((id: string) => {
    setTrackingId(id);
    setIsTrackingOpen(true);
    if (Platform.OS !== 'web') {
       Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }
  }, []);

  const handleEditSuccess = useCallback(async () => {
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
          transform: [{ translateY: headerTranslateY }, { scale: headerScale }],
          opacity: headerOpacity,
          paddingTop: insets.top + 16, // Increased top padding
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
                Completed Orders
              </ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                Your completed shipments
              </ThemedText>
            </View>

            <View style={styles.headerActions}>
              <View style={styles.statBadge}>
                <MaterialCommunityIcons
                  name="package-variant-closed" // More relevant icon
                  size={18} // Slightly larger
                  color="#8B5CF6"
                />
                <ThemedText style={styles.statText}>
                   {orders.length}  Orders
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
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 100 + 16 } // Increased padding
        ]}
        refreshControl={
            <RefreshControl
            refreshing={loading}
            onRefresh={handleFetchOrders}
            tintColor={colorScheme === 'dark' ? '#A1CEDC' : '#8B5CF6'} // Consistent purple
            title={loading ? "Refreshing..." : "Pull to refresh"} // Add a title
            titleColor={colorScheme === 'dark' ? '#D1D5DB' : '#6B7280'} // Title color
            progressViewOffset={insets.top + 100} // Adjust this value as needed
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
     paddingHorizontal: Platform.OS === "android" ? 16 : 0, // Add horizontal padding for Android
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
        shadowOffset: { width: 0, height: 4 }, // Increased shadow offset
        shadowOpacity: 0.2, // More opaque shadow
        shadowRadius: 12, // Larger radius
      },
      android: {
        elevation: 8, // Increased elevation
      },
    }),
  },
  headerGradient: {
    paddingHorizontal: 16, // Added horizontal padding
    paddingVertical: 12,
    borderBottomLeftRadius: 24, // Larger radius
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
    fontSize: 24, // Larger font size
    fontWeight: '700',
    marginBottom: 6, // Increased spacing
  },
  headerSubtitle: {
    fontSize: 15, // Slightly larger
    opacity: 0.8, // Slightly less opaque
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // Increased gap
    paddingHorizontal: 16, // Increased padding
    paddingVertical: 8,
    borderRadius: 16, // More rounded
    backgroundColor: 'rgba(139, 92, 246, 0.15)', // Slightly more opaque
  },
  statText: {
    fontSize: 15, // Slightly larger
    color: '#8B5CF6',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16, // Keep bottom padding
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