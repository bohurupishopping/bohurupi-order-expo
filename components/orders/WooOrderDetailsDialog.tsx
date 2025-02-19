import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Modal, Pressable, Dimensions, Platform, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue, 
  withTiming,
  runOnJS
} from 'react-native-reanimated';

import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { WooCommerceOrder } from '@/types/woocommerce';
import { getStatusColor } from '@/utils/statusColors';
import { 
  getVariantBadges, 
  getCustomizationDetails, 
  getProductUrls,
  MetaData 
} from '@/utils/orderHelpers';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 380;

interface WooLineItem {
  id: number;
  name: string;
  quantity: number;
  subtotal: string;
  total: string;
  sku: string;
  meta_data: MetaData[];
  image?: {
    id?: number;
    src?: string;
    name?: string;
    alt?: string;
  };
}

interface WooOrderDetailsDialogProps {
  order: WooCommerceOrder | null;
  visible: boolean;
  onClose: () => void;
}

// --- Image Preview Modal Component ---
function ImagePreviewModal({ 
  visible, 
  imageUrl, 
  onClose 
}: { 
  visible: boolean; 
  imageUrl: string; 
  onClose: () => void; 
}) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, {
        damping: 20,
        stiffness: 300
      });
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    opacity.value = withTiming(0, { duration: 200 });
    scale.value = withSpring(0.3, {
      damping: 20,
      stiffness: 300
    }, () => {
      runOnJS(onClose)();
    });
  }, [onClose]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }]
  }));

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={handleClose}
      animationType="none"
    >
      <Pressable 
        style={styles.previewBackdrop}
        onPress={handleClose}
      >
        <Animated.View style={[styles.previewImageContainer, animatedStyle]}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.previewImage}
            resizeMode="contain"
          />
          {/* Close Button for Image Preview */}
          <Pressable
              style={styles.previewCloseButton}
              onPress={handleClose}
            >
              <MaterialCommunityIcons name="close" size={24} color="white" />
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// --- Enhanced OrderItem component ---
function OrderItem({ item, currency, isLast }: { item: WooLineItem; currency: string; isLast: boolean }) {
  const colorScheme = useColorScheme();
  const variants = useMemo(() => getVariantBadges(item.meta_data), [item.meta_data]);
  const customization = useMemo(() => getCustomizationDetails(item.meta_data), [item.meta_data]);
  const { productUrl, downloadUrl } = useMemo(() => getProductUrls(item.meta_data), [item.meta_data]);
  const itemTotal = useMemo(() => parseFloat(item.total).toFixed(2), [item.total]);
  const itemUnitPrice = useMemo(
    () => (parseFloat(item.total) / item.quantity).toFixed(2),
    [item.total, item.quantity]
  );

  const [imageError, setImageError] = React.useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = React.useState(false);

  const handleImagePress = useCallback(() => {
    if (!imageError && item.image?.src) {
      setIsPreviewVisible(true);
    }
  }, [imageError, item.image?.src]);

  const handleLinkPress = useCallback((url: string) => {
    // Implement your navigation or linking logic here
    // For example, using Linking from react-native:
    // Linking.openURL(url);
  }, []);


  return (
    <View style={[
      styles.orderItem,
      isLast && styles.lastOrderItem,
      {
        backgroundColor: colorScheme === 'dark' 
          ? 'rgba(30, 41, 59, 0.7)' 
          : 'rgba(255, 255, 255, 0.9)',
        borderColor: colorScheme === 'dark' 
          ? 'rgba(255, 255, 255, 0.1)' 
          : 'rgba(0, 0, 0, 0.05)',
        borderWidth: 1
      }
    ]}>
      <View style={styles.itemRow}>
        {/* Image */}
        <Pressable 
          style={[
            styles.itemImageContainer,
            !imageError && item.image?.src && styles.clickableImage
          ]}
          onPress={handleImagePress}
        >
          <Image
            source={
              imageError || !item.image?.src
                ? require('@/assets/images/placeholder.png')
                : { uri: item.image.src }
            }
            style={styles.itemImage}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
        </Pressable>

        {/* Product Details */}
        <View style={styles.itemMainContent}>
          <View style={styles.itemTitleRow}>
            <ThemedText type="defaultSemiBold" style={styles.itemName} numberOfLines={2}> {/* Increased numberOfLines */}
              {item.name}
            </ThemedText>
            <ThemedText style={[
              styles.itemPrice,
              { color: colorScheme === 'dark' ? '#A78BFA' : '#8B5CF6' }
            ]}>
              {currency} {itemTotal}
            </ThemedText>
          </View>

          <View style={styles.itemMetaRow}>
            <View style={styles.skuContainer}>
              <ThemedText style={styles.itemMeta}>SKU: {item.sku}</ThemedText>
              <View style={styles.bulletPoint} />
              <ThemedText style={styles.itemMeta}>Qty: {item.quantity}</ThemedText>
              <View style={styles.bulletPoint} />
                <ThemedText style={styles.itemMeta}>
                 Unit Price: {currency} {itemUnitPrice}
                </ThemedText>
            </View>

            {variants.length > 0 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.variantsScroll}
                contentContainerStyle={styles.variantsScrollContent}
              >
                {variants.map((variant, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.variantBadge,
                      {
                        backgroundColor: colorScheme === 'dark'
                          ? variant.type === 'full-sleeve'
                            ? 'rgba(192, 132, 252, 0.3)'
                            : variant.type === 'children'
                              ? 'rgba(244, 114, 182, 0.3)'
                              : 'rgba(139, 92, 246, 0.3)'
                          : variant.type === 'full-sleeve'
                            ? 'rgba(217, 70, 239, 0.2)'
                            : variant.type === 'children'
                              ? 'rgba(236, 72, 153, 0.2)'
                              : 'rgba(139, 92, 246, 0.2)'
                      }
                    ]}>
                    <ThemedText style={[
                      styles.variantText,
                      { color: colorScheme === 'dark' ? '#E9D5FF' : '#6D28D9' }
                    ]}>
                      {variant.label}: {variant.value}
                    </ThemedText>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </View>

      {customization.length > 0 && (
        <View style={[
          styles.customizationContainer,
          {
            backgroundColor: colorScheme === 'dark' 
              ? 'rgba(139, 92, 246, 0.25)' 
              : 'rgba(139, 92, 246, 0.15)',
            borderColor: colorScheme === 'dark' 
              ? 'rgba(139, 92, 246, 0.4)' 
              : 'rgba(139, 92, 246, 0.2)',
            borderWidth: 1
          }
        ]}>
          <ThemedText type="defaultSemiBold" style={styles.customizationTitle}>
            Customization Details:
          </ThemedText>
          {customization.map((field, idx) => (
            <View key={idx} style={styles.customizationRow}>
              <ThemedText style={styles.customizationLabel}>{field.label}:</ThemedText>
              <ThemedText style={styles.customizationValue}>{field.value}</ThemedText>
            </View>
          ))}
        </View>
      )}

      {(productUrl || downloadUrl) && (
        <View style={styles.linksContainer}>
          {productUrl && (
            <Pressable
              style={[
                styles.linkButton, 
                { 
                  backgroundColor: colorScheme === 'dark' 
                    ? 'rgba(139, 92, 246, 0.4)' 
                    : 'rgba(139, 92, 246, 0.2)',
                  borderColor: colorScheme === 'dark' 
                    ? 'rgba(139, 92, 246, 0.6)' 
                    : 'rgba(139, 92, 246, 0.3)',
                  borderWidth: 1
                }
              ]}
              onPress={() => handleLinkPress(productUrl)}
            >
              <MaterialCommunityIcons name="link-variant" size={18} color="#8B5CF6" />
              <ThemedText style={[styles.linkText, { color: '#8B5CF6' }]}>View</ThemedText>
            </Pressable>
          )}
          {downloadUrl && (
            <Pressable
              style={[
                styles.linkButton, 
                { 
                  backgroundColor: colorScheme === 'dark' 
                    ? 'rgba(139, 92, 246, 0.4)' 
                    : 'rgba(139, 92, 246, 0.2)',
                  borderColor: colorScheme === 'dark' 
                    ? 'rgba(139, 92, 246, 0.6)' 
                    : 'rgba(139, 92, 246, 0.3)',
                  borderWidth: 1
                }
              ]}
              onPress={() => handleLinkPress(downloadUrl)}
            >
              <MaterialCommunityIcons name="download-outline" size={18} color="#8B5CF6" />
              <ThemedText style={[styles.linkText, { color: '#8B5CF6' }]}>Download</ThemedText>
            </Pressable>
          )}
        </View>
      )}

      {/* Image Preview Modal */}
      {item.image?.src && (
        <ImagePreviewModal
          visible={isPreviewVisible}
          imageUrl={item.image.src}
          onClose={() => setIsPreviewVisible(false)}
        />
      )}
    </View>
  );
}

// --- Section Component ---
function Section({
  title,
  icon,
  color,
  children,
  containerStyle,
}: {
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  children: React.ReactNode;
  containerStyle?: any;
}) {
  const colorScheme = useColorScheme();
  
  return (
    <View style={[styles.section, containerStyle]}>
      <View style={styles.sectionHeader}>
        <View style={[
          styles.sectionIcon,
          { 
            backgroundColor: colorScheme === 'dark' 
              ? `${color}30` 
              : `${color}20`
          }
        ]}>
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={colorScheme === 'dark' ? lightenColor(color, 20) : color}
          />
        </View>
        <ThemedText 
          type="defaultSemiBold" 
          style={[
            styles.sectionTitle, 
            { color: colorScheme === 'dark' ? lightenColor(color, 20) : color }
          ]}
        >
          {title}
        </ThemedText>
      </View>
      <View style={[
        styles.sectionContent,
        {
          backgroundColor: colorScheme === 'dark' 
            ? 'rgba(30, 41, 59, 0.7)' 
            : 'rgba(255, 255, 255, 0.9)',
          borderColor: colorScheme === 'dark' 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(0, 0, 0, 0.05)',
          borderWidth: 1
        }
      ]}>
        {children}
      </View>
    </View>
  );
}

// --- AddressDetails Component ---
function AddressDetails({ address }: { address: WooCommerceOrder['billing'] | WooCommerceOrder['shipping'] }) {
  return (
    <View style={styles.addressContainer}>
      <ThemedText type="defaultSemiBold" style={styles.addressName}>
        {address.first_name} {address.last_name}
      </ThemedText>
      <ThemedText style={styles.addressText}>{address.address_1}</ThemedText>
      {address.address_2 && (
        <ThemedText style={styles.addressText}>{address.address_2}</ThemedText>
      )}
      <ThemedText style={styles.addressText}>
        {address.city}, {address.state} {address.postcode}
      </ThemedText>
      <ThemedText style={styles.addressText}>{address.country}</ThemedText>
    </View>
  );
}

// --- SummaryRow Component ---
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <ThemedText style={styles.summaryLabel}>{label}</ThemedText>
      <ThemedText style={styles.summaryValue}>{value}</ThemedText>
    </View>
  );
}

