import type { Shift } from './types';

export function findShift(shifts: Shift[], id: number): Shift | undefined {
  return shifts.find((shift) => shift.id === id);
}