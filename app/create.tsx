import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, Animated, RefreshControl, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/useColorScheme';
import { CreateOrderForm } from '@/components/orders/CreateOrderForm';
import { ThemedText } from '@/components/ThemedText';
import { FirebaseOrdersTable } from '@/components/firebase/FirebaseOrdersTable';
import { fetchFirebaseOrders } from '@/services/api/firebase-orders';
import { FirebaseOrder } from '@/types/firebase-order';
import { ThemedView } from '@/components/ThemedView';

export default function CreateScreen() {
  const colorScheme = useColorScheme();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [orders, setOrders] = useState<FirebaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

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


  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchFirebaseOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
      // TODO: Add user-facing error handling
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, [loadOrders]);

  React.useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Consistent haptic
    }
  }, []);

  const handleCreateSuccess = useCallback(async () => {
    setIsFormVisible(false);
    await loadOrders();
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [loadOrders]);

   const handleEditSuccess = useCallback(async () => {
    await loadOrders();
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [loadOrders]);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Orders Management',
          headerShown: false
        }}
      />
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
            ? ['#1F2937', '#111827']
            : ['#F9FAFB', '#E5E7EB']}
          style={styles.headerGradient}>
             <LinearGradient
              colors={colorScheme === 'dark'
                ? ['rgba(139, 92, 246, 0.3)', 'rgba(139, 92, 246, 0.15)']
                : ['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.1)']}
            style={styles.roundGradient}
            start={[0, 0]}
            end={[1, 1]}
          />
          <View style={styles.headerContent}>
             <View style={styles.headerTextContainer}>
            <ThemedText type="title" style={styles.headerTitle}>
              Orders
            </ThemedText>
              <ThemedText style={styles.headerSubtitle}>
                 Manage your orders
              </ThemedText>
            </View>
            <View style={styles.headerActions}>
              <View style={styles.statBadge}>
                <MaterialCommunityIcons
                  name="shopping" // Consistent icon
                  size={18}
                  color="#8B5CF6" />
                <ThemedText style={styles.statText}>{orders.length} Orders</ThemedText>
              </View>

              <Pressable
                 style={({ pressed }) => [
                  styles.createButton,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#8B5CF6' : '#7C3AED',
                  },
                   pressed && styles.buttonPressed, // Apply pressed styles

                ]}
                onPress={() => {
                  triggerHaptic();
                  setIsFormVisible(true);
                }}>
                <MaterialCommunityIcons name="plus" size={18} color="#fff" />
                <ThemedText style={styles.createButtonText}>Create</ThemedText>
              </Pressable>
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
          { paddingTop: insets.top + 100 + 16 } // Use safe area + header height
        ]}
        refreshControl={
           <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colorScheme === 'dark' ? '#A1CEDC' : '#8B5CF6'}
            title={loading ? "Refreshing..." : "Pull to refresh"}
            titleColor={colorScheme === 'dark' ? '#D1D5DB' : '#6B7280'}
            progressViewOffset={insets.top + 100}  // Account for safe area + header
          />
        }>
        <FirebaseOrdersTable
          orders={orders}
          loading={loading}
          onRefresh={handleRefresh}
          refreshing={refreshing}
           onEditSuccess={handleEditSuccess}
        />
      </Animated.ScrollView>


      {/* Create Order Form Modal */}
      {isFormVisible && (
        <Pressable onPress={() => setIsFormVisible(false)} style={styles.modalContainer}>
        <BlurView
          intensity={colorScheme === 'dark' ? 80 : 100} // Adjusted intensity
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}>
          <CreateOrderForm
            onClose={() => setIsFormVisible(false)}
            onSuccess={handleCreateSuccess}
          />
           </BlurView>
        </Pressable>

      )}
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
      gap: 8, // Increased gap
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
      gap: 8, // Increased gap
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  statText: {
     fontSize: 15, // Slightly larger
    color: '#8B5CF6',
    fontWeight: '600',
  },
   createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6, // Increased gap
    paddingHorizontal: 12, // Increased padding
    paddingVertical: 8,
    borderRadius: 12, // Increased radius

  },
  createButtonText: {
    fontSize: 14, // Increased font size
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  modalContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
    roundGradient: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    top: -200,
    right: -200,
    opacity: 0.5,
  },
   buttonPressed: {
    transform: [{ scale: 0.95 }], // Scale down slightly on press
  },
});