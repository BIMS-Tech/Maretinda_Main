import axios from 'axios';

import { getToken } from './storage';

const BACKEND_URL =
  process.env.EXPO_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
const PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
  'pk_3ad019daf80f5cf6368abbb8bcae8f5694b15a8480728313ba87fd2e6eb02036';

export const client = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-publishable-api-key': PUBLISHABLE_KEY,
  },
});

// Attach JWT token on every request
client.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper: extract error message
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message || err.message || 'Something went wrong';
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}
