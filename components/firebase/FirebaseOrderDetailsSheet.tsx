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

const { height, width } = Dimensions.get('window');
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
  const [isPreviewVisible, setIsPreviewVisible] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  const handleImagePress = useCallback(() => {
    if (!imageError && product.image) {
      setIsPreviewVisible(true);
    }
  }, [imageError, product.image]);

  const handleDesignPress = useCallback(() => {
    if (product.downloaddesign) {
      Linking.openURL(product.downloaddesign);
    }
  }, [product.downloaddesign]);

  return (
    <View style={[
      styles.productCard,
      { 
        backgroundColor: colorScheme === 'dark' 
          ? 'rgba(30, 41, 59, 0.7)' 
          : 'rgba(255, 255, 255, 0.8)',
        borderColor: colorScheme === 'dark' 
          ? 'rgba(255, 255, 255, 0.1)' 
          : 'rgba(0, 0, 0, 0.05)'
      }
    ]}>
      <View style={styles.productContent}>
        {product.image && (
          <Pressable
            style={[
              styles.productImageContainer,
              !imageError && product.image && styles.clickableImage,
            ]}
            onPress={handleImagePress}
          >
            <Image
              source={{ uri: product.image }}
              style={styles.productImage}
              defaultSource={require('../../assets/images/placeholder.png')}
              onError={() => setImageError(true)}
            />
          </Pressable>
        )}
        <View style={styles.productInfo}>
          <View style={styles.productTitleRow}>
            <ThemedText type="defaultSemiBold" style={styles.productName} numberOfLines={2}>
              {product.details}
            </ThemedText>
            <ThemedText style={styles.productPrice}>₹{product.sale_price}</ThemedText>
          </View>
          <View style={styles.productMetaRow}>
            <View style={styles.skuContainer}>
              <ThemedText style={styles.metaText}>SKU: {product.sku}</ThemedText>
              <View style={styles.bulletPoint} />
              <ThemedText style={styles.metaText}>Qty: {product.qty}</ThemedText>
            </View>
            {(product.colour || product.size) && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.variantsScroll}
                contentContainerStyle={styles.variantsScrollContent}
              >
                {product.colour && (
                  <View style={[
                    styles.variantBadge,
                    { backgroundColor: colorScheme === 'dark' ? 'rgba(159, 122, 234, 0.3)' : 'rgba(159, 122, 234, 0.2)' }
                  ]}>
                    <ThemedText style={styles.variantText}>{product.colour}</ThemedText>
                  </View>
                )}
                {product.size && (
                  <View style={[
                    styles.variantBadge,
                    { backgroundColor: colorScheme === 'dark' ? 'rgba(159, 122, 234, 0.3)' : 'rgba(159, 122, 234, 0.2)' },
                    product.colour && styles.variantBadgeMargin
                  ]}>
                    <ThemedText style={styles.variantText}>{product.size}</ThemedText>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
          {product.downloaddesign && (
            <View style={styles.productActions}>
               <Pressable
                style={[styles.actionButton, { backgroundColor: colorScheme === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)' }]}
                onPress={handleDesignPress}
                android_ripple={{ color: 'rgba(139, 92, 246, 0.2)' }}>
                <MaterialCommunityIcons name="download-outline" size={16} color="#8B5CF6" />
                <ThemedText style={[styles.actionButtonText, { color: '#8B5CF6' }]}>Download</ThemedText>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* Image Preview Modal */}
      {product.image && (
        <Modal
          transparent
          visible={isPreviewVisible}
          onRequestClose={() => setIsPreviewVisible(false)}
          animationType="fade"
        >
          <Pressable
            style={styles.previewBackdrop}
            onPress={() => setIsPreviewVisible(false)}
          >
            <Animated.View style={[styles.previewImageContainer]}>
              <Image
                source={{ uri: product.image }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            </Animated.View>
          </Pressable>
        </Modal>
      )}
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
      damping: 20, // Increased damping for a slightly bouncier feel
      stiffness: 200, // Increased stiffness
      mass: 0.7 // Increased mass slightly
    });
    opacity.value = withTiming(0, { duration: 200 }, () => { // Faster fade-out
      runOnJS(onClose)();
    });
  }, [onClose]);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 }); // Faster fade-in
      translateY.value = withSpring(0, {
        damping: 20, // Increased damping
        stiffness: 200, // Increased stiffness
        mass: 0.7 // Increased mass
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

  console.log('Order data:', {
    id: order.id,
    orderId: order.orderId,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    formattedCreated: formatDate(order.createdAt),
    formattedUpdated: formatDate(order.updatedAt)
  });

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
          <View style={[styles.sheetContainer, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#E5E7EB' }]}>
             <View style={styles.dragHandle} />

            <View style={[
              styles.header,
              {
                backgroundColor: colorScheme === 'dark' ? 'rgba(30, 41, 59, 0.95)' : '#dff2ef',
                borderBottomColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                borderBottomWidth: 1
              }
            ]}>
              <Pressable
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                  }
                ]}
                onPress={handleDismiss}
                >
                <MaterialCommunityIcons 
                  name="close" 
                  size={24} 
                  color={colorScheme === 'dark' ? '#E2E8F0' : '#374151'} 
                />
              </Pressable>

              <View style={styles.headerContent}>
                <View style={[
                  styles.headerIconContainer,
                  {
                    backgroundColor: colorScheme === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)'
                  }
                ]}>
                  <MaterialCommunityIcons 
                    name="package-variant-closed" 
                    size={24} 
                    color={colorScheme === 'dark' ? '#8B5CF6' : '#7C3AED'} 
                  />
                </View>
                <ThemedText 
                  type="title" 
                  style={[styles.orderTitle, { color: colorScheme === 'dark' ? '#F8FAFC' : '#1E293B' }]}
                >
                  Order #{order.orderId}
                </ThemedText>
              </View>

              <View style={styles.headerMeta}>
                <View style={styles.customerInfo}>
                  <MaterialCommunityIcons 
                    name="account-outline" 
                    size={16} 
                    color={colorScheme === 'dark' ? '#94A3B8' : '#64748B'} 
                  />
                  <ThemedText 
                    style={[styles.customerName, { color: colorScheme === 'dark' ? '#CBD5E1' : '#475569' }]}
                  >
                    {order.customerName}
                  </ThemedText>
                </View>
                <View style={styles.dateInfo}>
                  <MaterialCommunityIcons 
                    name="clock-outline" 
                    size={16} 
                    color={colorScheme === 'dark' ? '#94A3B8' : '#64748B'} 
                  />
                  <ThemedText 
                    style={[styles.date, { color: colorScheme === 'dark' ? '#CBD5E1' : '#475569' }]}
                  >
                    {formatDate(order.createdAt)}
                  </ThemedText>
                </View>
              </View>
            </View>

            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              bounces={Platform.OS === 'ios'}
              overScrollMode="never"
              removeClippedSubviews={true}
              >
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
                <View style={[
                ]}>
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
                  <View style={[
                    ]}>
                    <ThemedText type="defaultSemiBold" style={styles.trackingId}>Tracking ID: {order.trackingId}</ThemedText>
                    <View style={styles.shippingActions}>
                      <Pressable
                        style={[
                          styles.shippingButton, 
                          styles.outlineButton, 
                          { 
                            borderColor: colorScheme === 'dark' 
                              ? 'rgba(165, 180, 252, 0.4)' 
                              : 'rgba(139, 92, 246, 0.4)'
                          }
                        ]}
                        onPress={handleTrackingPress}
                        android_ripple={{ color: 'rgba(139, 92, 246, 0.2)' }}>
                        <MaterialCommunityIcons 
                          name="truck-delivery-outline" 
                          size={18} 
                          color={colorScheme === 'dark' ? '#A5B4FC' : '#8B5CF6'} 
                        />
                        <ThemedText style={[styles.buttonText, { 
                          color: colorScheme === 'dark' ? '#A5B4FC' : '#8B5CF6' 
                        }]}>
                          Track on Delhivery
                        </ThemedText>
                      </Pressable>
                      <Pressable
                       style={[
                        styles.shippingButton,
                        styles.primaryButton,
                         { backgroundColor: colorScheme === 'dark' ? 'rgba(139, 92, 246, 0.9)' : '#8B5CF6' }
                        ]}
                        onPress={handleTrackingStatus}
                        android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}>
                        <MaterialCommunityIcons name="truck-check-outline" size={18} color={colorScheme === 'dark' ? '#FFFFFF' : '#FFFFFF'} />
                        <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>View Tracking</ThemedText>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Slightly darker backdrop
  },
  backdropPressable: {
    flex: 1,
  },
  modalContainer: {
    height: '90%', // Consider making this dynamic based on content
    backgroundColor: 'transparent',
  },
  sheetContainer: {
    flex: 1,
    borderTopLeftRadius: 25, // Increased radius
    borderTopRightRadius: 25,
    overflow: 'hidden',
  },
  dragHandle: {
    width: 50,
    height: 5,
    backgroundColor: 'rgba(156, 163, 175, 0.6)', // Slightly more opaque
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: 10, // Increased margin
    marginBottom: 8,
  },
  header: {
    padding: 18, // Increased padding
    // Removed borderBottom
  },
  closeButton: {
    position: 'absolute',
    top: 18, // Align with header padding
    left: 18,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10, // Increased margin
    paddingTop: 6
  },
  headerIconContainer: {
    width: 40, // Slightly larger
    height: 40,
    borderRadius: 12, // Increased radius
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10, // Increased margin
  },
  orderTitle: {
    fontSize: isSmallScreen ? 17 : 19,
    fontWeight: '700', // Bolder
    letterSpacing: 0.5,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16, // Increased gap
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5, // Increased gap
  },
  customerName: {
    fontSize: isSmallScreen ? 13 : 14, // Increased font size
    opacity: 0.85, // Slightly more opaque
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5, // Increased gap
  },
  date: {
    fontSize: isSmallScreen ? 13 : 14,  // Increased font size
    opacity: 0.85,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 18, // Increased padding
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 16 : 17, // Increased font size
    marginBottom: 14, // Increased margin
  },
  productsList: {
    gap: 14, // Increased gap
  },
  productCard: {
    borderRadius: 15, // Increased radius
    padding: 14, // Increased padding
    // Removed border
  },
  productContent: {
    flexDirection: 'row',
    gap: 14, // Increased gap
  },
  productImageContainer: {
    width: 65, // Slightly larger
    height: 65,
    borderRadius: 10, // Increased radius
    overflow: 'hidden',
     backgroundColor: 'rgba(75, 85, 99, 0.1)',
  },
  productImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent'
  },
  productInfo: {
    flex: 1,
  },
  productTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5, // Increased margin
  },
  productName: {
    fontSize: isSmallScreen ? 14 : 15,
    flex: 1,
    marginRight: 10, // Increased margin
  },
  productPrice: {
    fontSize: isSmallScreen ? 15 : 16,
    fontWeight: '700', // Bolder
    color: '#8B5CF6',
  },
  productMetaRow: {
    flexDirection: 'column',
    gap: 5, // Increased gap
  },
  skuContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: isSmallScreen ? 12 : 13,
    opacity: 0.75, // Slightly more opaque
  },
  bulletPoint: {
    width: 4, // Slightly larger
    height: 4,
    borderRadius: 2, // Increased radius
    backgroundColor: 'rgba(75, 85, 99, 0.6)', // Slightly more opaque
    marginHorizontal: 8, // Increased margin
  },
  variantsScroll: {
    marginTop: 6, // Increased margin
  },
