import type { RegisterFormErrors, RegisterFormValues } from './registerTypes';

const LOGIN_PATTERN = /^[a-zA-Z0-9_.-]+$/;

export function validateRegister(values: RegisterFormValues): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  if (!values.name.trim()) {
    errors.name = 'Введите имя сотрудника';
  }

  const login = values.login.trim();
  if (!login) {
    errors.login = 'Введите логин';
  } else if (login.length < 3) {
    errors.login = 'Логин должен содержать не менее 3 символов';
  } else if (!LOGIN_PATTERN.test(login)) {
    errors.login = 'Допустимы латинские буквы, цифры, точка, дефис и подчёркивание';
  }

  if (!values.password) {
    errors.password = 'Введите пароль';
  } else if (values.password.length < 8) {
    errors.password = 'Пароль должен содержать не менее 8 символов';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Повторите пароль';
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Пароли не совпадают';
  }

  return errors;
}
