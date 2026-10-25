export interface LoginFormValues {
  login: string;
  password: string;
}

export type LoginFormField = keyof LoginFormValues;

export type LoginFormErrors = Partial<Record<LoginFormField, string>>;
