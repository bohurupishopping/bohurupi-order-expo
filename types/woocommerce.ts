export interface WooCommerceOrder {
  id: number;
  number: string;
  status: string;
  currency: string;
  date_created: string;
  total: string;
  shipping_total: string;
  total_tax: string;
  customer_note: string;
  payment_method_title: string;
  transaction_id: string;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  line_items: Array<{
    id: number;
    name: string;
    quantity: number;
    subtotal: string;
    total: string;
    sku: string;
    meta_data: Array<{
      key: string;
      value: string;
      display_key: string;
      display_value: string;
    }>;
  }>;
  meta_data: Array<{
    key: string;
    value: string;
  }>;
} 