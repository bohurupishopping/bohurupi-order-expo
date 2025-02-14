import { WooCommerceOrder } from '@/types/woocommerce';

export interface MetaData {
  id?: number;
  key: string;
  value: string;
  display_key: string;
  display_value: string;
}

export interface Variant {
  label: string;
  value: string;
  type: 'regular' | 'full-sleeve' | 'children';
}

// Helper function to get meta value
export function getMetaValue(meta_data: MetaData[], key: string): string | null {
  for (let i = 0; i < meta_data.length; i++) {
    if (meta_data[i].key === key) {
      return meta_data[i].value;
    }
  }
  return null;
}

// Helper function to get variant badges
export function getVariantBadges(meta_data: MetaData[]): Variant[] {
  const variants = [
    { key: 'select_size', label: 'Size' },
    { key: 'select_colour', label: 'Color' },
    { key: 'select_colour_fs', label: 'Full Sleeve Color' },
    { key: 'size_fs', label: 'Full Sleeve Size' },
    { key: 'select_size_child', label: "Child's Size" },
    { key: 'select_colour_child', label: "Child's Color" },
  ];

  const result: Variant[] = [];
  for (let i = 0; i < variants.length; i++) {
    const value = getMetaValue(meta_data, variants[i].key);
    if (value) {
      result.push({
        label: variants[i].label,
        value: value,
        type: variants[i].key.includes('_fs') ? 'full-sleeve' : 
              variants[i].key.includes('_child') ? 'children' : 'regular'
      });
    }
  }
  return result;
}

// Extract customization details from meta_data
export function getCustomizationDetails(meta_data: MetaData[]) {
  return meta_data.filter(meta => 
    !meta.key.startsWith('_') && 
    !meta.key.includes('select_') &&
    !meta.key.includes('size_') &&
    meta.key !== 'pa_size' &&
    meta.key !== 'pa_color'
  ).map(field => ({
    label: field.display_key.replace(/_/g, ' '),
    value: field.display_value
  }));
}

// Extract product URL and download URL from meta_data
export function getProductUrls(meta_data: MetaData[]) {
  const productUrlMeta = meta_data.find(meta => meta.key === '_product_url' || meta.key === 'product_url');
  const downloadUrlMeta = meta_data.find(meta => meta.key === '_download_url' || meta.key === 'download_url');
  return {
    productUrl: productUrlMeta?.value,
    downloadUrl: downloadUrlMeta?.value
  };
} 