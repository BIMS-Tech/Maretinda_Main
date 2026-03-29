import { client } from './client';

export async function listProducts({
  regionId,
  limit = 12,
  offset = 0,
  pageParam,
  category_id,
  collection_id,
  q,
}: {
  regionId: string;
  limit?: number;
  offset?: number;
  pageParam?: number;
  category_id?: string;
  collection_id?: string;
  q?: string;
}) {
  const resolvedOffset =
    pageParam != null ? (Math.max(pageParam, 1) - 1) * limit : offset;

  const { data } = await client.get('/store/products', {
    params: {
      region_id: regionId,
      limit,
      offset: resolvedOffset,
      category_id,
      collection_id,
      q,
      fields:
        'id,title,handle,thumbnail,variants,options,tags,collection,categories,metadata',
    },
  });

  const products: any[] = data.products ?? [];
  const count: number = data.count ?? 0;
  const nextPage =
    resolvedOffset + limit < count
      ? (pageParam ?? 1) + 1
      : null;

  return { products, count, nextPage };
}

export async function getProduct(id: string, regionId: string) {
  const { data } = await client.get(`/store/products/${id}`, {
    params: {
      region_id: regionId,
      fields:
        'id,title,handle,description,thumbnail,images,variants,options,tags,collection,categories,metadata,*variants.calculated_price',
    },
  });
  return data.product;
}

export async function getProductByHandle(handle: string, regionId: string) {
  const { data } = await client.get('/store/products', {
    params: {
      handle,
      region_id: regionId,
      fields:
        'id,title,handle,description,thumbnail,images,variants,options,tags,collection,categories,metadata,*variants.calculated_price',
    },
  });
  return data.products?.[0] ?? null;
}

export async function listCategories() {
  const { data } = await client.get('/store/product-categories', {
    params: { limit: 100, fields: 'id,name,handle,parent_category_id' },
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
