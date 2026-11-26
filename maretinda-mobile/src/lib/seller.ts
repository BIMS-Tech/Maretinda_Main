import { client } from './client';

export async function getSeller(handle: string) {
  const { data } = await client.get(`/store/seller/${handle}`);
  return data.seller;
}

export async function listWishlist() {
  const { data } = await client.get('/store/wishlist');
  return (data.wishlists?.[0]?.products ?? []) as any[];
}

export async function addToWishlist(productId: string): Promise<void> {
  await client.post('/store/wishlist', { reference: 'product', reference_id: productId });
}

export async function removeFromWishlist(productId: string): Promise<void> {
  await client.delete(`/store/wishlist/product/${productId}`);
}
