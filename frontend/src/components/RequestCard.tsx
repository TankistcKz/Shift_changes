import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ExchangeRequest } from '../types';
import { currentUserId, getPersonById, getShiftById } from '../data/mock';
import StatusChip from './StatusChip';

interface RequestCardProps {
  request: ExchangeRequest;
  onApprove: (id: number) => void;
  onDecline: (id: number) => void;
}

function formatDate(date: string) {
  const [y, m, d] = date.slice(0, 10).split('-');
  return `${d}.${m}.${y}`;
}

export default function RequestCard({ request, onApprove, onDecline }: RequestCardProps) {
  const requester = getPersonById(request.requesterId);
  const shift = getShiftById(request.shiftId);
  const targetShift = getShiftById(request.targetShiftId);
  const targetPerson = getPersonById(targetShift.personId);
  const senior = getPersonById(1);
  const isMine = request.requesterId === currentUserId;

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          gap={1}
          flexWrap="wrap"
        >
          <Typography variant="h6">{requester.name}</Typography>
          <StatusChip status={request.status} />
        </Stack>
        <Typography color="text.secondary" variant="body2" mt={1}>
          {formatDate(shift.date)} ({shift.start}–{shift.end}) → {formatDate(targetShift.date)},{' '}
          {targetPerson.name}
        </Typography>
        <Typography variant="body2" mt={1}>
          Причина: {request.reason}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
          {request.status === 'approved'
            ? `Подтверждено старшим: ${senior.name}`
            : request.status === 'declined'
              ? `Отклонено старшим: ${senior.name}`
              : isMine
                ? 'Ожидает подтверждения старшего'
                : 'На рассмотрении у старшего'}
        </Typography>
      </CardContent>
      {request.status === 'pending' && (
        <>
          <Divider />
          <CardActions>
            <Button size="small" color="success" onClick={() => onApprove(request.id)}>
              Подтвердить
            </Button>
            <Button size="small" color="error" onClick={() => onDecline(request.id)}>
              Отклонить
            </Button>
          </CardActions>
        </>
      )}
    </Card>
  );
}