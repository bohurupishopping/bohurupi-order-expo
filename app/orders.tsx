import React, { useState, useRef, useCallback } from 'react';
import { StyleSheet, Animated, RefreshControl, Platform, View, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { WooOrderDetailsDialog } from '@/components/orders/WooOrderDetailsDialog';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { fetchOrders } from '@/services/api/orders';
import { WooCommerceOrder } from '@/types/woocommerce';

const STATUS_OPTIONS = [
  { label: 'All Orders', value: 'any' },
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'On Hold', value: 'on-hold' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Refunded', value: 'refunded' },
] as const;

const PER_PAGE_OPTIONS = [
  { label: '25 Orders', value: 25 },
  { label: '50 Orders', value: 50 },
  { label: '100 Orders', value: 100 },
] as const;

export default function OrdersScreen() {
  const [orders, setOrders] = useState<WooCommerceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<WooCommerceOrder | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('any');
  const [perPage, setPerPage] = useState<number>(25);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showPerPagePicker, setShowPerPagePicker] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
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
      const data = await fetchOrders({
        status: statusFilter !== 'any' ? statusFilter : undefined,
        per_page: perPage,
      });
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, perPage]);

  React.useEffect(() => {
    handleFetchOrders();
  }, [handleFetchOrders]);

  const handleOrderPress = useCallback((order: WooCommerceOrder) => {
    setSelectedOrder(order);
    setDialogVisible(true);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    Haptics.selectionAsync();
    setStatusFilter(value);
    setShowStatusPicker(false);
  }, []);

  const handlePerPageChange = useCallback((value: number) => {
    Haptics.selectionAsync();
    setPerPage(value);
    setShowPerPagePicker(false);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <Animated.View style={[styles.header, { transform: [{ translateY: headerTranslateY }], opacity: headerOpacity }]}>
        <LinearGradient
          colors={colorScheme === 'dark' 
            ? ['#1a1b1e', '#2d2f34'] as const
            : ['#ffffff', '#f5f5f5'] as const}
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
                  styles.filterButton,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#374151' : '#F3F4F6',
                    opacity: pressed ? 0.7 : 1
                  }
                ]}
                onPress={() => setShowStatusPicker(true)}>
                <MaterialCommunityIcons
                  name="filter-variant"
                  size={14}
                  color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                />
                <ThemedText style={styles.filterText}>
                  {STATUS_OPTIONS.find(opt => opt.value === statusFilter)?.label.replace(' Orders', '') || 'All'}
                </ThemedText>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.filterButton,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#374151' : '#F3F4F6',
                    opacity: pressed ? 0.7 : 1
                  }
                ]}
                onPress={() => setShowPerPagePicker(true)}>
                <MaterialCommunityIcons
                  name="format-list-numbered"
                  size={14}
                  color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                />
                <ThemedText style={styles.filterText}>{perPage}</ThemedText>
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
            refreshing={loading} 
            onRefresh={handleFetchOrders}
            tintColor={colorScheme === 'dark' ? '#A1CEDC' : '#1D3D47'}
          />
        }>
        <OrdersTable
          orders={orders}
          onOrderPress={handleOrderPress}
          loading={loading}
        />
      </Animated.ScrollView>

      <WooOrderDetailsDialog
        order={selectedOrder}
        visible={dialogVisible}
        onClose={() => setDialogVisible(false)}
      />

      {/* Status Picker Modal */}
      {showStatusPicker && (
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowStatusPicker(false)}>
          <View 
            style={[
              styles.pickerContainer,
              {
                backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF'
              }
            ]}>
            {STATUS_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={({ pressed }) => [
                  styles.pickerOption,
                  statusFilter === option.value && styles.pickerOptionActive,
                  {
                    opacity: pressed ? 0.7 : 1,
                    backgroundColor: statusFilter === option.value
                      ? colorScheme === 'dark' ? '#374151' : '#F3F4F6'
                      : 'transparent'
                  }
                ]}
                onPress={() => handleStatusChange(option.value)}>
                <ThemedText style={styles.pickerOptionText}>
                  {option.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </Pressable>
      )}

      {/* Per Page Picker Modal */}
      {showPerPagePicker && (
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowPerPagePicker(false)}>
          <View 
            style={[
              styles.pickerContainer,
              {
                backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF'
              }
            ]}>
            {PER_PAGE_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={({ pressed }) => [
                  styles.pickerOption,
                  perPage === option.value && styles.pickerOptionActive,
                  {
                    opacity: pressed ? 0.7 : 1,
                    backgroundColor: perPage === option.value
                      ? colorScheme === 'dark' ? '#374151' : '#F3F4F6'
                      : 'transparent'
                  }
                ]}
                onPress={() => handlePerPageChange(option.value)}>
                <ThemedText style={styles.pickerOptionText}>
                  {option.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </Pressable>
      )}
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
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
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  pickerContainer: {
    width: '80%',
    maxWidth: 300,
    borderRadius: 12,
    overflow: 'hidden',
    padding: 8,
  },
  pickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  pickerOptionActive: {
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  pickerOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 