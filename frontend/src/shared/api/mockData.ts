import type { ExchangeRequest } from '../../entities/exchange-request/model/types';
import type { Person } from '../../entities/person/model/types';
import type { ReplacementRecord } from '../../entities/replacement/model/types';
import type { Shift } from '../../entities/shift/model/types';
import { daysInMonth, toIsoDate } from '../lib/date';

export const mockPersons: Person[] = [
  { id: 1, name: 'Александр Волков', role: 'senior' },
  { id: 2, name: 'Мария Соколова', role: 'guard' },
  { id: 3, name: 'Дмитрий Козлов', role: 'guard' },
  { id: 4, name: 'Елена Морозова', role: 'guard' },
  { id: 5, name: 'Иван Петров', role: 'guard' },
  { id: 6, name: 'Ольга Белова', role: 'guard' },
];

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth();
const guards = mockPersons.filter((person) => person.role === 'guard');

const baseShifts: Shift[] = Array.from(
  { length: daysInMonth(currentYear, currentMonth) },
  (_, index) => {
    const day = index + 1;
    return {
      id: day,
      date: toIsoDate(currentYear, currentMonth, day),
      personId: guards[index % guards.length].id,
      start: '09:00',
      end: '21:00',
    };
  },
);

function swapOwners(shifts: Shift[], firstId: number, secondId: number): Shift[] {
  const first = shifts.find((shift) => shift.id === firstId);
  const second = shifts.find((shift) => shift.id === secondId);
  if (!first || !second) return shifts;

  return shifts.map((shift) => {
    if (shift.id === first.id) return { ...shift, personId: second.personId };
    if (shift.id === second.id) return { ...shift, personId: first.personId };
    return shift;
  });
}

// Запрос №2 уже подтверждён в демо-данных, поэтому владельцы смен 9 и 11 поменяны.
export const mockShifts = swapOwners(baseShifts, 9, 11);

function shiftDate(id: number): string {
  return (
    mockShifts.find((shift) => shift.id === id)?.date ??
    toIsoDate(currentYear, currentMonth, id)
  );
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export const mockRequests: ExchangeRequest[] = [
  {
    id: 1,
    requesterId: 4,
    shiftId: 3,
    targetShiftId: 12,
    reason: 'Срочные дела 3 числа, прошу обменяться сменой.',
    status: 'pending',
    createdAt: daysAgo(2),
  },
  {
    id: 2,
    requesterId: 5,
    shiftId: 9,
    targetShiftId: 11,
    reason: 'Хочу поменяться сменой с Марией на соседнюю дату.',
    status: 'approved',
    createdAt: daysAgo(9),
  },
  {
    id: 3,
    requesterId: 6,
    shiftId: 15,
    targetShiftId: 18,
    reason: 'Нужен отгул, готов взять дежурство 18 числа.',
    status: 'pending',
    createdAt: daysAgo(1),
  },
  {
    id: 4,
    requesterId: 2,
    shiftId: 6,
    targetShiftId: 17,
    reason: 'Просьба об обмене на более удобное время.',
    status: 'declined',
    createdAt: daysAgo(14),
  },
];

const previousMonth = new Date(currentYear, currentMonth - 1, 1);
const previousYear = previousMonth.getFullYear();
const previousMonthIndex = previousMonth.getMonth();

export const mockHistory: ReplacementRecord[] = [
  {
    id: 4,
    shiftId: 9,
    fromPersonId: 5,
    toPersonId: 2,
    date: shiftDate(9),
    approvedById: 1,
    approvedAt: daysAgo(9),
  },
  {
    id: 5,
    shiftId: 11,
    fromPersonId: 2,
    toPersonId: 5,
    date: shiftDate(11),
    approvedById: 1,
    approvedAt: daysAgo(9),
  },
  {
    id: 1,
    shiftId: 2,
    fromPersonId: 3,
    toPersonId: 6,
    date: toIsoDate(previousYear, previousMonthIndex, 2),
    approvedById: 1,
    approvedAt: daysAgo(32),
  },
  {
    id: 2,
    shiftId: 7,
    fromPersonId: 3,
    toPersonId: 4,
    date: toIsoDate(previousYear, previousMonthIndex, 7),
    approvedById: 1,
    approvedAt: daysAgo(25),
  },
  {
    id: 3,
    shiftId: 16,
    fromPersonId: 2,
    toPersonId: 5,
    date: toIsoDate(previousYear, previousMonthIndex, 16),
    approvedById: 1,
    approvedAt: daysAgo(18),
  },
];
