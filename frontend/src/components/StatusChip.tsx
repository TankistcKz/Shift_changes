import Chip from '@mui/material/Chip';
import type { SxProps, Theme } from '@mui/material';

const labels: Record<string, string> = {
  pending: 'На рассмотрении',
  approved: 'Подтверждён',
  declined: 'Отклонён',
  completed: 'Завершён',
};

const colors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  pending: 'warning',
  approved: 'success',
  declined: 'error',
  completed: 'info',
};

interface StatusChipProps {
  status: string;
  sx?: SxProps<Theme>;
}

export default function StatusChip({ status, sx }: StatusChipProps) {
  return (
    <Chip
      size="small"
      label={labels[status] ?? status}
      color={colors[status] ?? 'default'}
      sx={sx}
    />
  );
}