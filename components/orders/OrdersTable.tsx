import React, { useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, Animated, Pressable, Dimensions, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

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

// More vibrant and modern color palette
const STATUS_COLORS = {
  pending: {
    bg: '#FFF3C820', // Lighter, more transparent yellow
    text: '#D97706',   // Warmer orange
    rowBg: '#FFFBEB',  // Very light yellow background
    dark: { bg: '#42200630', text: '#FACC15', rowBg: '#33200620' } // Slightly more opaque, brighter yellow
  },
  processing: {
      bg: '#BFDBFE30', // More transparent blue
    text: '#2563EB',   // Deeper blue
    rowBg: '#EFF6FF',  // Very light blue
    dark: { bg: '#17255430', text: '#3B82F6', rowBg: '#17255420' } // Slightly more opaque, lighter blue
  },
  'on-hold': {
    bg: '#FFEDD530', // More transparent orange
    text: '#EA580C',    // Brighter orange
    rowBg: '#FFF7ED',  // Very light orange
    dark: { bg: '#43140730', text: '#F97316', rowBg: '#43140720' } // Slightly more opaque, vibrant orange
  },
  completed: {
      bg: '#E5E7EB30', // Light gray (for a white-like effect)
    text: '#6B7280',   // Neutral gray
    rowBg: '#F9FAFB',   // Very light gray
    dark: { bg: '#37415130', text: '#D1D5DB', rowBg: '#1F293720' } // Darker grays
  },
  cancelled: {
    bg: '#FECACA40', // More transparent red
    text: '#EF4444', // Brighter red
    rowBg: '#FEF2F2', // Very light red
    dark: { bg: '#450A0A30', text: '#F87171', rowBg: '#450A0A20' } // Darker, slightly more opaque red

  },
  refunded: {
      bg: '#F3E8FF20', // Light gray (for a white-like effect)
    text: '#6B21A8',   // Neutral gray
    rowBg: '#F3E8FF10',   // Very light gray
    dark: { bg: '#3B076420', text: '#D8B4FE', rowBg: '#3B076410' } // Darker grays

  },
  failed: {
    bg: '#FEE2E230',  //Very Light red
    text: '#DC2626', //  red
    rowBg: '#FEF2F2', // Very light red
    dark: { bg: '#4C051930', text: '#F87171', rowBg: '#4C051920' } // Darker, slightly more opaque red
  }
} as const;


function getStatusColor(status: string): StatusColorConfig {

  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.pending;
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
      // Scale animation for a slight "pop" effect
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const total = useMemo(() => parseFloat(order.total).toFixed(2), [order.total]);

    // Gradient colors (light gray to even lighter gray)
  const gradientColors = colorScheme === 'dark'
    ? ['#37415130', '#1F293720']  // Dark mode gradient
    : ['#F9FAFB', '#E5E7EB30']; // Light mode gradient

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

  return (
    <Animated.View style={[
      styles.orderRowContainer, // OUTSIDE shadow
      { opacity: fadeAnim, transform: [{ translateY }, { scale: scaleAnim}] }
    ]}>
      <Pressable
        onPress={() => {
            onPress();
            if(Platform.OS !== "web"){
               Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }

        }}
        style={({ pressed }) => [
          styles.orderRow,
          // Use LinearGradient for the background when it's completed
            order.status.toLowerCase() === 'completed' && { overflow: 'hidden' }, // Important for gradient to show
          {
            //backgroundColor: colorScheme === 'dark' ? statusColor.dark.rowBg : statusColor.rowBg, // Removed static background
            backgroundColor:  order.status.toLowerCase() === 'completed'? undefined : (colorScheme === 'dark' ? statusColor.dark.rowBg : statusColor.rowBg),
            ...(pressed ? styles.orderRowPressed : {}),
          },
        ]}
        android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}>
          {order.status.toLowerCase() === 'completed' && (
          <LinearGradient
             colors={[gradientColors[0], gradientColors[1]]}
            style={StyleSheet.absoluteFill}
            start={[0, 0]}
            end={[1, 1]}
          />
        )}
        <View style={styles.orderContent}>
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <ThemedText type="defaultSemiBold" style={styles.orderNumber}>
                #{order.number}
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
                    size={18} // Slightly larger icon
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
               <View style={styles.metaInfoLeft}>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons
                   name="shopping"
                    size={16} // Slightly larger icon
                    color={colorScheme === 'dark' ? '#A855F7' : '#6366F1'} // Bolder purple
                />
                <ThemedText style={styles.metaText}>
                  {order.line_items.length} items
                </ThemedText>
              </View>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons
                   name="clock-outline"
                    size={16} // Slightly larger icon
                    color={colorScheme === 'dark' ? '#A855F7' : '#6366F1'} // Bolder purple
                />
                <ThemedText style={styles.metaText}>
                  {format(new Date(order.date_created), 'MMM d, h:mm a')}
                </ThemedText>
              </View>
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

    const emptyStateBounce = useRef(new Animated.Value(0)).current;
    const emptyStateAnim = useRef(new Animated.Value(0)).current;

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
            name="package-variant-closed" // Changed to closed variant
            size={48} // Larger icon
            color="#8B5CF6"
          />
        </View>
        <ThemedText type="defaultSemiBold" style={styles.emptyStateTitle}>
          No Orders Yet
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
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  ordersList: {
     paddingHorizontal: 16, // Consistent padding
    paddingTop: 16,
    paddingBottom: 8, // Reduce bottom padding slightly
  },
   orderRowContainer: {
    marginBottom: 12, // Reduced marginBottom slightly
    borderRadius: 16, // More rounded corners
      // OUTSIDE shadow, applies to the entire animated container
    /* ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.15)', // Slightly darker shadow
        shadowOffset: { width: 0, height: 3 }, // Slightly larger offset
        shadowOpacity: 1, // Fully opaque
        shadowRadius: 6, // Slightly larger radius
      },
      android: {
        elevation: 4, // Increased for more noticeable shadow
      },
    }), */
  },
  orderRow: {
     borderRadius: 16, // More rounded corners
    overflow: 'hidden',
    // borderWidth: 1, // REMOVED border
    // borderColor: 'rgba(75, 85, 99, 0.2)',
  },
  orderRowPressed: { // Remove shadow styles from here
    //backgroundColor: 'rgba(0,0,0,0.05)', // Subtle background change on press
    transform: [{ scale: 0.98 }], // Scale on press
  },
  orderContent: {
     padding: 12, // Reduced padding
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
     marginBottom: 8, // Reduced spacing
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
     gap: 8, // Reduced gap
  },
  orderNumber: {
     fontSize: isSmallScreen ? 14 : 15, // Slightly smaller
    color: '#8B5CF6', // Consistent purple
    fontWeight: '700', // Bolder
  },
  statusBadge: {
     paddingHorizontal: 8, // Reduced padding
    paddingVertical: 4, // Reduced padding
    borderRadius: 12, // Reduced radius
  },
  statusText: {
   fontSize: isSmallScreen ? 10 : 11, // Slightly smaller
    fontWeight: '700', // Bolder font
  },
  orderTotal: {
     fontSize: isSmallScreen ? 14 : 15,
    fontWeight: '700', // Bolder
    color: '#8B5CF6',
  },
  customerInfo: {
    gap: 8, // Reduced gap
  },
  customerDetails: {
    gap: 4, // Reduced gap
  },
   customerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
     gap: 6, // Reduced gap
  },
  customerName: {
      fontSize: isSmallScreen ? 13 : 14, // Slightly smaller
     fontWeight: '600'
  },
  customerEmail: {
    fontSize: isSmallScreen ? 11 : 12, // Slightly smaller
    opacity: 0.8, // Slightly less opaque
  },
  orderMetaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // This is important
  },
  metaInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
     gap: 4, // Reduced gap
  },
  metaText: {
   fontSize: isSmallScreen ? 11 : 12, // Slightly smaller
    opacity: 0.8, // Slightly less opaque
  },
   emptyState: {
    padding: 24, // Reduced padding
    borderRadius: 16, // Reduced radius
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24, // Reduced margin
    marginHorizontal: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
         shadowColor: 'rgba(0, 0, 0, 0.15)', // Lighter shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
      android: {
        elevation: 3, // Reduced elevation
      },
    }),
  },
  emptyStateIcon: {
     padding: 16, // Reduced padding
    borderRadius: 16, // Reduced radius
    marginBottom: 16, // Reduced spacing
  },
  emptyStateTitle: {
    fontSize: 16, // Reduced font size
    marginBottom: 8, // Reduced spacing
    fontWeight: '700'
  },
  emptyStateText: {
    opacity: 0.8,
    fontSize: 14, // Reduced font size
    textAlign: 'center',
  },
});