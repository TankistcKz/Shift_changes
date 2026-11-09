import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  authenticate,
  logout as apiLogout,
  register as apiRegister,
} from '../../features/auth/api/authApi';
import type { RegisterInput } from '../../features/auth/api/authApi';
import { setUnauthorizedHandler } from '../../shared/api/http';
import {
  clearStoredSession,
  getStoredSession,
  setStoredSession,
} from '../../shared/api/tokenStorage';
import type { AuthSession, AuthUser } from '../../shared/api/types';

interface SessionContextValue {
  currentUserId: number | null;
  currentUser: AuthUser | null;
  login: (login: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(getStoredSession);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearStoredSession();
      setSession(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (loginValue: string, password: string) => {
    const nextSession = await authenticate(loginValue, password);
    setStoredSession(nextSession);
    setSession(nextSession);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const nextSession = await apiRegister(input);
    setStoredSession(nextSession);
    setSession(nextSession);
  }, []);

  const logout = useCallback(async () => {
    const currentSession = getStoredSession();
    if (currentSession) {
      try {
        await apiLogout(currentSession.refreshToken);
      } catch {
        // Даже если backend недоступен, локальную сессию нужно завершить.
      }
    }
    clearStoredSession();
    setSession(null);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      currentUserId: session?.user.personId ?? null,
      currentUser: session?.user ?? null,
      login,
      register,
      logout,
    }),
    [session, login, register, logout],
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