variantsScrollContent:{
   flexDirection: 'row',
},
  variantBadge: {
    paddingHorizontal: 10, // Increased padding
    paddingVertical: 5,
    borderRadius: 10, // Increased radius
  },
  variantBadgeMargin: {
    marginLeft: 8, // Increased margin
  },
  variantText: {
    fontSize: isSmallScreen ? 11 : 12,
    fontWeight: '600', // Bolder
    color: '#8B5CF6',
  },
  productActions: {
    flexDirection: 'row',
    gap: 8, // Increased gap
    marginTop: 10, // Increased margin
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: isSmallScreen ? 11 : 12,
    fontWeight: '600', // Bolder
  },
  timelineContainer: {
    padding: 18, // Increased padding
    borderRadius: 15, // Increased radius
    // Removed border
    gap: 14, // Increased gap
  },
  timelineItem: {
    gap: 5, // Increased gap
  },
  timelineLabel: {
    fontSize: isSmallScreen ? 12 : 13,
    opacity: 0.75,
  },
  timelineValue: {
     fontSize: isSmallScreen ? 14 : 15,
    fontWeight: '600' // Increased font size
  },
  shippingContainer: {
    padding: 18, // Increased padding
    borderRadius: 15, // Increased radius
    // Removed border
  },
  trackingId: {
    fontSize: isSmallScreen ? 14 : 15,
    marginBottom: 14, // Increased margin
  },
  shippingActions: {
    flexDirection: 'row',
    gap: 10, // Increased gap
  },
  shippingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8, // Increased gap
    paddingVertical: 10, // Increased padding
    paddingHorizontal: 18,
    borderRadius: 10, // Increased radius
  },
  outlineButton: {
    borderWidth: 1,
  },
  primaryButton: {
    // backgroundColor: '#8B5CF6',  // Keep consistent purple
  },
  buttonText: {
     fontSize: isSmallScreen ? 14 : 15,
    fontWeight: '600', // Bolder
  },
  bottomSpacing: {
    height: 40, // Increased spacing
  },
  clickableImage:{
    cursor: 'pointer'
  },
   previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Darker backdrop
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImageContainer: {
    width: width * 0.9,
    height: height * 0.6,
    backgroundColor: 'transparent', // Ensure transparency
    borderRadius: 15, // Increased radius
    overflow: 'hidden', // Ensure image corners are rounded
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
});