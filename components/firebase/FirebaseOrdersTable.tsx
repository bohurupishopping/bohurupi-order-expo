import React, { useMemo, useRef, useCallback, memo, useState } from 'react';
import { View, StyleSheet, Pressable, Dimensions, Animated, Platform, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FirebaseOrder } from '@/types/firebase-order';
import { formatDate } from '@/utils/date';
import { OrderEditModal } from '../orders/OrderEditModal';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

// Modern color palette (no green)
const STATUS_COLORS = {
  pending: {
    bg: '#FFF3C820',
    text: '#D97706',
    rowBg: '#FFFBEB',
    dark: { bg: '#422006AA', text: '#FACC15', rowBg: '#332006AA' }
  },
  completed: {
    bg: '#E5E7EB30',
    text: '#6B7280',
    rowBg: '#F9FAFB',
    dark: { bg: '#374151AA', text: '#E5E7EB', rowBg: '#1F2937AA' }
  }
} as const;

const ORDER_STATUS_COLORS = {
  cod: {
    bg: '#FFEDD530',
    text: '#EA580C',
    rowBg: '#FFF7ED',
    dark: { bg: '#431407AA', text: '#FB923C', rowBg: '#431407AA' }
  },
  prepaid: {
    bg: '#BFDBFE30',
    text: '#2563EB',
    rowBg: '#EFF6FF',
    dark: { bg: '#172554AA', text: '#60A5FA', rowBg: '#172554AA' }
  }
} as const;

function getStatusColor(status: string) {
  return STATUS_COLORS[status.toLowerCase() as keyof typeof STATUS_COLORS] || STATUS_COLORS.pending;
}

function getOrderStatusColor(status: string) {
  return ORDER_STATUS_COLORS[status.toLowerCase() as keyof typeof ORDER_STATUS_COLORS] || ORDER_STATUS_COLORS.cod;
}

interface OrderRowProps {
  order: FirebaseOrder;
  index: number;
  onPress: () => void;
  onPressTracking?: (trackingId: string) => void;
  onEdit: (order: FirebaseOrder) => void;
}

const OrderRow = memo(({ order, index, onPress, onPressTracking, onEdit }: OrderRowProps) => {
  const colorScheme = useColorScheme();
  const statusColor = useMemo(() => getStatusColor(order.status), [order.status]);
  const orderStatusColor = useMemo(() => getOrderStatusColor(order.orderstatus), [order.orderstatus]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 50,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  const handleTrackingPress = useCallback(() => {
    if (order.trackingId) {
      onPressTracking?.(order.trackingId);
    }
  }, [order.trackingId, onPressTracking]);

  const totalAmount = useMemo(() => {
    return order.products.reduce((sum, product) => sum + (product.sale_price * product.qty), 0);
  }, [order.products]);

  const gradientColors = colorScheme === 'dark'
    ? ['#37415130', '#1F293720']
    : ['#F9FAFB', '#E5E7EB30'];

  return (
    <Animated.View style={[
      styles.orderRowContainer, // OUTSIDE shadow
      { opacity: fadeAnim, transform: [{ translateY }, { scale: scaleAnim }] }
    ]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.orderRow,
          order.status.toLowerCase() === 'completed' && { overflow: 'hidden' },
          {
             backgroundColor:  order.status.toLowerCase() === 'completed'? undefined : (colorScheme === 'dark' ? statusColor.dark.rowBg : statusColor.rowBg),
            // No need for orderRowPressed styles now, handled by scaleAnim
          },
        ]}
        android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}>
        {order.status.toLowerCase() === 'completed' && (
          <LinearGradient
            colors={gradientColors as [string, string, ...string[]]}
            style={StyleSheet.absoluteFill}
            start={[0, 0]}
            end={[1, 1]}
          />
        )}
        <View style={styles.orderContent}>
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <ThemedText type="defaultSemiBold" style={styles.orderNumber}>
                #{order.orderId}
              </ThemedText>
              <View style={[
                styles.statusBadge,
                {
                  backgroundColor: colorScheme === 'dark' ? statusColor.dark.bg : statusColor.bg
                }
              ]}>
                <ThemedText style={[
                  styles.statusText,
                  {
                    color: colorScheme === 'dark' ? statusColor.dark.text : statusColor.text
                  }
                ]}>
                  {order.status.toUpperCase()}
                </ThemedText>
              </View>
              <View style={[
                styles.statusBadge,
                {
                  backgroundColor: colorScheme === 'dark' ? orderStatusColor.dark.bg : orderStatusColor.bg
                }
              ]}>
                <ThemedText style={[
                  styles.statusText,
                  {
                    color: colorScheme === 'dark' ? orderStatusColor.dark.text : orderStatusColor.text
                  }
                ]}>
                  {order.orderstatus.toUpperCase()}
                </ThemedText>
              </View>
            </View>
            <ThemedText style={styles.orderTotal}>
              ₹{totalAmount.toFixed(2)}
            </ThemedText>
          </View>

          <View style={styles.customerInfo}>
            <View style={styles.customerDetails}>
              <View style={styles.customerNameContainer}>
                <MaterialCommunityIcons
                  name="account"
                  size={18}
                  color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                />
                <ThemedText type="defaultSemiBold" style={styles.customerName}>
                  {order.customerName}
                </ThemedText>
              </View>
            </View>
            <View style={styles.orderMetaInfo}>
              <View style={styles.metaInfoLeft}>
                <View style={styles.metaItem}>
                  <MaterialCommunityIcons
                    name="shopping"
                    size={16}
                    color={colorScheme === 'dark' ? '#A855F7' : '#6366F1'}
                  />
                  <ThemedText style={styles.metaText}>
                    {order.products.length} items
                  </ThemedText>
                </View>
                <View style={styles.metaItem}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={16}
                    color={colorScheme === 'dark' ? '#A855F7' : '#6366F1'}
                  />
                  <ThemedText style={styles.metaText}>
                    {formatDate(order.createdAt)}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.actionButtons}>
                {order.trackingId && (
                  <Pressable
                    onPress={handleTrackingPress}
                    style={({ pressed }) => [
                      styles.actionButton,
                      styles.trackingButton,
                        { borderColor: pressed ? 'rgba(139, 92, 246, 0.5)' : 'rgba(139, 92, 246, 0.2)' }
                    ]}
                    android_ripple={{ color: 'rgba(139, 92, 246, 0.1)' }}>
                    <MaterialCommunityIcons
                      name="truck-delivery"
                      size={16}
                      color="#8B5CF6"
                    />
                    <ThemedText style={styles.trackingText}>Track</ThemedText>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => onEdit(order)}
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.editButton,
                    { backgroundColor: pressed ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)' }
                  ]}
                >
                  <MaterialCommunityIcons
                    name="pencil"
                    size={16}
                    color="#8B5CF6"
                  />
                  <ThemedText style={styles.editButtonText}>Edit</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

