import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

const STORAGE_KEY = 'shift-exchange.currentUserId';

interface SessionContextValue {
  currentUserId: number | null;
  login: (personId: number) => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function readStoredUserId(): number | null {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEY);
    if (!rawValue) return null;
    const personId = Number(rawValue);
    return Number.isInteger(personId) && personId > 0 ? personId : null;
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [currentUserId, setCurrentUserId] = useState<number | null>(readStoredUserId);

  const login = useCallback((personId: number) => {
    setCurrentUserId(personId);
    try {
      localStorage.setItem(STORAGE_KEY, String(personId));
    } catch {
      // localStorage может быть недоступен (например, в приватном режиме).
      // В этом случае сессия продолжит работать до перезагрузки страницы.
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUserId(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // См. комментарий в login.
    }
  }, []);

  const value = useMemo(
    () => ({ currentUserId, login, logout }),
    [currentUserId, login, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession должен использоваться внутри SessionProvider');
  }
  return context;
}
