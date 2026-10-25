import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  message = 'Произошла неизвестная ошибка.',
  onRetry,
}: ErrorStateProps) {
  return (
    <Alert
      severity="error"
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            Повторить
          </Button>
        ) : undefined
      }
    >
      <AlertTitle>Не удалось загрузить данные</AlertTitle>
      {message}
    </Alert>
  );
}
