import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'maretinda_auth_token';
const CART_ID_KEY = 'maretinda_cart_id';
const REGION_ID_KEY = 'maretinda_region_id';

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getCartId(): Promise<string | null> {
  return SecureStore.getItemAsync(CART_ID_KEY);
}

export async function setCartId(cartId: string): Promise<void> {
  await SecureStore.setItemAsync(CART_ID_KEY, cartId);
}

export async function removeCartId(): Promise<void> {
  await SecureStore.deleteItemAsync(CART_ID_KEY);
}

export async function getRegionId(): Promise<string | null> {
  return SecureStore.getItemAsync(REGION_ID_KEY);
}

export async function setRegionId(regionId: string): Promise<void> {
  await SecureStore.setItemAsync(REGION_ID_KEY, regionId);
}
