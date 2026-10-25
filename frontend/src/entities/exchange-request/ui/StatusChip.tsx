import Chip from '@mui/material/Chip';
import type { RequestStatus } from '../model/types';

const STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'На рассмотрении',
  approved: 'Подтверждён',
  declined: 'Отклонён',
};

const STATUS_COLORS: Record<RequestStatus, 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  approved: 'success',
  declined: 'error',
};

interface StatusChipProps {
  status: RequestStatus;
}

export default function StatusChip({ status }: StatusChipProps) {
  return <Chip size="small" label={STATUS_LABELS[status]} color={STATUS_COLORS[status]} />;
}
