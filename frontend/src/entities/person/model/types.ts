export type PersonRole = 'senior' | 'guard';

export interface Person {
  id: number;
  name: string;
  role: PersonRole;
}