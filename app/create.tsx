import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, Animated, RefreshControl, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { useColorScheme } from '@/hooks/useColorScheme';
import { CreateOrderForm } from '@/components/orders/CreateOrderForm';
import { ThemedText } from '@/components/ThemedText';
import { FirebaseOrdersTable } from '@/components/firebase/FirebaseOrdersTable';
import { fetchFirebaseOrders } from '@/services/api/firebase-orders';
import { FirebaseOrder } from '@/types/firebase-order';

export default function CreateScreen() {
  const colorScheme = useColorScheme();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [orders, setOrders] = useState<FirebaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = React.useRef(new Animated.Value(0)).current;

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

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchFirebaseOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
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
      Haptics.selectionAsync();
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
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Orders Management',
          headerShown: false
        }}
      />

      <View style={styles.content}>
        <Animated.View style={[styles.header, { transform: [{ translateY: headerTranslateY }], opacity: headerOpacity }]}>
          <LinearGradient
            colors={colorScheme === 'dark' 
              ? ['#1a1b1e', '#2d2f34']
              : ['#ffffff', '#f5f5f5']}
            style={styles.headerGradient}>
            <View style={styles.headerContent}>
              <ThemedText type="title" style={styles.headerTitle}>Orders</ThemedText>

              <View style={styles.headerActions}>
                <View style={styles.statBadge}>
                  <MaterialCommunityIcons name="shopping" size={14} color="#8B5CF6" />
                  <ThemedText style={styles.statText}>{orders.length}</ThemedText>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.createButton,
                    {
                      backgroundColor: colorScheme === 'dark' ? '#8B5CF6' : '#7C3AED',
                      opacity: pressed ? 0.7 : 1
                    }
                  ]}
                  onPress={() => {
                    triggerHaptic();
                    setIsFormVisible(true);
                  }}>
                  <MaterialCommunityIcons name="plus" size={14} color="#fff" />
                  <ThemedText style={styles.createButtonText}>Create Order</ThemedText>
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
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              tintColor={colorScheme === 'dark' ? '#A1CEDC' : '#1D3D47'}
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
      </View>

      {/* Create Order Form Modal */}
      {isFormVisible && (
        <BlurView
          intensity={colorScheme === 'dark' ? 40 : 60}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={styles.modalContainer}>
          <CreateOrderForm 
            onClose={() => setIsFormVisible(false)}
            onSuccess={handleCreateSuccess}
          />
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
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
    gap: 8,
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
  },
  modalContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
}); 