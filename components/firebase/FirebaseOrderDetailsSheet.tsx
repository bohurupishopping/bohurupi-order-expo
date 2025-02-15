import React, { memo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Modal,
  Dimensions,
  Platform,
  Linking,
  ColorSchemeName,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import { ThemedText } from '../ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FirebaseOrder } from '../../types/firebase-order';
import { formatDate } from '../../utils/date';
import { getTrackingUrl } from '../../services/api/tracking';

const { height } = Dimensions.get('window');
const isSmallScreen = Dimensions.get('window').width < 380;

interface FirebaseOrderDetailsSheetProps {
  order: FirebaseOrder | null;
  visible: boolean;
  onClose: () => void;
  onPressTracking: (trackingId: string) => void;
}

const ProductCard = memo(({ product, colorScheme }: {
  product: FirebaseOrder['products'][0];
  colorScheme: ColorSchemeName;
}) => {
  const handleProductPress = useCallback(() => {
    if (product.product_page_url) {
      Linking.openURL(product.product_page_url);
    }
  }, [product.product_page_url]);

  const handleDesignPress = useCallback(() => {
    if (product.downloaddesign) {
      Linking.openURL(product.downloaddesign);
    }
  }, [product.downloaddesign]);

  return (
    <View style={[
      styles.productCard,
      { backgroundColor: colorScheme === 'dark' ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.5)' }
    ]}>
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
          <View style={styles.productActions}>
            {product.product_page_url && (
              <Pressable
                style={[styles.actionButton, { backgroundColor: colorScheme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)' }]}
                onPress={handleProductPress}
                android_ripple={{ color: 'rgba(139, 92, 246, 0.1)' }}>
                <MaterialCommunityIcons name="link" size={16} color="#8B5CF6" />
                <ThemedText style={[styles.actionButtonText, { color: '#8B5CF6' }]}>View Product</ThemedText>
              </Pressable>
            )}
            {product.downloaddesign && (
              <Pressable
                style={[styles.actionButton, { backgroundColor: colorScheme === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)' }]}
                onPress={handleDesignPress}
                android_ripple={{ color: 'rgba(139, 92, 246, 0.1)' }}>
                <MaterialCommunityIcons name="download" size={16} color="#8B5CF6" />
                <ThemedText style={[styles.actionButtonText, { color: '#8B5CF6' }]}>Download Design</ThemedText>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );
});

ProductCard.displayName = 'ProductCard';

export const FirebaseOrderDetailsSheet = memo(({
  order,
  visible,
  onClose,
  onPressTracking
}: FirebaseOrderDetailsSheetProps) => {
  const colorScheme = useColorScheme();
  const translateY = useSharedValue(height);
  const opacity = useSharedValue(0);

  const handleDismiss = useCallback(() => {
    translateY.value = withSpring(height, {
      damping: 15,
      stiffness: 150,
      mass: 0.5
    });
    opacity.value = withTiming(0, { duration: 150 }, () => {
      runOnJS(onClose)();
    });
  }, [onClose]);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 150 });
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
        mass: 0.5
      });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleTrackingPress = useCallback(() => {
    if (order?.trackingId) {
      Linking.openURL(getTrackingUrl(order.trackingId));
    }
  }, [order?.trackingId]);

  const handleTrackingStatus = useCallback(() => {
    if (order?.trackingId) {
      onPressTracking(order.trackingId);
    }
  }, [order?.trackingId, onPressTracking]);

  if (!order) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}>
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={styles.backdropPressable} onPress={handleDismiss} />
        </Animated.View>

        <Animated.View style={[styles.modalContainer, modalStyle]}>
          <View style={[styles.sheetContainer, { backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF' }]}>
            <View style={styles.dragHandle} />

            <View style={[styles.header, { backgroundColor: colorScheme === 'dark' ? 'rgba(88, 28, 135, 0.1)' : 'rgba(139, 92, 246, 0.1)' }]}>
              <Pressable
                style={[styles.closeButton, { backgroundColor: colorScheme === 'dark' ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)' }]}
                onPress={handleDismiss}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={colorScheme === 'dark' ? '#E5E7EB' : '#374151'} />
              </Pressable>

              <View style={styles.headerContent}>
                <View style={[styles.headerIconContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)' }]}>
                  <MaterialCommunityIcons name="package-variant" size={20} color="#8B5CF6" />
                </View>
                <ThemedText type="title" style={styles.orderTitle}>Order #{order.orderId}</ThemedText>
              </View>

              <View style={styles.headerMeta}>
                <View style={styles.customerInfo}>
                  <MaterialCommunityIcons name="account" size={14} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                  <ThemedText style={styles.customerName}>{order.customerName}</ThemedText>
                </View>
                <View style={styles.dateInfo}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                  <ThemedText style={styles.date}>{formatDate(order.createdAt)}</ThemedText>
                </View>
              </View>
            </View>

            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              bounces={Platform.OS === 'ios'}
              overScrollMode="never"
              removeClippedSubviews={true}>
              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Order Products</ThemedText>
                <View style={styles.productsList}>
                  {order.products.map((product, index) => (
                    <ProductCard
                      key={`${product.sku}-${index}`}
                      product={product}
                      colorScheme={colorScheme}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Order Timeline</ThemedText>
                <View style={[styles.timelineContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.5)' }]}>
                  <View style={styles.timelineItem}>
                    <ThemedText style={styles.timelineLabel}>Created At</ThemedText>
                    <ThemedText type="defaultSemiBold" style={styles.timelineValue}>{formatDate(order.createdAt)}</ThemedText>
                  </View>
                  {order.updatedAt && (
                    <View style={styles.timelineItem}>
                      <ThemedText style={styles.timelineLabel}>Last Updated</ThemedText>
                      <ThemedText type="defaultSemiBold" style={styles.timelineValue}>{formatDate(order.updatedAt)}</ThemedText>
                    </View>
                  )}
                </View>
              </View>

              {order.trackingId && (
                <View style={styles.section}>
                  <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Shipping Information</ThemedText>
                  <View style={[styles.shippingContainer, { backgroundColor: colorScheme === 'dark' ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.5)' }]}>
                    <ThemedText type="defaultSemiBold" style={styles.trackingId}>Tracking ID: {order.trackingId}</ThemedText>
                    <View style={styles.shippingActions}>
                      <Pressable
                        style={[styles.shippingButton, styles.outlineButton, { backgroundColor: colorScheme === 'dark' ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.8)' }]}
                        onPress={handleTrackingPress}
                        android_ripple={{ color: 'rgba(139, 92, 246, 0.1)' }}>
                        <MaterialCommunityIcons name="truck-delivery" size={16} color="#8B5CF6" />
                        <ThemedText style={[styles.buttonText, { color: '#8B5CF6' }]}>Track on Delhivery</ThemedText>
                      </Pressable>
                      <Pressable
                        style={[styles.shippingButton, styles.primaryButton, { backgroundColor: colorScheme === 'dark' ? 'rgba(139, 92, 246, 0.2)' : '#8B5CF6' }]}
                        onPress={handleTrackingStatus}
                        android_ripple={{ color: 'rgba(255, 255, 255, 0.1)' }}>
                        <MaterialCommunityIcons name="truck-check" size={16} color={colorScheme === 'dark' ? '#8B5CF6' : '#FFFFFF'} />
                        <ThemedText style={[styles.buttonText, { color: colorScheme === 'dark' ? '#8B5CF6' : '#FFFFFF' }]}>View Tracking</ThemedText>
                      </Pressable>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.bottomSpacing} />
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
});

FirebaseOrderDetailsSheet.displayName = 'FirebaseOrderDetailsSheet';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropPressable: {
    flex: 1,
  },
  modalContainer: {
    height: '90%',
    backgroundColor: 'transparent',
  },
  sheetContainer: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(156, 163, 175, 0.4)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(75, 85, 99, 0.2)',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    paddingTop: 4,
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  orderTitle: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customerName: {
    fontSize: isSmallScreen ? 12 : 13,
    opacity: 0.8,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  date: {
    fontSize: isSmallScreen ? 12 : 13,
    opacity: 0.8,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 15 : 16,
    marginBottom: 12,
  },
  productsList: {
    gap: 12,
  },
  productCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.2)',
  },
  productContent: {
    flexDirection: 'row',
    gap: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
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
    marginBottom: 4,
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
  productActions: {
    flexDirection: 'row',
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
  actionButtonText: {
    fontSize: isSmallScreen ? 11 : 12,
    fontWeight: '500',
  },
  timelineContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.2)',
    gap: 12,
  },
  timelineItem: {
    gap: 4,
  },
  timelineLabel: {
    fontSize: isSmallScreen ? 11 : 12,
    opacity: 0.7,
  },
  timelineValue: {
    fontSize: isSmallScreen ? 13 : 14,
  },
  shippingContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.2)',
  },
  trackingId: {
    fontSize: isSmallScreen ? 13 : 14,
    marginBottom: 12,
  },
  shippingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  shippingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  primaryButton: {
    backgroundColor: '#8B5CF6',
  },
  buttonText: {
    fontSize: isSmallScreen ? 13 : 14,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 32,
  },
}); 