import type {
  ExchangeRequest,
  Person,
  ReplacementRecord,
  Shift,
} from '../types';

export const currentUserId = 5;

export const persons: Person[] = [
  { id: 1, name: 'Александр Волков', role: 'senior' },
  { id: 2, name: 'Мария Соколова', role: 'guard' },
  { id: 3, name: 'Дмитрий Козлов', role: 'guard' },
  { id: 4, name: 'Елена Морозова', role: 'guard' },
  { id: 5, name: 'Иван Петров', role: 'guard' },
  { id: 6, name: 'Ольга Белова', role: 'guard' },
];

function buildShifts(): Shift[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const guards = persons.filter((person) => person.role === 'guard');
  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return {
      id: day,
      date,
      personId: guards[index % guards.length].id,
      start: '09:00',
      end: '21:00',
    };
  });
}

export const shifts: Shift[] = buildShifts();

export const exchangeRequests: ExchangeRequest[] = [
  {
    id: 1,
    requesterId: 4,
    shiftId: 3,
    targetShiftId: 12,
    reason: 'Срочные дела 3 числа, прошу обменяться сменой.',
    status: 'pending',
    createdAt: '2026-09-15T09:40:00',
  },
  {
    id: 2,
    requesterId: 5,
    shiftId: 9,
    targetShiftId: 11,
    reason: 'Хочу поменяться сменой с Марией на соседнюю дату.',
    status: 'approved',
    createdAt: '2026-09-12T18:20:00',
  },
  {
    id: 3,
    requesterId: 6,
    shiftId: 15,
    targetShiftId: 18,
    reason: 'Нужен отгул, готов взять дежурство 18 числа.',
    status: 'pending',
    createdAt: '2026-09-18T12:05:00',
  },
  {
    id: 4,
    requesterId: 2,
    shiftId: 6,
    targetShiftId: 17,
    reason: 'Просьба об обмене на более удобное время.',
    status: 'declined',
    createdAt: '2026-09-08T20:15:00',
  },
];

export const replacementHistory: ReplacementRecord[] = [
  {
    id: 1,
    shiftId: 2,
    fromPersonId: 3,
    toPersonId: 6,
    date: '2026-09-02',
    approvedById: 1,
    approvedAt: '2026-08-27T11:30:00',
  },
  {
    id: 2,
    shiftId: 7,
    fromPersonId: 3,
    toPersonId: 4,
    date: '2026-09-07',
    approvedById: 1,
    approvedAt: '2026-09-01T16:45:00',
  },
  {
    id: 3,
    shiftId: 16,
    fromPersonId: 2,
    toPersonId: 5,
    date: '2026-09-16',
    approvedById: 1,
    approvedAt: '2026-09-10T10:10:00',
  },
];

export function getPersonById(id: number): Person {
  return persons.find((person) => person.id === id) ?? persons[0];
}

export function getShiftById(id: number): Shift {
  return shifts.find((shift) => shift.id === id) ?? shifts[0];
}