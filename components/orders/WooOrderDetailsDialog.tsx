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

// Image Preview Modal Component
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
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// Enhanced OrderItem component
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

  return (
    <View style={[
      styles.orderItem,
      isLast && styles.lastOrderItem,
      { backgroundColor: colorScheme === 'dark' ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.5)' }
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
            <ThemedText type="defaultSemiBold" style={styles.itemName} numberOfLines={1}>
              {item.name}
            </ThemedText>
            <ThemedText style={styles.itemPrice}>
              {currency} {itemTotal}
            </ThemedText>
          </View>

          <View style={styles.itemMetaRow}>
            <View style={styles.skuContainer}>
              <ThemedText style={styles.itemMeta}>SKU: {item.sku}</ThemedText>
              <View style={styles.bulletPoint} />
              <ThemedText style={styles.itemMeta}>Qty: {item.quantity}</ThemedText>
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
                      idx !== variants.length - 1 && styles.variantBadgeMargin,
                      {
                        backgroundColor: colorScheme === 'dark'
                          ? variant.type === 'full-sleeve'
                            ? 'rgba(217, 70, 239, 0.2)'
                            : variant.type === 'children'
                              ? 'rgba(236, 72, 153, 0.2)'
                              : 'rgba(139, 92, 246, 0.2)'
                          : variant.type === 'full-sleeve'
                            ? 'rgba(217, 70, 239, 0.1)'
                            : variant.type === 'children'
                              ? 'rgba(236, 72, 153, 0.1)'
                              : 'rgba(139, 92, 246, 0.1)'
                      }
                    ]}>
                    <ThemedText style={styles.variantText}>
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
              ? 'rgba(139, 92, 246, 0.1)'
              : 'rgba(139, 92, 246, 0.05)'
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
              style={[styles.linkButton, { marginRight: 8 }]}
              onPress={() => {}}>
              <MaterialCommunityIcons name="link" size={16} color="#8B5CF6" />
              <ThemedText style={[styles.linkText, { color: '#8B5CF6' }]}>
                View Product
              </ThemedText>
            </Pressable>
          )}
          {downloadUrl && (
            <Pressable
              style={styles.linkButton}
              onPress={() => {}}>
              <MaterialCommunityIcons name="download" size={16} color="#8B5CF6" />
              <ThemedText style={[styles.linkText, { color: '#8B5CF6' }]}>
                Download Design
              </ThemedText>
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
        <View style={[styles.sectionIcon, { backgroundColor: `${color}15` }]}>
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={color}
          />
        </View>
        <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { color }]}>
          {title}
        </ThemedText>
      </View>
      <View style={[
        styles.sectionContent,
        {
          backgroundColor: colorScheme === 'dark' ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.5)',
          borderColor: colorScheme === 'dark' ? 'rgba(75, 85, 99, 0.4)' : 'rgba(229, 231, 235, 0.8)'
        }
      ]}>
        {children}
      </View>
    </View>
  );
}

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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <ThemedText style={styles.summaryLabel}>{label}</ThemedText>
      <ThemedText style={styles.summaryValue}>{value}</ThemedText>
    </View>
  );
}

