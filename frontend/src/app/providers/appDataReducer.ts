import type { ExchangeRequest } from '../../entities/exchange-request/model/types';
import type { Person } from '../../entities/person/model/types';
import type { ReplacementRecord } from '../../entities/replacement/model/types';
import type { Shift } from '../../entities/shift/model/types';
import type { AppData } from '../../shared/api/appApi';

export interface PendingRequest {
  id: number;
  action: 'approve' | 'decline';
}

export interface AppDataState {
  persons: Person[];
  shifts: Shift[];
  requests: ExchangeRequest[];
  history: ReplacementRecord[];
  loading: boolean;
  error: string | null;
  pendingRequest: PendingRequest | null;
}

export type AppDataAction =
  | { type: 'load/start' }
  | { type: 'load/success'; payload: AppData }
  | { type: 'load/error'; payload: string }
  | { type: 'load/reset' }
  | { type: 'request/pending'; payload: PendingRequest | null };

export const initialAppDataState: AppDataState = {
  persons: [],
  shifts: [],
  requests: [],
  history: [],
  loading: true,
  error: null,
  pendingRequest: null,
};

export function appDataReducer(state: AppDataState, action: AppDataAction): AppDataState {
  switch (action.type) {
    case 'load/start':
      return { ...state, loading: true, error: null };
    case 'load/success':
      return {
        ...state,
        persons: action.payload.persons,
        shifts: action.payload.shifts,
        requests: action.payload.requests,
        history: action.payload.history,
        loading: false,
        error: null,
        pendingRequest: null,
      };
    case 'load/error':
      return { ...state, loading: false, error: action.payload };
    case 'load/reset':
      return {
        ...initialAppDataState,
        loading: false,
      };
    case 'request/pending':
      return { ...state, pendingRequest: action.payload };
    default:
      return state;
  }
}
