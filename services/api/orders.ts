import { WooCommerceOrder } from '@/types/woocommerce';

const API_BASE_URL = 'https://order.bohurupi.com/api';
const API_KEY = 'x84kjjfkdjk';

interface FetchOrdersParams {
  status?: WooCommerceOrder['status'];
  per_page?: number;
  page?: number;
}

interface OrderMetrics {
  pendingOrders: number;
  processingOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
}

export async function fetchOrders(params: FetchOrdersParams = {}): Promise<WooCommerceOrder[]> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.status) {
      queryParams.append('status', params.status);
    }
    
    if (params.per_page) {
      queryParams.append('per_page', params.per_page.toString());
    }
    
    if (params.page) {
      queryParams.append('page', params.page.toString());
    }

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/woocommerce/orders${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      headers: {
        'x-api-key': API_KEY,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}

export async function fetchOrderMetrics(): Promise<OrderMetrics> {
  try {
    const [pendingOrders, processingOrders, deliveredOrders] = await Promise.all([
      fetchOrders({ status: 'pending' }),
      fetchOrders({ status: 'processing' }),
      fetchOrders({ status: 'completed' }),
    ]);

    const totalRevenue = deliveredOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);

    return {
      pendingOrders: pendingOrders.length,
      processingOrders: processingOrders.length,
      deliveredOrders: deliveredOrders.length,
      totalRevenue,
    };
  } catch (error) {
    console.error('Error fetching order metrics:', error);
    return {
      pendingOrders: 0,
      processingOrders: 0,
      deliveredOrders: 0,
      totalRevenue: 0,
    };
  }
} 