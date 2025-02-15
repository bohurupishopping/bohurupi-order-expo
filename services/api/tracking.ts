import type { TrackingData } from '../../types/firebase-order';

const API_KEY = 'x84kjjfkdjk';
const BASE_URL = 'https://order.bohurupi.com/api';

// Basic auth credentials (use the same as firebase-orders.ts)
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

export async function fetchTrackingInfo(trackingId: string): Promise<TrackingData> {
  try {
    const response = await fetch(
      `${BASE_URL}/tracking?waybill=${trackingId}`,
      { headers }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch tracking data');
    }

    const data = await response.json();
    return data as TrackingData;
  } catch (error) {
    console.error('Error fetching tracking info:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch tracking information');
  }
}

export function getTrackingUrl(trackingId: string): string {
  return `https://www.delhivery.com/track-v2/package/${trackingId}`;
} 