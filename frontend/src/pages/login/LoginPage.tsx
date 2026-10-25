import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Grow from '@mui/material/Grow';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '../../app/providers/SessionProvider';
import { authenticate, demoLoginHints } from '../../features/auth/api/mockAuth';
import type { LoginFormValues } from '../../features/auth/model/types';
import LoginForm from '../../features/auth/ui/LoginForm';

interface LocationState {
  from?: string;
}

export default function LoginPage() {
  const { currentUserId, login } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from ?? '/';

  if (currentUserId !== null) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (values: LoginFormValues) => {
    const personId = await authenticate(values.login, values.password);
    login(personId);
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
              Войдите, чтобы продолжить работу с графиком.
            </Typography>
          </Stack>

          <LoginForm onSubmit={handleSubmit} />

          <Divider sx={{ my: 3 }} />

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
              Демонстрационный вход: пароли хранятся в mock-данных.
            </Typography>
          </Box>
        </Paper>
      </Grow>
    </Box>
  );
}
