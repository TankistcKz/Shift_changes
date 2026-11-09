import type { AuthSession } from './types';

const STORAGE_KEY = 'shift-exchange.session';

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') return false;
  const session = value as Partial<AuthSession>;
  return (
    typeof session.accessToken === 'string' &&
    typeof session.refreshToken === 'string' &&
    Boolean(session.user) &&
    typeof session.user?.personId === 'number'
  );
}

export function getStoredSession(): AuthSession | null {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEY);
    if (!rawValue) return null;
    const parsed: unknown = JSON.parse(rawValue);
    return isAuthSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function setStoredSession(session: AuthSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // localStorage может быть недоступен (например, в приватном режиме).
    // В этом случае сессия продолжит работать до перезагрузки страницы.
  }
}

export function clearStoredSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // См. комментарий в setStoredSession.
  }
}
