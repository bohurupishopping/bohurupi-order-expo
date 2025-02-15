import React, { useState, useRef, useCallback } from 'react';
import { StyleSheet, Animated, RefreshControl, Platform, View, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();

  // Header animations (same as the other screens)
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
      // TODO: Add user-facing error handling (e.g., a toast message)
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
    if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

    const handleStatusChange = useCallback((value: string) => {
    if (Platform.OS !== "web") {
       Haptics.selectionAsync();
    }

    setStatusFilter(value);
    setShowStatusPicker(false);
  }, []);

  const handlePerPageChange = useCallback((value: number) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    setPerPage(value);
    setShowPerPagePicker(false);
  }, []);

  return (
    <ThemedView style={styles.container}>
       <Animated.View style={[
        styles.header,
        {
          transform: [{ translateY: headerTranslateY }, { scale: headerScale }],
          opacity: headerOpacity,
          paddingTop: insets.top + 16, // Add safe area padding
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
                <MaterialCommunityIcons name="shopping" size={18} color="#8B5CF6" />
                <ThemedText style={styles.statText}>{orders.length} Orders</ThemedText>
              </View>

              <Pressable
                 style={({ pressed }) => [
                  styles.filterButton,
                  {
                    backgroundColor: colorScheme === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',  // Consistent purple
                  },
                  pressed && styles.buttonPressed, // Apply pressed styles
                ]}
                onPress={() => {
                    setShowStatusPicker(true);
                    if(Platform.OS !== 'web'){
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    }
                }}>
                <MaterialCommunityIcons
                  name="filter-variant"
                  size={18}
                    color={colorScheme === 'dark' ? '#D1D5DB' : '#8B5CF6'} // Consistent text color
                />
                <ThemedText style={styles.filterText}>
                  {STATUS_OPTIONS.find(opt => opt.value === statusFilter)?.label.replace(' Orders', '') || 'All'}
                </ThemedText>
              </Pressable>

              <Pressable
                 style={({ pressed }) => [
                  styles.filterButton,
                   {
                    backgroundColor: colorScheme === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',  // Consistent purple
                  },
                  pressed && styles.buttonPressed, // Apply pressed styles
                ]}
                onPress={() => {
                    setShowPerPagePicker(true);
                    if(Platform.OS !== 'web'){
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    }
                }}>
                <MaterialCommunityIcons
                  name="format-list-numbered"
                  size={18}
                  color={colorScheme === 'dark' ? '#D1D5DB' : '#8B5CF6'} // Consistent text color
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
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 100 + 16 } // Add safe area padding + header
        ]}
        refreshControl={
           <RefreshControl
            refreshing={loading}
            onRefresh={handleFetchOrders}
            tintColor={colorScheme === 'dark' ? '#A1CEDC' : '#8B5CF6'}
            title={loading ? "Refreshing..." : "Pull to refresh"}
            titleColor={colorScheme === 'dark' ? '#D1D5DB' : '#6B7280'}
            progressViewOffset={insets.top + 100} // Adjust for safe area and header
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
                    backgroundColor: statusFilter === option.value
                      ? colorScheme === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)'
                      : 'transparent'
                  },
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => handleStatusChange(option.value)}>
                <ThemedText style={[
                    styles.pickerOptionText,
                    { color: colorScheme === 'dark' ? '#D1D5DB' : '#4B5563' }, // Consistent text color
                    statusFilter === option.value && { color: colorScheme === 'dark' ? '#FFF' : '#8B5CF6' }
                    ]}>
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
                     backgroundColor: perPage === option.value
                      ? colorScheme === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)'
                      : 'transparent'
                  },
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => handlePerPageChange(option.value)}>
                <ThemedText style={[
                    styles.pickerOptionText,
                     { color: colorScheme === 'dark' ? '#D1D5DB' : '#4B5563' },
                     perPage === option.value && { color: colorScheme === 'dark' ? '#FFF' : '#8B5CF6' }
                     ]}>
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
   filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6, // Increased gap
    paddingHorizontal: 12, // Increased padding
    paddingVertical: 8,
    borderRadius: 12, // Increased radius
    //backgroundColor: 'rgba(139, 92, 246, 0.1)', // Moved to inline style
  },
  filterText: {
    fontSize: 14, // Increased font size
    fontWeight: '500',
    color: '#8B5CF6'
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
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
    borderRadius: 16, // Increased radius
    overflow: 'hidden',
    padding: 12, // Increased padding
    //backgroundColor: '#FFF', // Moved to inline style
      ...Platform.select({ // Adding shadow to picker container
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  pickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12, // Increased radius
    marginBottom: 8, // Added margin for spacing
     //backgroundColor: 'transparent', // Moved to inline style
  },
  pickerOptionActive: {
    // Styles for active option
    // backgroundColor: 'rgba(139, 92, 246, 0.1)',  // Moved to inline
      borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  pickerOptionText: {
    fontSize: 15, // Increased font size
    fontWeight: '500',
      // color: '#4B5563', // Moved to inline style
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