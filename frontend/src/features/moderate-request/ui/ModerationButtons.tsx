import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';

interface ModerationButtonsProps {
  pendingAction: 'approve' | 'decline' | null;
  onApprove: () => void;
  onDecline: () => void;
}

export default function ModerationButtons({
  pendingAction,
  onApprove,
  onDecline,
}: ModerationButtonsProps) {
  const busy = pendingAction !== null;

  return (
    <Stack direction="row" spacing={1}>
      <Button
        size="small"
        color="success"
        disabled={busy}
        onClick={onApprove}
        startIcon={
          pendingAction === 'approve' ? <CircularProgress size={14} color="inherit" /> : undefined
        }
      >
        Подтвердить
      </Button>
      <Button
        size="small"
        color="error"
        disabled={busy}
        onClick={onDecline}
        startIcon={
          pendingAction === 'decline' ? <CircularProgress size={14} color="inherit" /> : undefined
        }
      >
        Отклонить
      </Button>
    </Stack>
  );
}