// --- Main Dialog Component ---
export function WooOrderDetailsDialog({ order, visible, onClose }: WooOrderDetailsDialogProps) {
  const colorScheme = useColorScheme();
  const translateY = useSharedValue(height);
  const opacity = useSharedValue(0);

  const handleDismiss = useCallback(() => {
    translateY.value = withSpring(height, {
      damping: 20, // Increased damping
      stiffness: 200, // Increased stiffness
    });
    opacity.value = withTiming(0, {
      duration: 150 // Faster transition
    }, () => {
      runOnJS(onClose)();
    });
  }, [onClose]);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 150 }); // Faster transition
      translateY.value = withSpring(0, {
        damping: 20, // Increased damping
        stiffness: 200, // Increased stiffness
      });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!order || !visible) return null;

  const statusColor = getStatusColor(order.status);
  const bgColor = colorScheme === 'dark' ? statusColor.dark.bg : statusColor.bg;
  const textColor = colorScheme === 'dark' ? statusColor.dark.text : statusColor.text;

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
          <View style={[
            styles.sheetContainer,
            { backgroundColor: colorScheme === 'dark' ? '#2D3748' : '#FFFFFF' }
          ]}>
            <View style={styles.dragHandle} />

            <View style={[
              styles.header,
              {
                backgroundColor: colorScheme === 'dark' 
                  ? 'rgba(30, 41, 59, 0.95)' 
                  : 'rgba(233, 213, 255, 0.2)',
                borderBottomColor: colorScheme === 'dark' 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.05)',
                borderBottomWidth: 1
              }
            ]}>
              <Pressable
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: colorScheme === 'dark' 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'rgba(0, 0, 0, 0.05)',
                    borderColor: colorScheme === 'dark' 
                      ? 'rgba(255, 255, 255, 0.15)' 
                      : 'transparent',
                    borderWidth: 1
                  }
                ]}
                onPress={handleDismiss}>
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
                    backgroundColor: colorScheme === 'dark' 
                      ? 'rgba(139, 92, 246, 0.3)' 
                      : 'rgba(139, 92, 246, 0.2)'
                  }
                ]}>
                  <MaterialCommunityIcons
                    name="package-variant-closed"
                    size={22}
                    color={colorScheme === 'dark' ? '#A78BFA' : '#8B5CF6'}
                  />
                </View>
                <ThemedText 
                  type="title" 
                  style={[
                    styles.orderNumber,
                    { color: colorScheme === 'dark' ? '#F8FAFC' : '#1E293B' }
                  ]}
                >
                  Order #{order.number}
                </ThemedText>
              </View>

              <View style={styles.headerMeta}>
                <View style={styles.dateContainer}>
                  <MaterialCommunityIcons
                    name="calendar"
                    size={16}
                    color={colorScheme === 'dark' ? '#94A3B8' : '#64748B'}
                  />
                  <ThemedText style={[
                    styles.date,
                    { color: colorScheme === 'dark' ? '#CBD5E1' : '#475569' }
                  ]}>
                    {format(new Date(order.date_created), 'PPP p')}
                  </ThemedText>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
                  <ThemedText style={[
                    styles.statusText, 
                    { color: colorScheme === 'dark' ? textColor : '#1E293B' }
                  ]}>
                    {order.status.toUpperCase()}
                  </ThemedText>
                </View>
              </View>
            </View>

            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              bounces={true}>
              <Section
                title="Order Products"
                icon="package-variant-closed" // More specific icon
                color="#8B5CF6">
                {order.line_items.map((item, index) => (
                  <OrderItem
                    key={index}
                    item={item}
                    currency={order.currency}
                    isLast={index === order.line_items.length - 1}
                  />
                ))}
              </Section>

              <View style={styles.separator} />

              <View style={styles.twoColumnSection}>
                <View style={styles.column}>
                  <Section
                    title="Billing Address"
                    icon="card-account-details-outline" // More specific icon
                    color="#EC4899"
                    containerStyle={styles.addressSection}>
                    <AddressDetails address={order.billing} />
                  </Section>
                </View>
                <View style={styles.column}>
                  <Section
                    title="Shipping Address"
                    icon="truck-delivery-outline" // More specific icon
                    color="#6366F1"
                    containerStyle={styles.addressSection}>
                    <AddressDetails address={order.shipping} />
                  </Section>
                </View>
              </View>

              <View style={styles.separator} />

              <Section
                title="Order Summary"
                icon="script-text-outline"
                color="#F59E0B">
                <View style={styles.summaryContent}>
                  <SummaryRow
                    label="Subtotal"
                    value={`${order.currency} ${(
                      parseFloat(order.total) -
                      parseFloat(order.shipping_total) -
                      parseFloat(order.total_tax)
                    ).toFixed(2)}`}
                  />
                  <SummaryRow
                    label="Shipping"
                    value={`${order.currency} ${parseFloat(order.shipping_total).toFixed(2)}`}
                  />
                  <SummaryRow
                    label="Tax"
                    value={`${order.currency} ${parseFloat(order.total_tax).toFixed(2)}`}
                  />
                  <View style={styles.totalContainer}>
                    <ThemedText type="defaultSemiBold" style={styles.totalLabel}>
                      Total
                    </ThemedText>
                    <ThemedText type="defaultSemiBold" style={styles.totalValue}>
                      {order.currency} {parseFloat(order.total).toFixed(2)}
                    </ThemedText>
                  </View>
                </View>
              </Section>

              <Section
                title="Payment Method"
                icon="credit-card-outline" // More specific icon
                color="#10B981">
                <View style={styles.paymentContent}>
                  <View style={styles.paymentRow}>
                    <ThemedText style={styles.paymentLabel}>
                      Payment Method:
                    </ThemedText>
                    <ThemedText style={styles.paymentValue}>
                      {order.payment_method_title}
                    </ThemedText>
                  </View>
                  {order.transaction_id && (
                    <View style={styles.paymentRow}>
                      <ThemedText style={styles.paymentLabel}>
                        Transaction ID:
                      </ThemedText>
                      <ThemedText style={styles.paymentValue}>
                        {order.transaction_id}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </Section>

              {order.customer_note && (
                <Section
                  title="Customer Note"
                  icon="note-text-outline" // More specific icon
                  color="#3B82F6">
                  <ThemedText style={styles.customerNote}>
                    {order.customer_note}
                  </ThemedText>
                </Section>
              )}

              <View style={styles.bottomSpacing} />
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

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
    height: '95%',
    backgroundColor: 'transparent',
  },
  sheetContainer: {
    flex: 1,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
  },
  dragHandle: {
    width: 50, // Wider handle
    height: 5,
    backgroundColor: 'rgba(156, 163, 175, 0.6)', // Slightly more opaque
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: 10, // Increased margin
    marginBottom: 8,
  },
  header: {
    padding: 18, // Increased padding
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
    paddingTop: 6,
  },
  headerIconContainer: {
    width: 40, // Slightly larger
    height: 40,
    borderRadius: 12, // Increased radius
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10, // Increased margin
  },
  orderNumber: {
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
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5, // Increased gap
  },
  date: {
    fontSize: isSmallScreen ? 12 : 13,
    opacity: 0.75, // Slightly more opaque
    letterSpacing: 0.2,
  },
  statusBadge: {
    paddingHorizontal: 12, // Increased padding
    paddingVertical: 5,
    borderRadius: 15, // Increased radius
  },
  statusText: {
    fontSize: isSmallScreen ? 12 : 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 18, // Increased padding
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14, // Increased margin
  },
  sectionIcon: {
    width: isSmallScreen ? 34 : 38, // Slightly larger
    height: isSmallScreen ? 34 : 38,
    borderRadius: 12, // Increased radius
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10, // Increased margin
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 16 : 17, // Increased font size
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  sectionContent: {
    borderRadius: 15, // Increased radius
    overflow: 'hidden',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(75, 85, 99, 0.3)', // Slightly more opaque
    marginHorizontal: 18, // Increased margin
    marginVertical: 10, // Increased margin
  },
  twoColumnSection: {
    flexDirection: 'row',
    gap: 14, // Increased gap
    paddingHorizontal: 18, // Increased margin
  },
  column: {
    flex: 1,
  },
  addressSection: {
    padding: 0,
  },
  addressContainer: {
    padding: 18, // Increased padding
  },
  addressName: {
    marginBottom: 10, // Increased margin
    fontSize: isSmallScreen ? 14 : 15,
  },
  addressText: {
    fontSize: isSmallScreen ? 13 : 14,
    lineHeight: 22, // Increased line height
    opacity: 0.8,
  },
  summaryContent: {
    padding: 18, // Increased padding
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10, // Increased margin
  },
  summaryLabel: {
    opacity: 0.75, // Slightly more opaque
    fontSize: isSmallScreen ? 13 : 14,
  },
  summaryValue: {
    fontWeight: '500',
    fontSize: isSmallScreen ? 13 : 14,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14, // Increased margin
    paddingTop: 14,
  },
  totalLabel: {
    fontSize: isSmallScreen ? 16 : 17,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: isSmallScreen ? 16 : 17,
    fontWeight: '700',
  },
  paymentContent: {
    padding: 18, // Increased padding
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 10, // Increased margin
  },
  paymentLabel: {
    width: 130, // Increased width
    opacity: 0.75, // Slightly more opaque
    fontSize: isSmallScreen ? 13 : 14,
  },
  paymentValue: {
    flex: 1,
    fontWeight: '500',
    fontSize: isSmallScreen ? 13 : 14,
  },
  customerNote: {
    padding: 18, // Increased padding
    lineHeight: 22, // Increased line height
  },
  bottomSpacing: {
    height: 36, // Increased spacing
  },
  orderItem: {
    padding: 14, // Increased padding
    borderRadius: 15, // Increased radius
    marginBottom: 10, // Increased margin
  },
  lastOrderItem: {
    marginBottom: 0,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImageContainer: {
    width: 65, // Slightly larger
    height: 65,
    borderRadius: 10, // Increased radius
    overflow: 'hidden',
    marginRight: 14, // Increased margin
    backgroundColor: 'rgba(75, 85, 99, 0.1)',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  itemMainContent: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5, // Increased margin
  },
  itemName: {
    fontSize: isSmallScreen ? 14 : 15,
    flex: 1,
    marginRight: 10, // Increased margin
  },
  itemPrice: {
    fontSize: isSmallScreen ? 15 : 16,
    fontWeight: '700', // Bolder
    color: '#8B5CF6',
  },
  itemMetaRow: {
    flexDirection: 'column',
    gap: 5, // Increased gap
  },
  skuContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemMeta: {
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
  variantsScrollContent: {
    flexDirection: 'row',
  },
  variantBadge: {
    paddingHorizontal: 10, // Increased padding
    paddingVertical: 5,
    borderRadius: 10, // Increased radius
  },
  variantBadgeMargin: {
    marginRight: 8, // Increased margin
  },
  variantText: {
    fontSize: isSmallScreen ? 11 : 12,
    fontWeight: '600', // Bolder
    color: '#4B5563'
  },
  customizationContainer: {
    borderRadius: 10, // Increased radius
    padding: 14, // Increased padding
    marginTop: 10, // Increased margin
  },
  customizationTitle: {
    fontSize: isSmallScreen ? 14 : 15,
    marginBottom: 10, // Increased margin
    color: '#8B5CF6',
  },
  customizationRow: {
    flexDirection: 'row',
    marginBottom: 5, // Increased margin
  },
  customizationLabel: {
    fontSize: isSmallScreen ? 12 : 13,
    opacity: 0.75, // Slightly more opaque
    width: 110, // Increased width
  },
  customizationValue: {
    fontSize: isSmallScreen ? 12 : 13,
    flex: 1,
  },
  linksContainer: {
    flexDirection: 'row',
    marginTop: 12, // Increased margin
    gap: 10, // Added gap for spacing
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center content
    paddingHorizontal: 12, // Increased padding
    paddingVertical: 6,
    borderRadius: 10, // Increased radius
    // Added a subtle shadow for depth (optional, but improves look)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2, // For Android shadow
  },
  linkText: {
    fontSize: isSmallScreen ? 12 : 13,
    marginLeft: 6,
    fontWeight: '600', // Make the text bolder
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
     // Add shadow for a "lifted" effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
    previewCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    borderRadius: 20, // Fully rounded
    padding: 5, // Padding around the icon
    zIndex: 2 //make sure close is above image
  },
  clickableImage: {
    cursor: 'pointer',
  },
});

function lightenColor(hex: string, percent: number): string {
  // Remove # if present
  const formattedHex = hex.replace(/^#/, '');
  
  // Parse hex values
  const bigint = parseInt(formattedHex, 16);
  let r = (bigint >> 16) & 255;
  let g = (bigint >> 8) & 255;
  let b = bigint & 255;

  // Lighten each color channel
  r = Math.min(255, r + (255 - r) * (percent / 100));
  g = Math.min(255, g + (255 - g) * (percent / 100));
  b = Math.min(255, b + (255 - b) * (percent / 100));

  // Convert back to hex and pad with zeros
  return `#${[
    Math.round(r).toString(16).padStart(2, '0'),
    Math.round(g).toString(16).padStart(2, '0'),
    Math.round(b).toString(16).padStart(2, '0')
  ].join('')}`;
} 