import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { ExchangeRequestDraft } from '../../features/exchange-request/model/types';
import {
  approveExchangeRequest,
  createExchangeRequest,
  createPerson,
  createShift,
  declineExchangeRequest,
  deleteExchangeRequest,
  deletePerson,
  deleteShift,
  fetchAppData,
  updatePerson,
  updateShift,
} from '../../shared/api/appApi';
import type { PersonInput, ShiftInput } from '../../shared/api/appApi';
import {
  appDataReducer,
  initialAppDataState,
} from './appDataReducer';
import type { AppDataState, PendingRequest } from './appDataReducer';
import { useSession } from './SessionProvider';

interface AppDataContextValue {
  persons: AppDataState['persons'];
  shifts: AppDataState['shifts'];
  requests: AppDataState['requests'];
  history: AppDataState['history'];
  loading: boolean;
  error: string | null;
  pendingRequest: PendingRequest | null;
  reload: () => Promise<void>;
  createRequest: (draft: ExchangeRequestDraft) => Promise<void>;
  approveRequest: (id: number) => Promise<void>;
  declineRequest: (id: number) => Promise<void>;
  deleteRequest: (id: number) => Promise<void>;
  createPerson: (input: PersonInput) => Promise<void>;
  updatePerson: (id: number, input: PersonInput) => Promise<void>;
  deletePerson: (id: number) => Promise<void>;
  createShift: (input: ShiftInput) => Promise<void>;
  updateShift: (id: number, input: ShiftInput) => Promise<void>;
  deleteShift: (id: number) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Неизвестная ошибка';
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { currentUserId } = useSession();
  const [state, dispatch] = useReducer(appDataReducer, initialAppDataState);

  const load = useCallback(async (showLoading: boolean) => {
    if (showLoading) dispatch({ type: 'load/start' });
    try {
      const data = await fetchAppData();
      dispatch({ type: 'load/success', payload: data });
    } catch (error) {
      dispatch({ type: 'load/error', payload: toErrorMessage(error) });
    }
  }, []);

  useEffect(() => {
    if (currentUserId === null) {
      dispatch({ type: 'load/reset' });
      return;
    }
    void load(true);
  }, [currentUserId, load]);

  const refresh = useCallback(async () => {
    const data = await fetchAppData();
    dispatch({ type: 'load/success', payload: data });
  }, []);

  const reload = useCallback(async () => {
    await load(true);
  }, [load]);

  const createRequest = useCallback(
    async (draft: ExchangeRequestDraft) => {
      await createExchangeRequest(draft);
      await refresh();
    },
    [refresh],
  );

  const approveRequest = useCallback(
    async (id: number) => {
      dispatch({ type: 'request/pending', payload: { id, action: 'approve' } });
      try {
        await approveExchangeRequest(id);
        await refresh();
      } finally {
        dispatch({ type: 'request/pending', payload: null });
      }
    },
    [refresh],
  );

  const declineRequest = useCallback(
    async (id: number) => {
      dispatch({ type: 'request/pending', payload: { id, action: 'decline' } });
      try {
        await declineExchangeRequest(id);
        await refresh();
      } finally {
        dispatch({ type: 'request/pending', payload: null });
      }
    },
    [refresh],
  );

  const deleteRequest = useCallback(
    async (id: number) => {
      await deleteExchangeRequest(id);
      await refresh();
    },
    [refresh],
  );

  const createPersonAction = useCallback(
    async (input: PersonInput) => {
      await createPerson(input);
      await refresh();
    },
    [refresh],
  );

  const updatePersonAction = useCallback(
    async (id: number, input: PersonInput) => {
      await updatePerson(id, input);
      await refresh();
    },
    [refresh],
  );

  const deletePersonAction = useCallback(
    async (id: number) => {
      await deletePerson(id);
      await refresh();
    },
    [refresh],
  );

  const createShiftAction = useCallback(
    async (input: ShiftInput) => {
      await createShift(input);
      await refresh();
    },
    [refresh],
  );

  const updateShiftAction = useCallback(
    async (id: number, input: ShiftInput) => {
      await updateShift(id, input);
      await refresh();
    },
    [refresh],
  );

  const deleteShiftAction = useCallback(
    async (id: number) => {
      await deleteShift(id);
      await refresh();
    },
    [refresh],
  );

  const value = useMemo<AppDataContextValue>(
    () => ({
      persons: state.persons,
      shifts: state.shifts,
      requests: state.requests,
      history: state.history,
      loading: state.loading,
      error: state.error,
      pendingRequest: state.pendingRequest,
      reload,
      createRequest,
      approveRequest,
      declineRequest,
      deleteRequest,
      createPerson: createPersonAction,
      updatePerson: updatePersonAction,
      deletePerson: deletePersonAction,
      createShift: createShiftAction,
      updateShift: updateShiftAction,
      deleteShift: deleteShiftAction,
    }),
    [
      state,
      reload,
      createRequest,
      approveRequest,
      declineRequest,
      deleteRequest,
      createPersonAction,
      updatePersonAction,
      deletePersonAction,
      createShiftAction,
      updateShiftAction,
      deleteShiftAction,
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
