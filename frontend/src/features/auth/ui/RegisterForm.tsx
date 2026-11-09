import type { FormEvent } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import type { RegisterFormField, RegisterFormValues } from '../model/registerTypes';
import { useRegisterForm } from '../model/useRegisterForm';

interface RegisterFormProps {
  onSubmit: (values: RegisterFormValues) => Promise<void>;
}

export default function RegisterForm({ onSubmit }: RegisterFormProps) {
  const {
    values,
    errors,
    touched,
    submitting,
    submitAttempted,
    submitError,
    setField,
    handleBlur,
    handleSubmit,
  } = useRegisterForm({ onSubmit });

  const showError = (field: RegisterFormField) =>
    submitAttempted || touched[field] ? errors[field] : undefined;

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSubmit().catch(() => {
      // Ошибка уже показана в форме.
    });
  };

  return (
    <form onSubmit={handleFormSubmit} noValidate>
      <Stack spacing={2}>
        <Collapse in={Boolean(submitError)} timeout={200} unmountOnExit>
          <Alert severity="error">{submitError}</Alert>
        </Collapse>

        <TextField
          label="Имя и фамилия"
          value={values.name}
          onChange={(event) => setField('name', event.target.value)}
          onBlur={() => handleBlur('name')}
          error={Boolean(showError('name'))}
          helperText={showError('name') ?? ' '}
          autoComplete="name"
          autoFocus
          disabled={submitting}
          fullWidth
        />

        <TextField
          label="Логин"
          value={values.login}
          onChange={(event) => setField('login', event.target.value)}
          onBlur={() => handleBlur('login')}
          error={Boolean(showError('login'))}
          helperText={showError('login') ?? ' '}
          autoComplete="username"
          disabled={submitting}
          fullWidth
        />

        <TextField
          label="Пароль"
          type="password"
          value={values.password}
          onChange={(event) => setField('password', event.target.value)}
          onBlur={() => handleBlur('password')}
          error={Boolean(showError('password'))}
          helperText={showError('password') ?? 'Не менее 8 символов'}
          autoComplete="new-password"
          disabled={submitting}
          fullWidth
        />

        <TextField
          label="Повторите пароль"
          type="password"
          value={values.confirmPassword}
          onChange={(event) => setField('confirmPassword', event.target.value)}
          onBlur={() => handleBlur('confirmPassword')}
          error={Boolean(showError('confirmPassword'))}
          helperText={showError('confirmPassword') ?? ' '}
          autoComplete="new-password"
          disabled={submitting}
          fullWidth
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {submitting ? 'Создаём…' : 'Зарегистрироваться'}
        </Button>
      </Stack>
    </form>
  );
}
