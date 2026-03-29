import { client } from './client';
import { getCartId, getRegionId, removeCartId, setCartId } from './storage';

async function ensureCart(): Promise<string> {
  let cartId = await getCartId();
  if (cartId) return cartId;

  const regionId = await getRegionId();
  const { data } = await client.post('/store/carts', {
    region_id: regionId,
  });
  cartId = data.cart.id as string;
  await setCartId(cartId);
  return cartId;
}

export async function getCart() {
  const cartId = await getCartId();
  if (!cartId) return null;
  const { data } = await client.get(`/store/carts/${cartId}`);
  return data.cart;
}

export async function addToCart(variantId: string, quantity = 1) {
  const cartId = await ensureCart();
  const { data } = await client.post(`/store/carts/${cartId}/line-items`, {
    variant_id: variantId,
    quantity,
  });
  return data.cart;
}

export async function updateCartItem(lineItemId: string, quantity: number) {
  const cartId = await getCartId();
  if (!cartId) throw new Error('No cart');
  const { data } = await client.post(
    `/store/carts/${cartId}/line-items/${lineItemId}`,
    { quantity },
  );
  return data.cart;
}

export async function removeCartItem(lineItemId: string) {
  const cartId = await getCartId();
  if (!cartId) throw new Error('No cart');
  const { data } = await client.delete(
    `/store/carts/${cartId}/line-items/${lineItemId}`,
  );
  return data.cart;
}

export async function transferCart(token: string) {
  const cartId = await getCartId();
  if (!cartId) return;
  await client
    .post(
      `/store/carts/${cartId}/customer`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    )
    .catch(() => {});
}

export async function clearCart() {
  await removeCartId();
}

export async function addShippingAddress(
  cartId: string,
  address: Record<string, unknown>,
) {
  const { data } = await client.post(`/store/carts/${cartId}`, {
    shipping_address: address,
  });
  return data.cart;
}

export async function listShippingOptions(cartId: string) {
  const { data } = await client.get(
    `/store/shipping-options?cart_id=${cartId}`,
  );
  return data.shipping_options as any[];
}

export async function addShippingMethod(cartId: string, optionId: string) {
  const { data } = await client.post(`/store/carts/${cartId}/shipping-methods`, {
    option_id: optionId,
  });
  return data.cart;
}

export async function initiatePaymentSession(
  cartId: string,
  providerId: string,
) {
  const { data } = await client.post(
    `/store/payment-collections`,
    { cart_id: cartId },
  );
  const collectionId = data.payment_collection.id;
  const session = await client.post(
    `/store/payment-collections/${collectionId}/payment-sessions`,
    { provider_id: providerId },
  );
  return session.data.payment_collection;
}

export async function completeCart(cartId: string) {
  const { data } = await client.post(`/store/carts/${cartId}/complete`);
  return data;
}
