import React, { useMemo, useRef, useCallback } from 'react';
import { View, StyleSheet, Pressable, Dimensions, Animated, Image, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FirebaseOrder } from '@/types/firebase-order';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

interface StatusColorConfig {
  bg: string;
  text: string;
  dark: {
    bg: string;
    text: string;
  };
}

function getStatusColor(status: string): StatusColorConfig {
  const colors = {
    pending: {
      bg: '#FEF9C320',
      text: '#854D0E',
      dark: { bg: '#42200620', text: '#FDE047' }
    },
    completed: {
      bg: '#DCFCE720',
      text: '#166534',
      dark: { bg: '#052E1620', text: '#4ADE80' }
    }
  } as const;
  return colors[status.toLowerCase() as keyof typeof colors] || colors.pending;
}

function getOrderStatusColor(status: string): StatusColorConfig {
  const colors = {
    cod: {
      bg: '#FFEDD520',
      text: '#9A3412',
      dark: { bg: '#43140720', text: '#FB923C' }
    },
    prepaid: {
      bg: '#DBEAFE20',
      text: '#1E40AF',
      dark: { bg: '#17255420', text: '#60A5FA' }
    }
  } as const;
  return colors[status.toLowerCase() as keyof typeof colors] || colors.cod;
}

interface OrderRowProps {
  order: FirebaseOrder;
  onPress: () => void;
  onPressTracking: (trackingId: string) => void;
}

