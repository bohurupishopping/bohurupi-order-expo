export interface FirebaseOrder {
  id?: string;
  orderId: string;
  status: 'pending' | 'completed';
  orderstatus: string;
  customerName: string;
  email?: string;
  phone?: string;
  address?: string;
  trackingId?: string;
  designUrl?: string;
  products: Array<{
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
    downloaddesign?: string;
  }>;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

export interface FirebaseProduct {
  id?: string;
  post_title: string;
  sku: string;
  sale_price: number;
  images: string;
  product_page_url: string;
  "tax:product_cat": string;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

export interface TrackingStatus {
  Status: string;
  StatusDateTime: string;
  StatusLocation: string;
  Instructions: string;
}

export interface TrackingScan {
  ScanDetail: {
    Scan: string;
    ScanDateTime: string;
    ScanLocation: string;
    Instructions: string;
  };
}

export interface TrackingData {
  ShipmentData: Array<{
    Shipment: {
      Status: TrackingStatus;
      Scans: TrackingScan[];
      EstimatedDeliveryDate: string | null;
      PromisedDeliveryDate: string | null;
      ActualDeliveryDate: string | null;
    };
  }>;
} 