import type { ExchangeRequest } from '../../entities/exchange-request/model/types';
import type { Person } from '../../entities/person/model/types';
import type { ReplacementRecord } from '../../entities/replacement/model/types';
import type { Shift } from '../../entities/shift/model/types';
import type { ExchangeRequestDraft } from '../../features/exchange-request/model/types';
import type { AppData } from '../../shared/api/mockApi';

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
  | { type: 'request/create'; payload: ExchangeRequestDraft & { requesterId: number } }
  | { type: 'request/pending'; payload: PendingRequest | null }
  | { type: 'request/approve'; payload: { id: number } }
  | { type: 'request/decline'; payload: { id: number } };

export const initialAppDataState: AppDataState = {
  persons: [],
  shifts: [],
  requests: [],
  history: [],
  loading: true,
  error: null,
  pendingRequest: null,
};

function nextId(items: Array<{ id: number }>): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function addRequest(
  state: AppDataState,
  payload: ExchangeRequestDraft & { requesterId: number },
): AppDataState {
  const request: ExchangeRequest = {
    id: nextId(state.requests),
    requesterId: payload.requesterId,
    shiftId: payload.shiftId,
    targetShiftId: payload.targetShiftId,
    reason: payload.reason,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  return { ...state, requests: [request, ...state.requests] };
}

function approveRequest(state: AppDataState, id: number): AppDataState {
  const request = state.requests.find((item) => item.id === id);
  if (!request || request.status !== 'pending') return state;

  const shift = state.shifts.find((item) => item.id === request.shiftId);
  const targetShift = state.shifts.find((item) => item.id === request.targetShiftId);
  const approver = state.persons.find((person) => person.role === 'senior');

  if (!shift || !targetShift || !approver) return state;

  const approvedAt = new Date().toISOString();
  const historyStartId = nextId(state.history);
  const records: ReplacementRecord[] = [
    {
      id: historyStartId,
      shiftId: shift.id,
      fromPersonId: shift.personId,
      toPersonId: targetShift.personId,
      date: shift.date,
      approvedById: approver.id,
      approvedAt,
    },
    {
      id: historyStartId + 1,
      shiftId: targetShift.id,
      fromPersonId: targetShift.personId,
      toPersonId: shift.personId,
      date: targetShift.date,
      approvedById: approver.id,
      approvedAt,
    },
  ];

  return {
    ...state,
    shifts: state.shifts.map((item) => {
      if (item.id === shift.id) return { ...item, personId: targetShift.personId };
      if (item.id === targetShift.id) return { ...item, personId: shift.personId };
      return item;
    }),
    requests: state.requests.map((item) =>
      item.id === id ? { ...item, status: 'approved' as const } : item,
    ),
    history: [...records, ...state.history],
    pendingRequest: null,
  };
}

function declineRequest(state: AppDataState, id: number): AppDataState {
  const request = state.requests.find((item) => item.id === id);
  if (!request || request.status !== 'pending') return state;

  return {
    ...state,
    requests: state.requests.map((item) =>
      item.id === id ? { ...item, status: 'declined' as const } : item,
    ),
    pendingRequest: null,
  };
}

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
    case 'request/create':
      return addRequest(state, action.payload);
    case 'request/pending':
      return { ...state, pendingRequest: action.payload };
    case 'request/approve':
      return approveRequest(state, action.payload.id);
    case 'request/decline':
      return declineRequest(state, action.payload.id);
    default:
      return state;
  }
}
