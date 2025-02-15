import React, { useMemo, useRef, useCallback } from 'react';
import { View, StyleSheet, Pressable, Dimensions, Animated, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FirebaseOrder } from '@/types/firebase-order';
import { formatDate } from '@/utils/date';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

const STATUS_COLORS = {
  pending: {
    bg: '#FEF9C320',
    text: '#854D0E',
    rowBg: '#FEF9C310',
    dark: { bg: '#42200620', text: '#FDE047', rowBg: '#42200610' }
  },
  completed: {
    bg: '#DCFCE720',
    text: '#166534',
    rowBg: '#DCFCE710',
    dark: { bg: '#052E1620', text: '#4ADE80', rowBg: '#052E1610' }
  }
} as const;

const ORDER_STATUS_COLORS = {
  cod: {
    bg: '#FFEDD520',
    text: '#9A3412',
    rowBg: '#FFEDD510',
    dark: { bg: '#43140720', text: '#FB923C', rowBg: '#43140710' }
  },
  prepaid: {
    bg: '#DBEAFE20',
    text: '#1E40AF',
    rowBg: '#DBEAFE10',
    dark: { bg: '#17255420', text: '#60A5FA', rowBg: '#17255410' }
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
  onPress: () => void;
  onPressTracking: (trackingId: string) => void;
  index: number;
}

const OrderRow = React.memo(({ order, onPress, onPressTracking, index }: OrderRowProps) => {
  const colorScheme = useColorScheme();
  const statusColor = useMemo(() => getStatusColor(order.status), [order.status]);
  const orderStatusColor = useMemo(() => getOrderStatusColor(order.orderstatus), [order.orderstatus]);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;

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
    ]).start();
  }, []);

  const handleTrackingPress = useCallback(() => {
    if (order.trackingId) {
      onPressTracking(order.trackingId);
    }
  }, [order.trackingId, onPressTracking]);

  const totalAmount = useMemo(() => {
    return order.products.reduce((sum, product) => sum + (product.sale_price * product.qty), 0);
  }, [order.products]);

  return (
    <Animated.View style={[
      { opacity: fadeAnim, transform: [{ translateY }] }
    ]}>
      <Pressable 
        onPress={onPress}
        style={({ pressed }) => [
          styles.orderRow,
          {
            backgroundColor: colorScheme === 'dark' 
              ? statusColor.dark.rowBg 
              : statusColor.rowBg,
            transform: [{ scale: pressed ? 0.98 : 1 }]
          }
        ]}
        android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}>
        <View style={styles.orderContent}>
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <ThemedText type="defaultSemiBold" style={styles.orderNumber}>
                #{order.orderId}
              </ThemedText>
              <View style={[
                styles.statusBadge,
                {
                  backgroundColor: colorScheme === 'dark' 
                    ? statusColor.dark.bg 
                    : statusColor.bg
                }
              ]}>
                <ThemedText style={[
                  styles.statusText,
                  {
                    color: colorScheme === 'dark' 
                      ? statusColor.dark.text 
                      : statusColor.text
                  }
                ]}>
                  {order.status.toUpperCase()}
                </ThemedText>
              </View>
              <View style={[
                styles.statusBadge,
                {
                  backgroundColor: colorScheme === 'dark' 
                    ? orderStatusColor.dark.bg 
                    : orderStatusColor.bg
                }
              ]}>
                <ThemedText style={[
                  styles.statusText,
                  {
                    color: colorScheme === 'dark' 
                      ? orderStatusColor.dark.text 
                      : orderStatusColor.text
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
                  size={16}
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
                    size={14}
                    color={colorScheme === 'dark' ? '#8B5CF680' : '#6366F180'}
                  />
                  <ThemedText style={styles.metaText}>
                    {order.products.length} items
                  </ThemedText>
                </View>
                <View style={styles.metaItem}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={14}
                    color={colorScheme === 'dark' ? '#8B5CF680' : '#6366F180'}
                  />
                  <ThemedText style={styles.metaText}>
                    {formatDate(order.createdAt)}
                  </ThemedText>
                </View>
              </View>
              {order.trackingId && (
                <Pressable
                  onPress={handleTrackingPress}
                  style={({ pressed }) => [
                    styles.trackingButton,
                    { opacity: pressed ? 0.7 : 1 }
                  ]}
                  android_ripple={{ color: 'rgba(22, 163, 74, 0.1)' }}>
                  <MaterialCommunityIcons
                    name="truck-delivery"
                    size={14}
                    color="#16A34A"
                  />
                  <ThemedText style={styles.trackingText}>Track</ThemedText>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

OrderRow.displayName = 'OrderRow';

interface FirebaseOrdersTableProps {
  orders: FirebaseOrder[];
  onOrderPress: (order: FirebaseOrder) => void;
  onTrackingPress: (trackingId: string) => void;
  loading?: boolean;
}

export function FirebaseOrdersTable({
  orders,
  onOrderPress,
  onTrackingPress,
  loading
}: FirebaseOrdersTableProps) {
  const colorScheme = useColorScheme();
  const emptyStateAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (orders.length === 0 && !loading) {
      Animated.timing(emptyStateAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [orders.length, loading]);

  if (orders.length === 0 && !loading) {
    return (
      <Animated.View 
        style={[
          styles.emptyState,
          {
            backgroundColor: colorScheme === 'dark' 
              ? 'rgba(31, 41, 55, 0.5)' 
              : 'rgba(255, 255, 255, 0.5)',
            opacity: emptyStateAnim
          }
        ]}>
        <View style={[
          styles.emptyStateIcon,
          {
            backgroundColor: colorScheme === 'dark' 
              ? 'rgba(139, 92, 246, 0.1)' 
              : 'rgba(139, 92, 246, 0.05)'
          }
        ]}>
          <MaterialCommunityIcons
            name="package-variant"
            size={32}
            color="#8B5CF6"
          />
        </View>
        <ThemedText type="defaultSemiBold" style={styles.emptyStateTitle}>
          No orders found
        </ThemedText>
        <ThemedText style={styles.emptyStateText}>
          New orders will appear here
        </ThemedText>
      </Animated.View>
    );
  }

  return (
    <View style={styles.ordersList}>
      {orders.map((order, index) => (
        <OrderRow
          key={order.id}
          order={order}
          index={index}
          onPress={() => onOrderPress(order)}
          onPressTracking={onTrackingPress}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  ordersList: {
    padding: 16,
  },
  orderRow: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.2)',
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
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: isSmallScreen ? 10 : 11,
    fontWeight: '600',
  },
  orderTotal: {
    fontSize: isSmallScreen ? 14 : 15,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  customerInfo: {
    gap: 8,
  },
  customerDetails: {
    gap: 4,
  },
  customerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    fontSize: isSmallScreen ? 13 : 14,
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
    opacity: 0.7,
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  trackingText: {
    fontSize: isSmallScreen ? 11 : 12,
    color: '#16A34A',
    fontWeight: '600',
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  emptyStateIcon: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    opacity: 0.7,
    fontSize: 14,
    textAlign: 'center',
  },
}); 