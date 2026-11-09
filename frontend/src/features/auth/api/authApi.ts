import { apiRequest } from '../../../shared/api/http';
import { mapAuthSession } from '../../../shared/api/mappers';
import { getStoredSession } from '../../../shared/api/tokenStorage';
import type { AuthSession, TokenResponseDto, UserDto } from '../../../shared/api/types';

export interface RegisterInput {
  login: string;
  password: string;
  name: string;
}

export const demoLoginHints = [
  { role: 'Старший', login: 'volkov', password: 'demo12345' },
  { role: 'Дежурный', login: 'petrov', password: 'demo12345' },
] as const;

export async function authenticate(login: string, password: string): Promise<AuthSession> {
  const response = await apiRequest<TokenResponseDto>('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: { login, password },
  });
  return mapAuthSession(response);
}

export async function register(input: RegisterInput): Promise<AuthSession> {
  const response = await apiRequest<TokenResponseDto>('/api/auth/register', {
    method: 'POST',
    auth: false,
    body: input,
  });
  return mapAuthSession(response);
}

export async function fetchCurrentUser(): Promise<UserDto> {
  return apiRequest<UserDto>('/api/auth/me');
}

export async function logout(refreshToken: string): Promise<void> {
  await apiRequest<void>('/api/auth/logout', {
    method: 'POST',
    bodyFactory: () => ({
      refresh_token: getStoredSession()?.refreshToken ?? refreshToken,
    }),
  });
}
