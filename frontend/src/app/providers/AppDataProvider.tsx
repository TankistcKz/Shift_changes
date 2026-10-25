import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import type { ReactNode } from 'react';
import type { ExchangeRequestDraft } from '../../features/exchange-request/model/types';
import { delay, fetchAppData, setMockFailure } from '../../shared/api/mockApi';
import type { AppDataState } from './appDataReducer';
import { appDataReducer, initialAppDataState } from './appDataReducer';

interface AppDataContextValue extends AppDataState {
  simulateError: boolean;
  reload: () => Promise<void>;
  createRequest: (draft: ExchangeRequestDraft, requesterId: number) => Promise<void>;
  approveRequest: (id: number) => Promise<void>;
  declineRequest: (id: number) => Promise<void>;
  toggleSimulateError: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appDataReducer, initialAppDataState);
  const [simulateError, setSimulateError] = useState(false);

  const reload = useCallback(async () => {
    dispatch({ type: 'load/start' });
    try {
      const data = await fetchAppData();
      dispatch({ type: 'load/success', payload: data });
    } catch (error) {
      dispatch({
        type: 'load/error',
        payload: error instanceof Error ? error.message : 'Неизвестная ошибка',
      });
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createRequest = useCallback(
    async (draft: ExchangeRequestDraft, requesterId: number) => {
      await delay(450);
      dispatch({
        type: 'request/create',
        payload: { ...draft, requesterId },
      });
    },
    [],
  );

  const approveRequest = useCallback(async (id: number) => {
    dispatch({ type: 'request/pending', payload: { id, action: 'approve' } });
    try {
      await delay(550);
      dispatch({ type: 'request/approve', payload: { id } });
    } finally {
      dispatch({ type: 'request/pending', payload: null });
    }
  }, []);

  const declineRequest = useCallback(async (id: number) => {
    dispatch({ type: 'request/pending', payload: { id, action: 'decline' } });
    try {
      await delay(450);
      dispatch({ type: 'request/decline', payload: { id } });
    } finally {
      dispatch({ type: 'request/pending', payload: null });
    }
  }, []);

  const toggleSimulateError = useCallback(() => {
    const next = !simulateError;
    setSimulateError(next);
    setMockFailure(next);
    void reload();
  }, [simulateError, reload]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      ...state,
      simulateError,
      reload,
      createRequest,
      approveRequest,
      declineRequest,
      toggleSimulateError,
    }),
    [
      state,
      simulateError,
      reload,
      createRequest,
      approveRequest,
      declineRequest,
      toggleSimulateError,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData должен использоваться внутри AppDataProvider');
  }
  return context;
}
