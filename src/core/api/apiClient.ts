import axios from "axios";
import { handleError } from "../error/errors";

// Default to the same-origin proxy in next.config.ts (/api/v1 -> API_UPSTREAM_URL)
// so the browser never makes a cross-origin call and CORS cannot get in the way.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

export const TOKEN_KEY = "auth_token";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
    // Bypass ngrok browser-warning interstitial page
    "ngrok-skip-browser-warning": "true",
  },
});

// Attach JWT from localStorage on every request
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Listeners notified when the session is no longer valid (expired token or
// the account lost its admin role). The auth store subscribes to this.
const sessionExpiredListeners = new Set<() => void>();
export function onSessionExpired(fn: () => void) {
  sessionExpiredListeners.add(fn);
  return () => sessionExpiredListeners.delete(fn);
}

// Map HTTP errors to domain errors. The Go API sends { "error": "..." }.
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status: number = error.response?.status ?? 0;
    const body = error.response?.data;
    const message: string = body?.error ?? body?.message ?? error.message;
    const isLogin = String(error.config?.url ?? "").includes("/auth/login");

    if ((status === 401 || status === 403) && !isLogin && typeof window !== "undefined") {
      sessionExpiredListeners.forEach((fn) => fn());
    }

    return Promise.reject(handleError(status, message));
  },
);
