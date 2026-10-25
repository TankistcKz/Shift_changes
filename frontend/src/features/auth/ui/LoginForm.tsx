import { useState } from 'react';
import type { FormEvent } from 'react';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import type { LoginFormField, LoginFormValues } from '../model/types';
import { useLoginForm } from '../model/useLoginForm';

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => Promise<void>;
}

export default function LoginForm({ onSubmit }: LoginFormProps) {
  const {
    values,
    errors,
    touched,
    submitting,
    submitAttempted,
    authError,
    setField,
    handleBlur,
    handleSubmit,
  } = useLoginForm({ onSubmit });

  const [showPassword, setShowPassword] = useState(false);

  const showError = (field: LoginFormField) =>
    submitAttempted || touched[field] ? errors[field] : undefined;

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSubmit();
  };

  return (
    <form onSubmit={handleFormSubmit} noValidate>
      <Stack spacing={2}>
        <Collapse in={Boolean(authError)} timeout={200} unmountOnExit>
          <Alert severity="error">{authError}</Alert>
        </Collapse>

        <TextField
          label="Логин"
          value={values.login}
          onChange={(event) => setField('login', event.target.value)}
          onBlur={() => handleBlur('login')}
          error={Boolean(showError('login'))}
          helperText={showError('login') ?? ' '}
          autoComplete="username"
          autoFocus
          disabled={submitting}
          fullWidth
        />

        <TextField
          label="Пароль"
          type={showPassword ? 'text' : 'password'}
          value={values.password}
          onChange={(event) => setField('password', event.target.value)}
          onBlur={() => handleBlur('password')}
          error={Boolean(showError('password'))}
          helperText={showError('password') ?? ' '}
          autoComplete="current-password"
          disabled={submitting}
          fullWidth
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {submitting ? 'Входим…' : 'Войти'}
        </Button>
      </Stack>
    </form>
  );
}