export function WooOrderDetailsDialog({ order, visible, onClose }: WooOrderDetailsDialogProps) {
  const colorScheme = useColorScheme();
  const translateY = useSharedValue(height);
  const opacity = useSharedValue(0);

  const handleDismiss = useCallback(() => {
    translateY.value = withSpring(height, {
      damping: 15,
      stiffness: 150
    });
    opacity.value = withTiming(0, {
      duration: 200
    }, () => {
      runOnJS(onClose)();
    });
  }, [onClose]);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150
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
            styles.modalContent,
            {
              backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF'
            }
          ]}>
            <View style={styles.dragHandle} />

            <View style={[
              styles.header,
              {
                backgroundColor: colorScheme === 'dark' 
                  ? 'rgba(88, 28, 135, 0.1)' 
                  : 'rgba(139, 92, 246, 0.1)'
              }
            ]}>
              <Pressable
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: colorScheme === 'dark' 
                      ? 'rgba(31, 41, 55, 0.8)' 
                      : 'rgba(255, 255, 255, 0.8)'
                  }
                ]}
                onPress={handleDismiss}>
                <MaterialCommunityIcons 
                  name="arrow-left"
                  size={24}
                  color={colorScheme === 'dark' ? '#E5E7EB' : '#374151'}
                />
              </Pressable>

              <View style={styles.headerContent}>
                <View style={[
                  styles.headerIconContainer,
                  {
                    backgroundColor: colorScheme === 'dark' 
                      ? 'rgba(139, 92, 246, 0.2)' 
                      : 'rgba(139, 92, 246, 0.1)'
                  }
                ]}>
                  <MaterialCommunityIcons
                    name="package-variant"
                    size={20}
                    color="#8B5CF6"
                  />
                </View>
                <ThemedText type="title" style={styles.orderNumber}>
                  Order #{order.number}
                </ThemedText>
              </View>

              <View style={styles.headerMeta}>
                <View style={styles.dateContainer}>
                  <MaterialCommunityIcons
                    name="calendar"
                    size={14}
                    color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
                  />
                  <ThemedText style={styles.date}>
                    {format(new Date(order.date_created), 'PPP p')}
                  </ThemedText>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
                  <ThemedText style={[styles.statusText, { color: textColor }]}>
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
                icon="package-variant"
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
                    icon="map-marker"
                    color="#EC4899"
                    containerStyle={styles.addressSection}>
                    <AddressDetails address={order.billing} />
                  </Section>
                </View>
                <View style={styles.column}>
                  <Section
                    title="Shipping Address"
                    icon="truck-delivery"
                    color="#6366F1"
                    containerStyle={styles.addressSection}>
                    <AddressDetails address={order.shipping} />
                  </Section>
                </View>
              </View>

              <View style={styles.separator} />

              <Section
                title="Order Summary"
                icon="receipt"
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
                icon="credit-card"
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
                  icon="note-text"
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropPressable: {
    flex: 1,
  },
  modalContainer: {
    height: '95%',
    backgroundColor: 'transparent',
  },
  modalContent: {
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  orderNumber: {
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
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  date: {
    fontSize: isSmallScreen ? 11 : 12,
    opacity: 0.7,
    letterSpacing: 0.2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: isSmallScreen ? 11 : 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    width: isSmallScreen ? 32 : 36,
    height: isSmallScreen ? 32 : 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: isSmallScreen ? 15 : 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(75, 85, 99, 0.2)',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  twoColumnSection: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
  column: {
    flex: 1,
  },
  addressSection: {
    padding: 0,
  },
  addressContainer: {
    padding: 16,
  },
  addressName: {
    marginBottom: 8,
  },
  addressText: {
    fontSize: isSmallScreen ? 13 : 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  summaryContent: {
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    opacity: 0.7,
    fontSize: isSmallScreen ? 13 : 14,
  },
  summaryValue: {
    fontWeight: '500',
    fontSize: isSmallScreen ? 13 : 14,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(75, 85, 99, 0.2)',
  },
  totalLabel: {
    fontSize: isSmallScreen ? 15 : 16,
  },
  totalValue: {
    fontSize: isSmallScreen ? 15 : 16,
  },
  paymentContent: {
    padding: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  paymentLabel: {
    width: 120,
    opacity: 0.7,
    fontSize: isSmallScreen ? 13 : 14,
  },
  paymentValue: {
    flex: 1,
    fontWeight: '500',
    fontSize: isSmallScreen ? 13 : 14,
  },
  customerNote: {
    padding: 16,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 32,
  },
  orderItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.2)',
    marginBottom: 8,
  },
  lastOrderItem: {
    marginBottom: 0,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
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
    marginBottom: 4,
  },
  itemName: {
    fontSize: isSmallScreen ? 13 : 14,
    flex: 1,
    marginRight: 8,
  },
  itemPrice: {
    fontSize: isSmallScreen ? 14 : 15,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  itemMetaRow: {
    flexDirection: 'column',
    gap: 4,
  },
  skuContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemMeta: {
    fontSize: isSmallScreen ? 11 : 12,
    opacity: 0.7,
  },
  bulletPoint: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(75, 85, 99, 0.5)',
    marginHorizontal: 6,
  },
  variantsScroll: {
    marginTop: 4,
  },
  variantsScrollContent: {
    flexDirection: 'row',
  },
  variantBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  variantBadgeMargin: {
    marginRight: 6,
  },
  variantText: {
    fontSize: isSmallScreen ? 10 : 11,
    fontWeight: '500',
  },
  customizationContainer: {
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  customizationTitle: {
    fontSize: isSmallScreen ? 13 : 14,
    marginBottom: 8,
    color: '#8B5CF6',
  },
  customizationRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  customizationLabel: {
    fontSize: isSmallScreen ? 11 : 12,
    opacity: 0.7,
    width: 100,
  },
  customizationValue: {
    fontSize: isSmallScreen ? 11 : 12,
    flex: 1,
  },
  linksContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  linkText: {
    fontSize: isSmallScreen ? 11 : 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImageContainer: {
    width: width * 0.9,
    height: height * 0.6,
    backgroundColor: 'transparent',
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  clickableImage: {
    cursor: 'pointer',
  },
}); 