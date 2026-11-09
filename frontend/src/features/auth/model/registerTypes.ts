export interface RegisterFormValues {
  name: string;
  login: string;
  password: string;
  confirmPassword: string;
}

export type RegisterFormField = keyof RegisterFormValues;

export type RegisterFormErrors = Partial<Record<RegisterFormField, string>>;
