import type { FirebaseOrder } from '../../types/firebase-order';

const API_KEY = 'x84kjjfkdjk';
const BASE_URL = 'https://order.bohurupi.com/api';

// Basic auth credentials (replace with actual values)
const EMAIL = 'admin@bohurupi.com';
const PASSWORD = 'admin123';

// Create Basic auth header using btoa for web
function createBasicAuth(username: string, password: string) {
  // Use btoa for web and a custom implementation for React Native
  const base64Encode = typeof btoa !== 'undefined'
    ? btoa
    : (str: string) => {
        // Simple base64 encoding for React Native
        return Buffer.from(str).toString('base64');
      };
  
  return base64Encode(`${username}:${password}`);
}

const headers = {
  'x-api-key': API_KEY,
  'Authorization': `Basic ${createBasicAuth(EMAIL, PASSWORD)}`,
  'Content-Type': 'application/json',
};

export async function fetchFirebaseOrders(status?: 'pending' | 'completed', search?: string): Promise<FirebaseOrder[]> {
  try {
    let url = `${BASE_URL}/firebase/orders`;
    if (status) {
      url = `${BASE_URL}/firebase/orders/${status}`;
    }
    if (search) {
      url += `${url.includes('?') ? '&' : '?'}search=${encodeURIComponent(search)}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch orders');
    }
    
    const data = await response.json();
    return data.orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch orders');
  }
}

export async function fetchCompletedOrders(search?: string): Promise<FirebaseOrder[]> {
  return fetchFirebaseOrders('completed', search);
}

export async function fetchPendingOrders(search?: string): Promise<FirebaseOrder[]> {
  return fetchFirebaseOrders('pending', search);
}

export async function createFirebaseOrder(orderData: Omit<FirebaseOrder, 'id'>): Promise<FirebaseOrder> {
  try {
    const response = await fetch(`${BASE_URL}/firebase/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create order');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error instanceof Error ? error : new Error('Failed to create order');
  }
}

export async function updateFirebaseOrder(id: string, orderData: Partial<FirebaseOrder>): Promise<FirebaseOrder> {
  try {
    const response = await fetch(`${BASE_URL}/firebase/orders`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ id, ...orderData }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update order');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating order:', error);
    throw error instanceof Error ? error : new Error('Failed to update order');
  }
}

export async function deleteFirebaseOrder(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/firebase/orders?id=${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete order');
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error instanceof Error ? error : new Error('Failed to delete order');
  }
}

// REST API calls for server-side operations
export async function fetchOrdersFromApi(status?: string, search?: string) {
  try {
    let url = `${BASE_URL}/firebase/orders`;
    if (status) {
      url = `${BASE_URL}/firebase/orders/${status}`;
    }

    if (search) {
      url += `?search=${encodeURIComponent(search)}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch orders');
    }
    
    const data = await response.json();
    return data.orders as FirebaseOrder[];
  } catch (error) {
    console.error('Error fetching orders from API:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch orders');
  }
} 