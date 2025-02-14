import React, { useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Pressable, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { WooCommerceOrder } from '@/types/woocommerce';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

interface StatusColorConfig {
  bg: string;
  text: string;
  rowBg: string;
  dark: {
    bg: string;
    text: string;
    rowBg: string;
  };
}

function getStatusColor(status: string): StatusColorConfig {
  const colors = {
    pending: {
      bg: '#FEF9C320',
      text: '#854D0E',
      rowBg: '#FEF9C310',
      dark: { bg: '#42200620', text: '#FDE047', rowBg: '#42200610' }
    },
    processing: {
      bg: '#DBEAFE20',
      text: '#1E40AF',
      rowBg: '#DBEAFE10',
      dark: { bg: '#17255420', text: '#60A5FA', rowBg: '#17255410' }
    },
    'on-hold': {
      bg: '#FFEDD520',
      text: '#9A3412',
      rowBg: '#FFEDD510',
      dark: { bg: '#43140720', text: '#FB923C', rowBg: '#43140710' }
    },
    completed: {
      bg: '#DCFCE720',
      text: '#166534',
      rowBg: '#DCFCE710',
      dark: { bg: '#052E1620', text: '#4ADE80', rowBg: '#052E1610' }
    },
    cancelled: {
      bg: '#FEE2E220',
      text: '#991B1B',
      rowBg: '#FEE2E210',
      dark: { bg: '#450A0A20', text: '#FCA5A5', rowBg: '#450A0A10' }
    },
    refunded: {
      bg: '#F3E8FF20',
      text: '#6B21A8',
      rowBg: '#F3E8FF10',
      dark: { bg: '#3B076420', text: '#D8B4FE', rowBg: '#3B076410' }
    },
    failed: {
      bg: '#FFE4E620',
      text: '#9F1239',
      rowBg: '#FFE4E610',
      dark: { bg: '#4C051920', text: '#FDA4AF', rowBg: '#4C051910' }
    }
  } as const;
  return colors[status as keyof typeof colors] || colors.pending;
}

interface OrderRowProps {
  order: WooCommerceOrder;
  onPress: () => void;
  index: number;
}

const OrderRow = React.memo(({ order, onPress, index }: OrderRowProps) => {
  const colorScheme = useColorScheme();
  const statusColor = useMemo(() => getStatusColor(order.status), [order.status]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const total = useMemo(() => parseFloat(order.total).toFixed(2), [order.total]);

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
      >
        <View style={styles.orderContent}>
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <ThemedText type="defaultSemiBold" style={styles.orderNumber}>
                #{order.number}
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
            </View>
            <ThemedText style={styles.orderTotal}>
              {order.currency} {total}
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
                  {order.billing.first_name} {order.billing.last_name}
                </ThemedText>
              </View>
              <ThemedText style={styles.customerEmail}>
                {order.billing.email}
              </ThemedText>
            </View>
            <View style={styles.orderMetaInfo}>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons
                  name="shopping"
                  size={14}
                  color={colorScheme === 'dark' ? '#8B5CF680' : '#6366F180'}
                />
                <ThemedText style={styles.metaText}>
                  {order.line_items.length} items
                </ThemedText>
              </View>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={14}
                  color={colorScheme === 'dark' ? '#8B5CF680' : '#6366F180'}
                />
                <ThemedText style={styles.metaText}>
                  {format(new Date(order.date_created), 'MMM d, h:mm a')}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

OrderRow.displayName = 'OrderRow';

interface OrdersTableProps {
  orders: WooCommerceOrder[];
  onOrderPress: (order: WooCommerceOrder) => void;
  loading?: boolean;
}

export function OrdersTable({ orders, onOrderPress, loading }: OrdersTableProps) {
  const colorScheme = useColorScheme();

  if (orders.length === 0 && !loading) {
    return (
      <View style={[
        styles.emptyState,
        {
          backgroundColor: colorScheme === 'dark' 
            ? 'rgba(31, 41, 55, 0.5)' 
            : 'rgba(255, 255, 255, 0.5)'
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
      </View>
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
  customerEmail: {
    fontSize: isSmallScreen ? 11 : 12,
    opacity: 0.7,
  },
  orderMetaInfo: {
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
  emptyState: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.2)',
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