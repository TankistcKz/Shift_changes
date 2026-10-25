import { delay } from '../../../shared/api/mockApi';

interface DemoAccount {
  login: string;
  password: string;
  personId: number;
}

const accounts: DemoAccount[] = [
  { login: 'volkov', password: 'demo123', personId: 1 },
  { login: 'sokolova', password: 'demo123', personId: 2 },
  { login: 'kozlov', password: 'demo123', personId: 3 },
  { login: 'morozova', password: 'demo123', personId: 4 },
  { login: 'petrov', password: 'demo123', personId: 5 },
  { login: 'belova', password: 'demo123', personId: 6 },
];

export const demoLoginHints = [
  { role: 'Старший', login: 'volkov', password: 'demo123' },
  { role: 'Дежурный', login: 'petrov', password: 'demo123' },
] as const;

export async function authenticate(login: string, password: string): Promise<number> {
  await delay(600);

  const normalizedLogin = login.trim().toLowerCase();
  const account = accounts.find(
    (item) => item.login === normalizedLogin && item.password === password,
  );

  if (!account) {
    throw new Error('Неверный логин или пароль');
  }

  return account.personId;
}
