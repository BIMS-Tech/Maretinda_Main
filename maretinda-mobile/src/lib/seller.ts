import { client } from './client';

export async function getSeller(handle: string) {
  const { data } = await client.get(`/store/sellers/${handle}`);
  return data.seller;
}

export async function listSellerReviews(sellerId: string) {
  const { data } = await client.get('/store/reviews', {
    params: { seller_id: sellerId, limit: 20 },
  });
  return data.reviews as any[];
}

export async function listProductReviews(productId: string) {
  const { data } = await client.get('/store/reviews', {
    params: { product_id: productId, limit: 20 },
  });
  return data.reviews as any[];
}

export async function listWishlist() {
  const { data } = await client.get('/store/wishlist');
  return data.wishlist?.products ?? [];
}

export async function addToWishlist(productId: string) {
  const { data } = await client.post('/store/wishlist', { product_id: productId });
  return data.wishlist;
}

export async function removeFromWishlist(productId: string) {
  const { data } = await client.delete(`/store/wishlist/${productId}`);
  return data.wishlist;
}
