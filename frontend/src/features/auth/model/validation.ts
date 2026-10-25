import type { LoginFormErrors, LoginFormValues } from './types';

export function validateLogin(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {};

  if (!values.login.trim()) {
    errors.login = 'Введите логин';
  }
  if (!values.password) {
    errors.password = 'Введите пароль';
  }

  return errors;
}
