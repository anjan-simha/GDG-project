import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// In production (Vercel) both services share the same domain — use relative URLs.
// In local dev without the env var set, the Vite proxy forwards to localhost:8000.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — log in dev
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (import.meta.env.DEV) {
    console.debug(`[GridSense API] ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

// Response interceptor — normalize errors
api.interceptors.response.use(
  (res: AxiosResponse) => res,
  (err: unknown) => {
    const e = err as { response?: { data?: { detail?: string } }; message?: string };
    const msg = e.response?.data?.detail ?? e.message ?? 'Unknown API error';
    console.error(`[GridSense API Error]`, msg);
    return Promise.reject(new Error(msg));
  }
);