const OrderRow = React.memo(({ order, onPress, onPressTracking, index }: OrderRowProps & { index: number }) => {
  const colorScheme = useColorScheme();
  const statusColor = useMemo(() => getStatusColor(order.status), [order.status]);
  const orderStatusColor = useMemo(() => getOrderStatusColor(order.orderstatus), [order.orderstatus]);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          damping: 12,
          mass: 0.4,
          stiffness: 100,
          useNativeDriver: true,
        })
      ]).start();
    }, index * 30);

    return () => clearTimeout(timeout);
  }, [index]);

  const handleTrackingPress = useCallback(() => {
    if (order.trackingId) {
      onPressTracking(order.trackingId);
    }
  }, [order.trackingId, onPressTracking]);

  return (
    <Animated.View style={[
      { opacity: fadeAnim, transform: [{ translateY }, { scale }] }
    ]}>
      <Pressable 
        onPress={onPress}
        style={({ pressed }) => [
          styles.orderRow,
          {
            backgroundColor: colorScheme === 'dark' 
              ? 'rgba(17, 24, 39, 0.8)' 
              : 'rgba(255, 255, 255, 0.8)',
            transform: [{ scale: pressed ? 0.98 : 1 }]
          }
        ]}
        android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}>
        {/* Header Section */}
        <View style={[
          styles.orderHeader,
          {
            backgroundColor: colorScheme === 'dark' 
              ? 'rgba(31, 41, 55, 0.5)' 
              : 'rgba(249, 250, 251, 0.8)'
          }
        ]}>
          <View style={styles.orderHeaderContent}>
            <View style={styles.orderInfo}>
              <View style={styles.orderNumberContainer}>
                <ThemedText type="defaultSemiBold" style={styles.orderNumber}>
                  <ThemedText style={styles.orderNumberHash}>#</ThemedText>
                  {order.orderId}
                </ThemedText>
                <View style={[
                  styles.statusBadge,
                  {
                    backgroundColor: colorScheme === 'dark' 
                      ? order.status === 'completed' ? 'rgba(6, 95, 70, 0.3)' : 'rgba(153, 27, 27, 0.3)'
                      : order.status === 'completed' ? 'rgba(5, 150, 105, 0.15)' : 'rgba(220, 38, 38, 0.15)'
                  }
                ]}>
                  <MaterialCommunityIcons
                    name={order.status === 'completed' ? 'check-circle' : 'clock-outline'}
                    size={12}
                    color={colorScheme === 'dark'
                      ? order.status === 'completed' ? '#34D399' : '#FCA5A5'
                      : order.status === 'completed' ? '#059669' : '#DC2626'
                    }
                  />
                  <ThemedText style={[
                    styles.statusText,
                    {
                      color: colorScheme === 'dark'
                        ? order.status === 'completed' ? '#34D399' : '#FCA5A5'
                        : order.status === 'completed' ? '#059669' : '#DC2626'
                    }
                  ]}>
                    {order.status.toUpperCase()}
                  </ThemedText>
                </View>
              </View>
            </View>

            {order.trackingId && (
              <Pressable
                onPress={handleTrackingPress}
                style={({ pressed }) => [
                  styles.trackingButton,
                  {
                    backgroundColor: colorScheme === 'dark'
                      ? 'rgba(139, 92, 246, 0.2)'
                      : 'rgba(139, 92, 246, 0.1)',
                    opacity: pressed ? 0.8 : 1
                  }
                ]}
                android_ripple={{ color: 'rgba(139, 92, 246, 0.2)' }}>
                <MaterialCommunityIcons
                  name="truck-delivery"
                  size={14}
                  color="#8B5CF6"
                />
                <ThemedText style={[styles.trackingButtonText, { color: '#8B5CF6' }]}>
                  Track
                </ThemedText>
              </Pressable>
            )}
          </View>
        </View>

        {/* Products Grid */}
        <View style={styles.productsContainer}>
          {order.products.map((product, productIndex) => (
            <View
              key={`${product.sku}-${productIndex}`}
              style={[
                styles.productCard,
                {
                  backgroundColor: colorScheme === 'dark'
                    ? 'rgba(31, 41, 55, 0.3)'
                    : 'rgba(249, 250, 251, 0.8)'
                }
              ]}>
              {product.image && (
                <View style={styles.productImageContainer}>
                  <Image
                    source={{ uri: product.image }}
                    style={styles.productImage}
                    defaultSource={require('../../assets/images/react-logo.png')}
                  />
                </View>
              )}
              <View style={styles.productInfo}>
                <ThemedText type="defaultSemiBold" style={styles.productName} numberOfLines={2}>
                  {product.details}
                </ThemedText>
                <View style={styles.productMeta}>
                  <View style={[
                    styles.chip,
                    {
                      backgroundColor: colorScheme === 'dark'
                        ? 'rgba(31, 41, 55, 0.8)'
                        : 'rgba(255, 255, 255, 0.8)'
                    }
                  ]}>
                    <ThemedText style={styles.chipText}>SKU: {product.sku}</ThemedText>
                  </View>
                  <View style={[
                    styles.chip,
                    {
                      backgroundColor: colorScheme === 'dark'
                        ? 'rgba(31, 41, 55, 0.8)'
                        : 'rgba(255, 255, 255, 0.8)'
                    }
                  ]}>
                    <ThemedText style={styles.chipText}>Qty: {product.qty}</ThemedText>
                  </View>
                  <View style={[
                    styles.chip,
                    {
                      backgroundColor: colorScheme === 'dark'
                        ? 'rgba(31, 41, 55, 0.8)'
                        : 'rgba(255, 255, 255, 0.8)'
                    }
                  ]}>
                    <ThemedText style={[styles.chipText, { color: '#8B5CF6' }]}>
                      ₹{product.sale_price}
                    </ThemedText>
                  </View>
                </View>
                {(product.colour || product.size) && (
                  <View style={styles.productMeta}>
                    {product.colour && (
                      <View style={[
                        styles.chip,
                        {
                          backgroundColor: colorScheme === 'dark'
                            ? 'rgba(31, 41, 55, 0.8)'
                            : 'rgba(255, 255, 255, 0.8)'
                        }
                      ]}>
                        <ThemedText style={styles.chipText}>{product.colour}</ThemedText>
                      </View>
                    )}
                    {product.size && (
                      <View style={[
                        styles.chip,
                        {
                          backgroundColor: colorScheme === 'dark'
                            ? 'rgba(31, 41, 55, 0.8)'
                            : 'rgba(255, 255, 255, 0.8)'
                        }
                      ]}>
                        <ThemedText style={styles.chipText}>{product.size}</ThemedText>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          ))}
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
        <MaterialCommunityIcons
          name="package-variant"
          size={48}
          color={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'}
          style={styles.emptyStateIcon}
        />
        <ThemedText style={styles.emptyStateText}>
          No orders found
        </ThemedText>
        <ThemedText style={styles.emptyStateSubtext}>
          New orders will appear here
        </ThemedText>
      </Animated.View>
    );
  }

  return (
    <View style={styles.ordersList}>
      {orders.map((order, index) => (
        <OrderRow
          key={`${order.id}-${order.orderId}`}
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
    borderRadius: 16,
    overflow: 'hidden',
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
        elevation: 3,
      },
    }),
  },
  orderHeader: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(75, 85, 99, 0.2)',
  },
  orderHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderInfo: {
    flex: 1,
  },
  orderNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderNumber: {
    fontSize: isSmallScreen ? 14 : 15,
  },
  orderNumberHash: {
    color: '#8B5CF6',
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: isSmallScreen ? 10 : 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  trackingButtonText: {
    fontSize: isSmallScreen ? 12 : 13,
    fontWeight: '600',
  },
  productsContainer: {
    padding: 12,
    gap: 8,
  },
  productCard: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.2)',
  },
  productImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.2)',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    flex: 1,
    gap: 4,
  },
  productName: {
    fontSize: isSmallScreen ? 13 : 14,
  },
  productMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  chip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.2)',
  },
  chipText: {
    fontSize: isSmallScreen ? 11 : 12,
    opacity: 0.8,
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
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: isSmallScreen ? 15 : 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: isSmallScreen ? 13 : 14,
    opacity: 0.7,
    textAlign: 'center',
  },
}); 