OrderRow.displayName = 'OrderRow';

export interface FirebaseOrdersTableProps {
  orders: FirebaseOrder[];
  loading: boolean;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
  onOrderPress?: (order: FirebaseOrder) => void;
  onTrackingPress?: (trackingId: string) => void;
  onEditSuccess?: () => Promise<void>;
}

export function FirebaseOrdersTable({
  orders,
  loading,
  onRefresh,
  refreshing,
  onOrderPress,
  onTrackingPress,
  onEditSuccess
}: FirebaseOrdersTableProps) {
  const colorScheme = useColorScheme();
  const emptyStateAnim = useRef(new Animated.Value(0)).current;
  const emptyStateBounce = useRef(new Animated.Value(0)).current;

  const [selectedOrder, setSelectedOrder] = useState<FirebaseOrder | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  React.useEffect(() => {
    if (orders.length === 0 && !loading) {
      Animated.sequence([
      Animated.timing(emptyStateAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(emptyStateBounce, {
            toValue: 10,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(emptyStateBounce, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true
          })
        ])
        )
        ]).start()

    }
  }, [orders.length, loading]);


  const handleEdit = useCallback((order: FirebaseOrder) => {
    setSelectedOrder(order);
    setIsEditModalOpen(true);
  }, []);

  const handleEditModalSuccess = useCallback(async () => {
    setIsEditModalOpen(false);
    setSelectedOrder(null);
    await onEditSuccess?.();
  }, [onEditSuccess]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <ThemedText style={styles.loadingText}>Loading orders...</ThemedText>
      </View>
    );
  }

  if (orders.length === 0 && !loading) {
    return (
      <Animated.View
        style={[
          styles.emptyState,
          {
            opacity: emptyStateAnim,
             transform: [{ translateY: emptyStateBounce }],
          }
        ]}>
         <LinearGradient
            colors={colorScheme === 'dark' ? ['rgba(31, 41, 55, 0.7)', 'rgba(0, 0, 0, 0.4)'] : ['rgba(255, 255, 255, 0.9)', 'rgba(249, 250, 251, 0.7)']}
            style={StyleSheet.absoluteFill}
          />
        <View style={[
          styles.emptyStateIcon,
          {
            backgroundColor: colorScheme === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)'
          }
        ]}>
          <MaterialCommunityIcons
            name="package-variant-closed"
            size={48}
            color="#8B5CF6"
          />
        </View>
        <ThemedText type="defaultSemiBold" style={styles.emptyStateTitle}>
          No Orders Yet
        </ThemedText>
        <ThemedText style={styles.emptyStateText}>
          Your new orders will appear here.
        </ThemedText>
      </Animated.View>
    );
  }

  return (
    <>
      <View style={styles.ordersList}>
        {orders.map((order, index) => (
          <OrderRow
            key={order.id}
            order={order}
            index={index}
            onPress={() => onOrderPress?.(order)}
            onPressTracking={onTrackingPress}
            onEdit={handleEdit}
          />
        ))}
      </View>

      <OrderEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        selectedOrder={selectedOrder}
        onSuccess={handleEditModalSuccess}
      />
    </>
  );
}

const styles = StyleSheet.create({
    loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
    loadingText:{
        marginTop: 12,
        color: '#8B5CF6',
        fontSize: 16
    },
  ordersList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  orderRowContainer: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  orderRow: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  orderContent: {
    padding: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  orderNumber: {
    fontSize: isSmallScreen ? 14 : 15,
    color: '#8B5CF6',
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: isSmallScreen ? 10 : 11,
    fontWeight: '700',
  },
  orderTotal: {
    fontSize: isSmallScreen ? 14 : 15,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  customerInfo: {
    gap: 8,
  },
  customerDetails: {
    gap: 4,
  },
    customerNameContainer:{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
  customerName: {
    fontSize: isSmallScreen ? 13 : 14,
     fontWeight: '600'
  },
  orderMetaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: isSmallScreen ? 11 : 12,
    opacity: 0.8,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  trackingButton: {
      backgroundColor:  'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  editButton: {
      borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  trackingText: {
    fontSize: isSmallScreen ? 11 : 12,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  editButtonText: {
    fontSize: isSmallScreen ? 11 : 12,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  emptyState: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginHorizontal: 16,
    overflow: 'hidden',
    backgroundColor: 'white', // ADDED THIS for Android elevation
  },
  emptyStateIcon: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '700'
  },
  emptyStateText: {
    opacity: 0.8,
    fontSize: 14,
    textAlign: 'center',
  },
});