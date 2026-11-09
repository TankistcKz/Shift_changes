import type { ExchangeRequest } from '../../entities/exchange-request/model/types';
import type { Person, PersonRole } from '../../entities/person/model/types';
import type { ReplacementRecord } from '../../entities/replacement/model/types';
import type { Shift } from '../../entities/shift/model/types';
import { apiRequest } from './http';
import {
  mapExchangeRequest,
  mapPerson,
  mapReplacementRecord,
  mapShift,
} from './mappers';
import type {
  ExchangeRequestDto,
  PersonDto,
  ReplacementRecordDto,
  ShiftDto,
} from './types';

export interface AppData {
  persons: Person[];
  shifts: Shift[];
  requests: ExchangeRequest[];
  history: ReplacementRecord[];
}

export interface ShiftInput {
  date: string;
  start: string;
  end: string;
  personId: number;
}

export interface PersonInput {
  name: string;
  role: PersonRole;
}

export async function fetchAppData(): Promise<AppData> {
  const [persons, shifts, requests, history] = await Promise.all([
    apiRequest<PersonDto[]>('/api/persons'),
    apiRequest<ShiftDto[]>('/api/shifts'),
    apiRequest<ExchangeRequestDto[]>('/api/requests'),
    apiRequest<ReplacementRecordDto[]>('/api/history'),
  ]);

  return {
    persons: persons.map(mapPerson),
    shifts: shifts.map(mapShift),
    requests: requests.map(mapExchangeRequest),
    history: history.map(mapReplacementRecord),
  };
}

export async function createExchangeRequest(input: {
  shiftId: number;
  targetShiftId: number;
  reason: string;
}): Promise<ExchangeRequest> {
  const dto = await apiRequest<ExchangeRequestDto>('/api/requests', {
    method: 'POST',
    body: {
      shift_id: input.shiftId,
      target_shift_id: input.targetShiftId,
      reason: input.reason,
    },
  });
  return mapExchangeRequest(dto);
}

export async function approveExchangeRequest(id: number): Promise<ExchangeRequest> {
  const dto = await apiRequest<ExchangeRequestDto>(`/api/requests/${id}/approve`, {
    method: 'POST',
  });
  return mapExchangeRequest(dto);
}

export async function declineExchangeRequest(id: number): Promise<ExchangeRequest> {
  const dto = await apiRequest<ExchangeRequestDto>(`/api/requests/${id}/decline`, {
    method: 'POST',
  });
  return mapExchangeRequest(dto);
}

export async function deleteExchangeRequest(id: number): Promise<void> {
  await apiRequest<void>(`/api/requests/${id}`, { method: 'DELETE' });
}

export async function createPerson(input: PersonInput): Promise<Person> {
  const dto = await apiRequest<PersonDto>('/api/persons', {
    method: 'POST',
    body: input,
  });
  return mapPerson(dto);
}

export async function updatePerson(id: number, input: PersonInput): Promise<Person> {
  const dto = await apiRequest<PersonDto>(`/api/persons/${id}`, {
    method: 'PATCH',
    body: input,
  });
  return mapPerson(dto);
}

export async function deletePerson(id: number): Promise<void> {
  await apiRequest<void>(`/api/persons/${id}`, { method: 'DELETE' });
}

export async function createShift(input: ShiftInput): Promise<Shift> {
  const dto = await apiRequest<ShiftDto>('/api/shifts', {
    method: 'POST',
    body: {
      date: input.date,
      start_time: input.start,
      end_time: input.end,
      person_id: input.personId,
    },
  });
  return mapShift(dto);
}

export async function updateShift(id: number, input: ShiftInput): Promise<Shift> {
  const dto = await apiRequest<ShiftDto>(`/api/shifts/${id}`, {
    method: 'PATCH',
    body: {
      date: input.date,
      start_time: input.start,
      end_time: input.end,
      person_id: input.personId,
    },
  });
  return mapShift(dto);
}

export async function deleteShift(id: number): Promise<void> {
  await apiRequest<void>(`/api/shifts/${id}`, { method: 'DELETE' });
}
