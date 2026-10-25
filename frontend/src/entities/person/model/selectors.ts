import type { Person } from './types';

export function findPerson(persons: Person[], id: number): Person | undefined {
  return persons.find((person) => person.id === id);
}

export function personName(persons: Person[], id: number): string {
  return findPerson(persons, id)?.name ?? 'Неизвестный сотрудник';
}