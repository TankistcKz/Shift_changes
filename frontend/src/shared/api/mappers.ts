import type { ExchangeRequest } from '../../entities/exchange-request/model/types';
import type { Person } from '../../entities/person/model/types';
import type { ReplacementRecord } from '../../entities/replacement/model/types';
import type { Shift } from '../../entities/shift/model/types';
import type {
  AuthSession,
  AuthUser,
  ExchangeRequestDto,
  PersonDto,
  ReplacementRecordDto,
  ShiftDto,
  TokenResponseDto,
  UserDto,
} from './types';

export function mapPerson(dto: PersonDto): Person {
  return {
    id: dto.id,
    name: dto.name,
    role: dto.role,
  };
}

export function mapShift(dto: ShiftDto): Shift {
  return {
    id: dto.id,
    date: dto.date,
    personId: dto.person_id,
    start: dto.start_time,
    end: dto.end_time,
  };
}

export function mapExchangeRequest(dto: ExchangeRequestDto): ExchangeRequest {
  return {
    id: dto.id,
    requesterId: dto.requester_id,
    shiftId: dto.shift_id,
    targetShiftId: dto.target_shift_id,
    reason: dto.reason,
    status: dto.status,
    createdAt: dto.created_at,
  };
}

export function mapReplacementRecord(dto: ReplacementRecordDto): ReplacementRecord {
  return {
    id: dto.id,
    shiftId: dto.shift_id,
    fromPersonId: dto.from_person_id,
    toPersonId: dto.to_person_id,
    date: dto.shift?.date ?? '',
    approvedById: dto.approved_by_id,
    approvedAt: dto.approved_at,
  };
}

export function mapUser(dto: UserDto): AuthUser {
  return {
    id: dto.id,
    login: dto.login,
    personId: dto.person_id,
    isActive: dto.is_active,
    name: dto.person.name,
    role: dto.person.role,
  };
}

export function mapAuthSession(dto: TokenResponseDto): AuthSession {
  return {
    accessToken: dto.access_token,
    refreshToken: dto.refresh_token,
    user: mapUser(dto.user),
  };
}
