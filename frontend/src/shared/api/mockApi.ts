import type { ExchangeRequest } from '../../entities/exchange-request/model/types';
import type { Person } from '../../entities/person/model/types';
import type { ReplacementRecord } from '../../entities/replacement/model/types';
import type { Shift } from '../../entities/shift/model/types';
import { mockHistory, mockPersons, mockRequests, mockShifts } from './mockData';

export interface AppData {
  persons: Person[];
  shifts: Shift[];
  requests: ExchangeRequest[];
  history: ReplacementRecord[];
}

const NETWORK_DELAY = 650;

let failureEnabled = false;

export function setMockFailure(value: boolean): void {
  failureEnabled = value;
}

export function delay(ms = NETWORK_DELAY): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function fetchAppData(): Promise<AppData> {
  await delay();
  if (failureEnabled) {
    throw new Error('Не удалось получить данные с сервера. Проверьте соединение и попробуйте ещё раз.');
  }
  return structuredClone({
    persons: mockPersons,
    shifts: mockShifts,
    requests: mockRequests,
    history: mockHistory,
  });
}
