import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

export type LimeAxiosRequestConfig = AxiosRequestConfig & {
  skipGlobalError?: boolean;
};

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipGlobalError?: boolean;
  }
}

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  timeout: 20000,
});

let authTokenGetter: (() => Promise<string | null>) | null = null;

// Clerk's token getter is registered asynchronously (see ApiAuthProvider), after its own
// `isLoaded` effect runs. Page-level effects that fetch data on mount can and do fire before
// that registration completes, which used to send requests with no Authorization header and a
// silent 401. Every request now waits for the first registration (auth state settled, whether
// signed in or not) before deciding whether to attach a token, instead of racing it.
let resolveAuthReady: () => void;
const authReadyPromise = new Promise<void>((resolve) => {
  resolveAuthReady = resolve;
});
let authReady = false;

export function registerAuthTokenGetter(getter: (() => Promise<string | null>) | null) {
  authTokenGetter = getter;
  if (!authReady) {
    authReady = true;
    resolveAuthReady();
  }
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  await authReadyPromise;
  if (authTokenGetter) {
    const token = await authTokenGetter();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
  }
  return config;
});

export type ApiGlobalError = {
  message: string;
  status?: number;
  at: number;
};

let globalErrorHandler: ((err: ApiGlobalError | null) => void) | null = null;

export function setApiGlobalErrorHandler(handler: (err: ApiGlobalError | null) => void) {
  globalErrorHandler = handler;
}

api.interceptors.response.use(
  (response) => {
    globalErrorHandler?.(null);
    return response;
  },
  (error) => {
    if (axios.isAxiosError(error) && error.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }
    if (axios.isAxiosError(error) && error.config?.skipGlobalError) {
      return Promise.reject(error);
    }
    const message =
      error.response?.data?.message ??
      (error.code === 'ERR_NETWORK'
        ? 'API unreachable — run npm run dev:api'
        : error.message);
    globalErrorHandler?.({
      message: Array.isArray(message) ? message.join(', ') : String(message),
      status: error.response?.status,
      at: Date.now(),
    });
    return Promise.reject(error);
  },
);

export function setApiAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export default api;
