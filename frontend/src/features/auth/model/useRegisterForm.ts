import { useCallback, useMemo, useState } from 'react';
import type {
  RegisterFormErrors,
  RegisterFormField,
  RegisterFormValues,
} from './registerTypes';
import { validateRegister } from './validateRegister';

const EMPTY_VALUES: RegisterFormValues = {
  name: '',
  login: '',
  password: '',
  confirmPassword: '',
};

interface UseRegisterFormOptions {
  onSubmit: (values: RegisterFormValues) => Promise<void>;
}

export interface UseRegisterFormResult {
  values: RegisterFormValues;
  errors: RegisterFormErrors;
  touched: Partial<Record<RegisterFormField, boolean>>;
  submitting: boolean;
  submitAttempted: boolean;
  submitError: string | null;
  setField: (field: RegisterFormField, value: string) => void;
  handleBlur: (field: RegisterFormField) => void;
  handleSubmit: () => Promise<void>;
}

export function useRegisterForm({
  onSubmit,
}: UseRegisterFormOptions): UseRegisterFormResult {
  const [values, setValues] = useState<RegisterFormValues>(EMPTY_VALUES);
  const [touched, setTouched] = useState<Partial<Record<RegisterFormField, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const errors = useMemo(() => validateRegister(values), [values]);

  const setField = useCallback((field: RegisterFormField, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setSubmitError(null);
  }, []);

  const handleBlur = useCallback((field: RegisterFormField) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;

    setSubmitAttempted(true);
    setTouched({
      name: true,
      login: true,
      password: true,
      confirmPassword: true,
    });

    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        name: values.name.trim(),
        login: values.login.trim(),
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Не удалось зарегистрироваться',
      );
      throw error;
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
    submitError,
    setField,
    handleBlur,
    handleSubmit,
  };
}
