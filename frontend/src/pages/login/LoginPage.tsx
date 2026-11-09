import { useState } from 'react';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Grow from '@mui/material/Grow';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '../../app/providers/SessionProvider';
import { demoLoginHints } from '../../features/auth/api/authApi';
import type { LoginFormValues } from '../../features/auth/model/types';
import type { RegisterFormValues } from '../../features/auth/model/registerTypes';
import LoginForm from '../../features/auth/ui/LoginForm';
import RegisterForm from '../../features/auth/ui/RegisterForm';

interface LocationState {
  from?: string;
}

type AuthMode = 'login' | 'register';

export default function LoginPage() {
  const { currentUserId, login, register } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<AuthMode>('login');
  const from = (location.state as LocationState | null)?.from ?? '/';

  if (currentUserId !== null) {
    return <Navigate to={from} replace />;
  }

  const handleLogin = async (values: LoginFormValues) => {
    await login(values.login, values.password);
    navigate(from, { replace: true });
  };

  const handleRegister = async (values: RegisterFormValues) => {
    await register({
      name: values.name,
      login: values.login,
      password: values.password,
    });
    navigate(from, { replace: true });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background: 'linear-gradient(135deg, #eef2ff 0%, #f4f6f8 50%, #ecfeff 100%)',
      }}
    >
      <Grow in appear timeout={400}>
        <Paper
          elevation={6}
          sx={{
            width: '100%',
            maxWidth: 460,
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
          }}
        >
          <Stack spacing={1} alignItems="center" textAlign="center" mb={3}>
            <LockOutlinedIcon color="primary" sx={{ fontSize: 38 }} />
            <Typography variant="h5" fontWeight={700}>
              Обмен сменами дежурств
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {mode === 'login'
                ? 'Войдите, чтобы продолжить работу с графиком.'
                : 'Создайте учётную запись дежурного.'}
            </Typography>
          </Stack>

          {mode === 'login' ? (
            <LoginForm onSubmit={handleLogin} />
          ) : (
            <RegisterForm onSubmit={handleRegister} />
          )}

          <Divider sx={{ my: 3 }} />

          {mode === 'login' ? (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Демо-доступы
              </Typography>
              <Stack spacing={0.5}>
                {demoLoginHints.map((hint) => (
                  <Typography key={hint.login} variant="body2" color="text.secondary">
                    {hint.role}:{' '}
                    <Box
                      component="span"
                      sx={{ fontFamily: 'monospace', color: 'text.primary' }}
                    >
                      {hint.login} / {hint.password}
                    </Box>
                  </Typography>
                ))}
              </Stack>
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                Данные загружаются из PostgreSQL через API.
              </Typography>
              <Typography variant="body2" mt={2}>
                Нет учётной записи?{' '}
                <Box
                  component="button"
                  type="button"
                  onClick={() => setMode('register')}
                  sx={{
                    border: 0,
                    p: 0,
                    background: 'none',
                    color: 'primary.main',
                    font: 'inherit',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Зарегистрироваться
                </Box>
              </Typography>
            </Box>
          ) : (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Самостоятельная регистрация создаёт учётную запись дежурного. Роль
                «старший» назначается администратором.
              </Alert>
              <Typography variant="body2">
                Уже есть учётная запись?{' '}
                <Box
                  component="button"
                  type="button"
                  onClick={() => setMode('login')}
                  sx={{
                    border: 0,
                    p: 0,
                    background: 'none',
                    color: 'primary.main',
                    font: 'inherit',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Войти
                </Box>
              </Typography>
            </Box>
          )}
        </Paper>
      </Grow>
    </Box>
  );
}
