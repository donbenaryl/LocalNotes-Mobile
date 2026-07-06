import axios from 'axios';
import type {
  AxiosInstance,
  AxiosResponse,
  CreateAxiosDefaults,
  InternalAxiosRequestConfig,
} from 'axios';
import { router } from 'expo-router';
import { getApiBaseUrl } from './environment.config';
import { useAuthStore } from '../stores/useAuthStore';

type HttpServiceConstructorParams = CreateAxiosDefaults<unknown>;

type HttpServiceParams<DTO, DQO> = {
  path: string;
  method: 'post' | 'get' | 'delete' | 'put' | 'patch';
  body?: DTO;
  query?: DQO;
  options?: {
    handleError?: boolean;
    throwError?: boolean;
  };
};

export type HttpServiceResolverError = {
  message: string;
  statusCode: number;
};

export type HttpServiceResolverData<T = null> = {
  data: T;
  message: string;
  pagination?: {
    total: number;
    next: number;
    page: number;
  };
};

export type HttpServiceResolverDTO<T> = Promise<{
  data: HttpServiceResolverData<T> | null;
  error: HttpServiceResolverError | null;
}>;

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

type RefreshQueueEntry = (token: string) => void;

let isRefreshing = false;
let refreshQueue: RefreshQueueEntry[] = [];

function drainQueue(token: string): void {
  refreshQueue.forEach((resolve) => resolve(token));
  refreshQueue = [];
}

async function forceLogout(): Promise<void> {
  await useAuthStore.getState().clearAuth();
  router.replace('/sign-in');
}

async function attemptTokenRefresh(): Promise<string> {
  const storedRefresh = useAuthStore.getState().refreshToken;
  if (!storedRefresh) throw new Error('No refresh token available');

  const { data } = await axios.post<{ data: { access: string } }>(
    `${getApiBaseUrl()}/accounts/token/refresh`,
    { refresh_token: storedRefresh },
  );

  const newAccessToken = data.data.access;
  await useAuthStore.getState().setAccessToken(newAccessToken);
  return newAccessToken;
}

function attachUnauthorizedInterceptor(instance: AxiosInstance): void {
  instance.interceptors.response.use(
    (config) => config,
    async (error: unknown) => {
      if (!axios.isAxiosError(error) || !error.config) {
        return Promise.reject(error);
      }

      const config = error.config as RetryableRequestConfig;

      if (error.response?.status !== 401 || config._retry) {
        return Promise.reject(error);
      }

      // If a refresh is already in flight, queue this request to retry once it resolves.
      if (isRefreshing) {
        return new Promise<AxiosResponse>((resolve, reject) => {
          refreshQueue.push((token) => {
            config._retry = true;
            config.headers['Authorization'] = `Bearer ${token}`;
            resolve(instance(config));
          });
          // Attach a reject path so the queue entry doesn't silently hang.
          setTimeout(() => reject(error), 10_000);
        });
      }

      config._retry = true;
      isRefreshing = true;

      try {
        const newToken = await attemptTokenRefresh();
        drainQueue(newToken);
        config.headers['Authorization'] = `Bearer ${newToken}`;
        return instance(config);
      } catch {
        refreshQueue = [];
        await forceLogout();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    },
  );
}

export class HttpService {
  protected axiosInstance: () => AxiosInstance;

  constructor(
    params: () => HttpServiceConstructorParams,
    setupInterceptors?: (instance: AxiosInstance) => void,
  ) {
    this.axiosInstance = () => {
      const instance = axios.create(params());
      setupInterceptors?.(instance);
      attachUnauthorizedInterceptor(instance);
      return instance;
    };
  }

  private async resolver<T>(
    fn: Promise<AxiosResponse>,
  ): HttpServiceResolverDTO<T> {
    let data: HttpServiceResolverData<T> | null = null;
    let error: null | HttpServiceResolverError = null;

    try {
      const { data: apiResponse } = await fn;
      data = apiResponse;
    } catch (_error: unknown) {
      if (axios.isAxiosError(_error)) {
        error = _error.response?.data ?? {
          message: _error.message,
          statusCode: 400,
        };
      } else {
        error = { message: 'Unknown error', statusCode: 400 };
      }
    }
    return { data, error };
  }

  protected async SendRequest<
    DAO,
    DTO = unknown,
    DQO = unknown,
  >(params: HttpServiceParams<DTO, DQO>) {
    type AxiosMethod = (
      url: string,
      dataOrConfig?: unknown,
      config?: unknown,
    ) => Promise<AxiosResponse>;
    const method = this.axiosInstance()[params.method] as AxiosMethod;

    const isDelete = params.method === 'delete';
    const requestArgs: [string, unknown?, unknown?] = isDelete
      ? [params.path, { data: params.body, params: params.query ?? {} }]
      : [
          params.path,
          params.body ? params.body : { params: params.query ?? {} },
          params.body && params.query ? { params: params.query } : undefined,
        ];

    const response = await this.resolver<DAO>(method(...requestArgs));

    if (response.error && params.options?.throwError) {
      throw response.error;
    }

    return response;
  }
}

class AppHttpService extends HttpService {
  constructor(params: HttpServiceConstructorParams) {
    super(
      () => ({
        ...params,
        baseURL: `${getApiBaseUrl()}${params.baseURL ?? ''}`,
        headers: {
          ...params.headers,
        },
      }),
      (instance) => {
        instance.interceptors.request.use((config) => {
          const token = useAuthStore.getState().token;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        });
      },
    );
  }
}

class PublicHttpService extends HttpService {
  constructor(params: HttpServiceConstructorParams) {
    super(() => ({
      ...params,
      baseURL: `${getApiBaseUrl()}${params.baseURL ?? ''}`,
      headers: {
        ...params.headers,
      },
    }));
  }
}

export { PublicHttpService, AppHttpService };
