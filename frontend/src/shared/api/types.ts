import type { PersonRole } from '../../entities/person/model/types';

export interface PersonDto {
  id: number;
  name: string;
  role: PersonRole;
}

export interface UserDto {
  id: number;
  login: string;
  person_id: number;
  is_active: boolean;
  person: PersonDto;
}

export interface AuthUser {
  id: number;
  login: string;
  personId: number;
  isActive: boolean;
  name: string;
  role: PersonRole;
}

export interface TokenResponseDto {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
  user: UserDto;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface ShiftDto {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  person_id: number;
  person?: PersonDto | null;
}

export interface ExchangeRequestDto {
  id: number;
  requester_id: number;
  shift_id: number;
  target_shift_id: number;
  reason: string;
  status: 'pending' | 'approved' | 'declined';
  created_at: string;
  requester?: PersonDto | null;
  shift?: ShiftDto | null;
  target_shift?: ShiftDto | null;
}

export interface ReplacementRecordDto {
  id: number;
  shift_id: number;
  from_person_id: number;
  to_person_id: number;
  approved_by_id: number;
  approved_at: string;
  shift?: ShiftDto | null;
  from_person?: PersonDto | null;
  to_person?: PersonDto | null;
  approved_by?: PersonDto | null;
}

export interface ShiftPayload {
  date: string;
  start_time: string;
  end_time: string;
  person_id: number;
}

export interface PersonPayload {
  name: string;
  role: PersonRole;
}
