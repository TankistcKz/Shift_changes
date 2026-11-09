import { mapAuthSession } from './mappers';
import {
  clearStoredSession,
  getStoredSession,
  setStoredSession,
} from './tokenStorage';
import type { TokenResponseDto } from './types';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/+$/, '');

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let unauthorizedHandler: (() => void) | null = null;
let refreshPromise: Promise<boolean> | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

function formatDetail(detail: unknown): string | null {
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (item && typeof item === 'object' && 'msg' in item) {
          return String((item as { msg: unknown }).msg);
        }
        return typeof item === 'string' ? item : null;
      })
      .filter((item): item is string => Boolean(item));
    return messages.length > 0 ? messages.join('; ') : null;
  }
  if (detail && typeof detail === 'object' && 'msg' in detail) {
    return String((detail as { msg: unknown }).msg);
  }
  return null;
}

function fallbackMessage(status: number): string {
  if (status === 401) return 'Требуется авторизация. Войдите снова.';
  if (status === 403) return 'Недостаточно прав для этого действия.';
  if (status === 404) return 'Запись не найдена.';
  if (status === 409) return 'Конфликт данных. Обновите страницу и попробуйте снова.';
  if (status === 422) return 'Проверьте правильность заполнения полей.';
  if (status >= 500) return 'Сервер не смог обработать запрос. Попробуйте позже.';
  return 'Не удалось выполнить запрос.';
}

async function refreshAccessToken(): Promise<boolean> {
  const session = getStoredSession();
  if (!session) return false;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: session.refreshToken }),
        });

        if (!response.ok) {
          clearStoredSession();
          return false;
        }

        const data = (await response.json()) as TokenResponseDto;
        setStoredSession(mapAuthSession(data));
        return true;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  bodyFactory?: () => unknown;
  auth?: boolean;
  retryOnUnauthorized?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    bodyFactory,
    auth = true,
    retryOnUnauthorized = true,
  } = options;

  const requestBody = bodyFactory ? bodyFactory() : body;
  const session = getStoredSession();
  const headers: Record<string, string> = {};
  if (requestBody !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && session) headers.Authorization = `Bearer ${session.accessToken}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: requestBody === undefined ? undefined : JSON.stringify(requestBody),
    });
  } catch {
    throw new ApiError(
      0,
      'Не удалось связаться с сервером. Убедитесь, что backend запущен и доступен.',
    );
  }

  if (response.status === 401 && auth && retryOnUnauthorized) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, retryOnUnauthorized: false });
    }
    unauthorizedHandler?.();
    throw new ApiError(401, 'Сессия истекла. Войдите снова.');
  }

  if (response.status === 401 && auth && !retryOnUnauthorized) {
    clearStoredSession();
    unauthorizedHandler?.();
  }

  if (!response.ok) {
    let detail: unknown = null;
    try {
      const payload = (await response.json()) as { detail?: unknown };
      detail = payload.detail;
    } catch {
      // Тело ответа может быть пустым или не JSON.
    }
    throw new ApiError(response.status, formatDetail(detail) ?? fallbackMessage(response.status));
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
