import { useCallback, useMemo, useState } from 'react';
import type { LoginFormErrors, LoginFormField, LoginFormValues } from './types';
import { validateLogin } from './validation';

const EMPTY_VALUES: LoginFormValues = {
  login: '',
  password: '',
};

interface UseLoginFormOptions {
  onSubmit: (values: LoginFormValues) => Promise<void>;
}

export interface UseLoginFormResult {
  values: LoginFormValues;
  errors: LoginFormErrors;
  touched: Partial<Record<LoginFormField, boolean>>;
  submitting: boolean;
  submitAttempted: boolean;
  authError: string | null;
  setField: (field: LoginFormField, value: string) => void;
  handleBlur: (field: LoginFormField) => void;
  handleSubmit: () => Promise<void>;
}

export function useLoginForm({ onSubmit }: UseLoginFormOptions): UseLoginFormResult {
  const [values, setValues] = useState<LoginFormValues>(EMPTY_VALUES);
  const [touched, setTouched] = useState<Partial<Record<LoginFormField, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const errors = useMemo(() => validateLogin(values), [values]);

  const setField = useCallback((field: LoginFormField, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setAuthError(null);
  }, []);

  const handleBlur = useCallback((field: LoginFormField) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;

    setSubmitAttempted(true);
    setTouched({ login: true, password: true });

    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setAuthError(null);
    try {
      await onSubmit({
        login: values.login.trim(),
        password: values.password,
      });
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Не удалось войти');
    } finally {
      setSubmitting(false);
    }
  }, [errors, onSubmit, submitting, values]);

  return {
    values,
    errors,
    touched,
    submitting,
    submitAttempted,
    authError,
    setField,
    handleBlur,
    handleSubmit,
  };
}
