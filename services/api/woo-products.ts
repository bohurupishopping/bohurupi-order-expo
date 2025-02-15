// Add hardcoded values
export const API_BASE_URL = 'https://order.bohurupi.com';
export const API_KEY = 'x84kjjfkdjk';

export interface WooProduct {
  id: number;
  name: string;
  permalink: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  images: Array<{
    id: number;
    src: string;
    name: string;
    alt: string;
  }>;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  attributes: Array<{
    id: number;
    name: string;
    position: number;
    visible: boolean;
    variation: boolean;
    options: string[];
  }>;
  variations: number[];
  meta_data: Array<{
    id: number;
    key: string;
    value: string;
  }>;
}

/**
 * Fetches a WooCommerce product by its ID
 */
export async function fetchWooProduct(productId: number): Promise<WooProduct> {
  try {
    // Add trailing slash to match backend URL pattern
    const response = await fetch(`${API_BASE_URL}/api/woocommerce/products/${productId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        // Add basic auth for admin access
        'Authorization': `Basic ${Buffer.from('admin@bohurupi.com:admin123').toString('base64')}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch product: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching WooCommerce product:', error);
    throw error;
  }
}

/**
 * Fetches WooCommerce products with optional filters
 */
export async function fetchWooProducts(params?: {
  page?: number;
  per_page?: number;
  search?: string;
  category?: string;
  tag?: string;
  status?: string;
  orderby?: 'date' | 'id' | 'title' | 'slug' | 'price';
  order?: 'asc' | 'desc';
}): Promise<{
  products: WooProduct[];
  total: number;
  totalPages: number;
}> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.tag) queryParams.append('tag', params.tag);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.orderby) queryParams.append('orderby', params.orderby);
    if (params?.order) queryParams.append('order', params.order);

    const response = await fetch(
      `${API_BASE_URL}/api/woocommerce/products?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          // Add basic auth for admin access
          'Authorization': `Basic ${Buffer.from('admin@bohurupi.com:admin123').toString('base64')}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch products: ${response.statusText}`);
    }

    const data = await response.json();
    const total = parseInt(response.headers.get('X-WP-Total') || '0', 10);
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '0', 10);

    return {
      products: data,
      total,
      totalPages,
    };
  } catch (error) {
    console.error('Error fetching WooCommerce products:', error);
    throw error;
  }
} 