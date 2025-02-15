import React, { memo, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Pressable,
  Dimensions,
  Platform,
  ColorSchemeName,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '../ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FirebaseOrder } from '../../types/firebase-order';
import { formatDate } from '../../utils/date';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

const STATUS_COLORS = {
  pending: {
    bg: '#fef3c7',
    text: '#92400e',
    dark: {
      bg: '#422006',
      text: '#fde047'
    }
  },
  completed: {
    bg: '#dcfce7',
    text: '#166534',
    dark: {
      bg: '#052e16',
      text: '#4ade80'
    }
  },
  default: {
    bg: '#f3f4f6',
    text: '#374151',
    dark: {
      bg: '#1f2937',
      text: '#e5e7eb'
    }
  }
} as const;

const ORDER_STATUS_COLORS = {
  cod: {
    bg: '#fff7ed',
    text: '#9a3412',
    dark: {
      bg: '#431407',
      text: '#fb923c'
    }
  },
  prepaid: {
    bg: '#eff6ff',
    text: '#1e40af',
    dark: {
      bg: '#172554',
      text: '#60a5fa'
    }
  },
  default: {
    bg: '#f3f4f6',
    text: '#374151',
    dark: {
      bg: '#1f2937',
      text: '#e5e7eb'
    }
  }
} as const;

const getStatusColor = (status: string) => 
  STATUS_COLORS[status.toLowerCase() as keyof typeof STATUS_COLORS] || STATUS_COLORS.default;

const getOrderStatusColor = (status: string) =>
  ORDER_STATUS_COLORS[status.toLowerCase() as keyof typeof ORDER_STATUS_COLORS] || ORDER_STATUS_COLORS.default;

// Memoized product component for better performance
const ProductItem = memo(({ product, colorScheme }: { 
  product: FirebaseOrder['products'][0];
  colorScheme: ColorSchemeName;
}) => (
  <View style={[styles.product, { backgroundColor: colorScheme === 'dark' ? 'rgba(31, 41, 55, 0.3)' : 'rgba(249, 250, 251, 0.8)' }]}>
    <View style={styles.productContent}>
      {product.image && (
        <Image
          source={{ uri: product.image }}
          style={styles.productImage}
          defaultSource={require('../../assets/images/placeholder.png')}
        />
      )}
      <View style={styles.productInfo}>
        <ThemedText type="defaultSemiBold" style={styles.productName} numberOfLines={2}>
          {product.details}
        </ThemedText>
        <View style={styles.productMeta}>
          <View style={[styles.chip, { backgroundColor: colorScheme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(255, 255, 255, 0.8)' }]}>
            <ThemedText style={styles.chipText}>SKU: {product.sku}</ThemedText>
          </View>
          <View style={[styles.chip, { backgroundColor: colorScheme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(255, 255, 255, 0.8)' }]}>
            <ThemedText style={styles.chipText}>Qty: {product.qty}</ThemedText>
          </View>
          <View style={[styles.chip, { backgroundColor: colorScheme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)' }]}>
            <ThemedText style={[styles.chipText, { color: '#8B5CF6' }]}>₹{product.sale_price}</ThemedText>
          </View>
        </View>
        {(product.colour || product.size) && (
          <View style={styles.productMeta}>
            {product.colour && (
              <View style={[styles.chip, { backgroundColor: colorScheme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(255, 255, 255, 0.8)' }]}>
                <ThemedText style={styles.chipText}>{product.colour}</ThemedText>
              </View>
            )}
            {product.size && (
              <View style={[styles.chip, { backgroundColor: colorScheme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(255, 255, 255, 0.8)' }]}>
                <ThemedText style={styles.chipText}>{product.size}</ThemedText>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  </View>
));

ProductItem.displayName = 'ProductItem';

export const FirebaseOrderCard = memo(({ order, onPressDetails, onPressTracking, index }: {
  order: FirebaseOrder;
  onPressDetails: (order: FirebaseOrder) => void;
  onPressTracking: (trackingId: string) => void;
  index: number;
}) => {
  const colorScheme = useColorScheme();
  const statusColors = useMemo(() => getStatusColor(order.status), [order.status]);
  const orderStatusColors = useMemo(() => getOrderStatusColor(order.orderstatus), [order.orderstatus]);
  
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 150 });
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
        mass: 0.5
      });
    }, index * 30);

    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }]
  }));

  const handlePress = useCallback(() => {
    scale.value = withSpring(0.98, { mass: 0.5 });
    onPressDetails(order);
  }, [order, onPressDetails]);

  const handleTrackingPress = useCallback(() => {
    if (order.trackingId) {
      onPressTracking(order.trackingId);
    }
  }, [order.trackingId, onPressTracking]);

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colorScheme === 'dark' ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.5)',
            borderColor: colorScheme === 'dark' ? 'rgba(75, 85, 99, 0.4)' : 'rgba(229, 231, 235, 0.8)',
            transform: [{ scale: pressed ? 0.98 : 1 }]
          }
        ]}
        onPress={handlePress}
        android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}>
        <View style={styles.header}>
          <View>
            <ThemedText type="defaultSemiBold" style={styles.orderId}>
              #{order.orderId}
            </ThemedText>
            <View style={styles.dateContainer}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={14}
                color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
              />
              <ThemedText style={styles.date}>
                {formatDate(order.createdAt)}
              </ThemedText>
            </View>
          </View>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: colorScheme === 'dark' ? statusColors.dark.bg : statusColors.bg }]}>
              <ThemedText style={[styles.badgeText, { color: colorScheme === 'dark' ? statusColors.dark.text : statusColors.text }]}>
                {order.status.toUpperCase()}
              </ThemedText>
            </View>
            <View style={[styles.badge, { backgroundColor: colorScheme === 'dark' ? orderStatusColors.dark.bg : orderStatusColors.bg }]}>
              <ThemedText style={[styles.badgeText, { color: colorScheme === 'dark' ? orderStatusColors.dark.text : orderStatusColors.text }]}>
                {order.orderstatus.toUpperCase()}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.products}>
          {order.products.map((product, index) => (
            <ProductItem
              key={`${product.sku}-${index}`}
              product={product}
              colorScheme={colorScheme}
            />
          ))}
        </View>

        {order.trackingId && (
          <View style={styles.actions}>
            <Pressable
              style={[
                styles.button,
                styles.outlineButton,
                {
                  backgroundColor: colorScheme === 'dark' ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                  borderColor: colorScheme === 'dark' ? 'rgba(75, 85, 99, 0.4)' : 'rgba(229, 231, 235, 0.8)'
                }
              ]}
              onPress={handleTrackingPress}
              android_ripple={{ color: 'rgba(139, 92, 246, 0.1)' }}>
              <MaterialCommunityIcons
                name="truck-delivery"
                size={16}
                color="#8B5CF6"
              />
              <ThemedText style={[styles.buttonText, { color: '#8B5CF6' }]}>
                View Tracking
              </ThemedText>
            </Pressable>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
});

FirebaseOrderCard.displayName = 'FirebaseOrderCard';

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(75, 85, 99, 0.2)',
  },
  orderId: {
    fontSize: isSmallScreen ? 14 : 15,
    color: '#8B5CF6',
    marginBottom: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  date: {
    fontSize: isSmallScreen ? 11 : 12,
    opacity: 0.7,
  },
  badges: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: isSmallScreen ? 10 : 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  products: {
    padding: 12,
    gap: 8,
  },
  product: {
    borderRadius: 8,
    padding: 8,
  },
  productContent: {
    flexDirection: 'row',
    gap: 12,
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: 'rgba(75, 85, 99, 0.1)',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: isSmallScreen ? 13 : 14,
    marginBottom: 4,
  },
  productMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  chipText: {
    fontSize: isSmallScreen ? 11 : 12,
    opacity: 0.8,
  },
  chipLabel: {
    fontSize: isSmallScreen ? 11 : 12,
    opacity: 0.7,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    padding: 12,
    paddingTop: 0,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  outlineButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: '500',
  },
}); 