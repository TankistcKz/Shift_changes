export type RequestStatus = 'pending' | 'approved' | 'declined';

export interface ExchangeRequest {
  id: number;
  requesterId: number;
  shiftId: number;
  targetShiftId: number;
  reason: string;
  status: RequestStatus;
  createdAt: string;
}