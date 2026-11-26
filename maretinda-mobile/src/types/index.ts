export interface Region {
  id: string;
  name: string;
  currency_code: string;
  countries: { iso_2: string; display_name: string }[];
}

export interface ProductVariant {
  id: string;
  title: string;
  sku?: string;
  inventory_quantity?: number | null;
  manage_inventory?: boolean;
  allow_backorder?: boolean;
  calculated_price?: {
    calculated_amount: number;
    original_amount: number;
    currency_code: string;
  };
  options?: { value: string; option?: { title: string } }[];
}

export interface Product {
  id: string;
  title: string;
  handle: string;
  description?: string;
  thumbnail?: string;
  images?: { id: string; url: string }[];
  variants: ProductVariant[];
  options?: { id: string; title: string; values: { value: string }[] }[];
  collection?: { id: string; title: string; handle: string };
  categories?: { id: string; name: string; handle: string }[];
  metadata?: Record<string, unknown>;
  seller?: Seller;
  reviews?: Review[];
  calculated_amount?: number | null;
}

/** A product as a card shows it. */
export interface ProductCardData {
  id: string;
  title: string;
  handle: string;
  thumbnail: string | null;
  price: number | null;
  original_price: number | null;
  currency_code: string;
  flash_sale: boolean;
  in_stock: boolean;
  /** The only variant, when there is nothing to choose */
  variant_id: string | null;
  rating: number;
  review_count: number;
  sold: number;
  brand: string | null;
  category: { name: string; handle: string } | null;
  seller: { id: string; name: string; handle: string; verified: boolean } | null;
}

export interface SearchResult {
  products: ProductCardData[];
  count: number;
  page: number;
  pages: number;
  relaxed: boolean;
  did_you_mean: string | null;
  on_sale_count: number;
  in_stock_count: number;
  verified_count: number;
}

export interface SuggestResult {
  query: string;
  did_you_mean: string | null;
  products: ProductCardData[];
  categories: { name: string; handle: string; count: number }[];
  shops: { name: string; handle: string; count: number }[];
}

export interface Seller {
  id: string;
  name: string;
  handle: string;
  photo?: string;
  description?: string;
  rating?: number;
  review_count?: number;
}

export interface CartLineItem {
  id: string;
  quantity: number;
  unit_price: number;
  total: number;
  variant: ProductVariant & { product: Product };
  thumbnail?: string;
  product_title?: string;
  variant_title?: string;
}

export interface Cart {
  id: string;
  items: CartLineItem[];
  region?: Region;
  subtotal: number;
  shipping_total: number;
  total: number;
  currency_code: string;
  shipping_address?: Address;
  payment_collection?: { id: string };
}

export interface Address {
  id?: string;
  first_name?: string;
  last_name?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country_code?: string;
  phone?: string;
}

export interface Order {
  id: string;
  display_id: number;
  status: string;
  fulfillment_status?: string;
  payment_status?: string;
  created_at: string;
  total: number;
  currency_code: string;
  items: CartLineItem[];
  shipping_address?: Address;
}

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  addresses?: Address[];
}

export interface Review {
  id: string;
  rating: number;
  customer_note?: string;
  seller_note?: string;
  customer?: { first_name: string; last_name: string };
  created_at: string;
}
