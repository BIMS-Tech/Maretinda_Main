import { client } from './client';

export async function listOrders(limit = 10, offset = 0) {
  const { data } = await client.get('/store/orders', {
    params: { limit, offset },
  });
  return data as { orders: any[]; count: number };
}

export async function getOrder(id: string) {
  const { data } = await client.get(`/store/orders/${id}`);
  return data.order;
}

export async function createReturnRequest(body: {
  order_id: string;
  items: { id: string; quantity: number; reason_id?: string; note?: string }[];
  note?: string;
}) {
  const { data } = await client.post('/store/return-request', body);
  return data;
}
