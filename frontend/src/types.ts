export type PersonRole = 'senior' | 'guard';

export type RequestStatus = 'pending' | 'approved' | 'declined';

export interface Person {
  id: number;
  name: string;
  role: PersonRole;
}

export interface Shift {
  id: number;
  date: string;
  personId: number;
  start: string;
  end: string;
}

export interface ExchangeRequest {
  id: number;
  requesterId: number;
  shiftId: number;
  targetShiftId: number;
  reason: string;
  status: RequestStatus;
  createdAt: string;
}

export interface ReplacementRecord {
  id: number;
  shiftId: number;
  fromPersonId: number;
  toPersonId: number;
  date: string;
  approvedById: number;
  approvedAt: string;
}