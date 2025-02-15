import { WooCommerceOrder } from '@/types/woocommerce';

// Add hardcoded values
export const API_BASE_URL = 'https://order.bohurupi.com';
export const API_KEY = 'x84kjjfkdjk';

export interface TransformedProduct {
  details: string;
  image: string;
  orderName: string;
  sku: string;
  sale_price: number;
  product_page_url: string;
  product_category: string;
  colour: string;
  size: string;
  qty: number;
}

export interface TransformedOrder {
  orderId: string;
  status: 'pending' | 'completed';
  orderstatus: string;
  customerName: string;
  products: TransformedProduct[];
}

/**
 * Helper function to extract product information from line items
 */
function transformLineItemsToProducts(lineItems: WooCommerceOrder['line_items']): TransformedProduct[] {
  return lineItems.map(item => {
    // Extract color/colour from meta data
    const colourMeta = item.meta_data.find(meta => 
      meta.key.toLowerCase().includes('color') || 
      meta.key.toLowerCase().includes('colour')
    );
    
    // Extract size from meta data
    const sizeMeta = item.meta_data.find(meta => 
      meta.key.toLowerCase().includes('size')
    );

    // Calculate sale price per unit
    const salePrice = typeof item.price === 'number' 
      ? item.price 
      : parseFloat(item.total) / item.quantity;

    return {
      details: item.name,
      image: '', // We'll get this from the product data if needed
      orderName: item.name,
      sku: item.sku || '',
      sale_price: salePrice,
      product_page_url: '', // We can construct this if needed
      product_category: '', // We can add this if needed
      colour: colourMeta?.value || 'Black',
      size: sizeMeta?.value || '',
      qty: item.quantity
    };
  });
}

/**
 * Fetches a WooCommerce order by its ID
 */
export async function fetchWooOrder(orderId: string): Promise<TransformedOrder> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/woocommerce/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch order: ${response.statusText}`);
    }

    const order: WooCommerceOrder = await response.json();

    // Transform the order data into our desired format
    const transformedOrder: TransformedOrder = {
      orderId: order.number,
      status: 'pending', // You might want to map WooCommerce status to your status
      orderstatus: order.payment_method === 'cod' ? 'COD' : 'Prepaid',
      customerName: `${order.billing.first_name} ${order.billing.last_name}`,
      products: transformLineItemsToProducts(order.line_items)
    };

    return transformedOrder;
  } catch (error) {
    console.error('Error fetching WooCommerce order:', error);
    throw error;
  }
}

/**
 * Fetches the latest WooCommerce orders
 */
export async function fetchLatestWooOrders(limit: number = 5): Promise<TransformedOrder[]> {
  try {
    const queryParams = new URLSearchParams({
      per_page: limit.toString(),
      orderby: 'date',
      order: 'desc',
    });

    const response = await fetch(`${API_BASE_URL}/api/woocommerce/orders?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch latest orders: ${response.statusText}`);
    }

    const orders: WooCommerceOrder[] = await response.json();

    // Transform each order
    const transformedOrders = orders.map(order => ({
      orderId: order.number,
      status: 'pending' as const, // You might want to map WooCommerce status to your status
      orderstatus: order.payment_method === 'cod' ? 'COD' : 'Prepaid',
      customerName: `${order.billing.first_name} ${order.billing.last_name}`,
      products: transformLineItemsToProducts(order.line_items)
    }));

    return transformedOrders;
  } catch (error) {
    console.error('Error fetching latest WooCommerce orders:', error);
    throw error;
  }
}

/**
 * Fetches WooCommerce orders with optional filters
 */
export async function fetchWooOrders(params?: {
  page?: number;
  per_page?: number;
  status?: string;
  search?: string;
  orderby?: 'date' | 'id' | 'title';
  order?: 'asc' | 'desc';
}): Promise<{
  orders: TransformedOrder[];
  total: number;
  totalPages: number;
}> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.orderby) queryParams.append('orderby', params.orderby);
    if (params?.order) queryParams.append('order', params.order);

    const response = await fetch(
      `${API_BASE_URL}/api/woocommerce/orders?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.statusText}`);
    }

    const orders: WooCommerceOrder[] = await response.json();
    const total = parseInt(response.headers.get('X-WP-Total') || '0', 10);
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '0', 10);

    // Transform the orders
    const transformedOrders = orders.map(order => ({
      orderId: order.number,
      status: 'pending' as const, // You might want to map WooCommerce status to your status
      orderstatus: order.payment_method === 'cod' ? 'COD' : 'Prepaid',
      customerName: `${order.billing.first_name} ${order.billing.last_name}`,
      products: transformLineItemsToProducts(order.line_items)
    }));

    return {
      orders: transformedOrders,
      total,
      totalPages,
    };
  } catch (error) {
    console.error('Error fetching WooCommerce orders:', error);
    throw error;
  }
} 