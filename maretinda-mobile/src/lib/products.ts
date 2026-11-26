import type { SearchResult, SuggestResult } from '@/types';

import { client } from './client';

export const SORTS = [
  { label: 'Popular', value: 'popular' },
  { label: 'Newest', value: 'newest' },
  { label: 'Best selling', value: 'best_selling' },
  { label: 'Price: low', value: 'price_asc' },
  { label: 'Price: high', value: 'price_desc' },
  { label: 'Top rated', value: 'rating' },
  { label: 'Discount', value: 'discount' },
] as const;
export type Sort = (typeof SORTS)[number]['value'] | 'relevance';

export interface SearchOptions {
  regionId?: string;
  q?: string;
  sort?: Sort;
  page?: number;
  limit?: number;
  category?: string;
  collection_id?: string;
  seller?: string;
  on_sale?: boolean;
  in_stock?: boolean;
  verified?: boolean;
  min_price?: number;
  max_price?: number;
  rating?: number;
}

/** The storefront's search: typos forgiven, live prices and stock. */
export async function searchProducts({ regionId, on_sale, in_stock, verified, category, ...rest }: SearchOptions): Promise<SearchResult> {
  const { data } = await client.get('/store/search', {
    params: {
      ...rest,
      category: category || undefined,
      in_stock: in_stock ? 1 : undefined,
      on_sale: on_sale ? 1 : undefined,
      q: rest.q || undefined,
      region_id: regionId,
      verified: verified ? 1 : undefined,
    },
  });
  return data;
}

export async function suggest(q: string, regionId?: string): Promise<SuggestResult> {
  const { data } = await client.get('/store/search/suggest', { params: { q: q || undefined, region_id: regionId } });
  return data;
}

const PRODUCT_FIELDS = [
  'id,title,handle,description,thumbnail,metadata',
  '*images,*options,*options.values,*variants,*variants.options,*variants.options.option,*variants.calculated_price',
  '+variants.inventory_quantity,*categories,+seller.id,+seller.name,+seller.handle,+seller.photo',
  '*reviews,*reviews.customer',
].join(',');

export async function getProduct(id: string, regionId: string) {
  const { data } = await client.get(`/store/products/${id}`, {
    params: {
      region_id: regionId,
      fields: PRODUCT_FIELDS,
    },
  });
  return data.product;
}

export async function getProductByHandle(handle: string, regionId: string) {
  const { data } = await client.get('/store/products', {
    params: {
      handle,
      region_id: regionId,
      fields: PRODUCT_FIELDS,
    },
  });
  return data.products?.[0] ?? null;
}

export async function listCategories() {
  const { data } = await client.get('/store/product-categories', {
    params: { fields: 'id,name,handle,parent_category_id,rank', limit: 100 },
  });
  return data.product_categories as any[];
}

export async function listCollections(regionId: string) {
  const { data } = await client.get('/store/collections', {
    params: { region_id: regionId },
  });
  return data.collections as any[];
}

export async function getRegions() {
  const { data } = await client.get('/store/regions');
  return data.regions as any[];
}
