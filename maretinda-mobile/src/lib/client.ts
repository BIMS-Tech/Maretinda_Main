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
  // A call that brings its own (a sign-in being finished) keeps it
  if (config.headers.Authorization) return config;
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const statusOf = (err: unknown): number | undefined =>
  axios.isAxiosError(err) ? err.response?.status : undefined;

/** What to tell someone when a call fails. */
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "We can't reach Maretinda right now. Check your connection and try again.";
    if (err.response.status === 429) return 'That was a lot of tries. Please wait a minute and try again.';
    return err.response.data?.message || 'Something went wrong. Please try again.';
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}
