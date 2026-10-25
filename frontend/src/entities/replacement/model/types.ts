export interface ReplacementRecord {
  id: number;
  shiftId: number;
  fromPersonId: number;
  toPersonId: number;
  date: string;
  approvedById: number;
  approvedAt: string;
}