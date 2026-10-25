import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Fade from '@mui/material/Fade';
import Grow from '@mui/material/Grow';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Person } from '../../person/model/types';
import PersonAvatar from '../../person/ui/PersonAvatar';
import type { Shift } from '../../shift/model/types';
import { formatDate, formatDateTime } from '../../../shared/lib/date';
import type { ExchangeRequest } from '../model/types';
import StatusChip from './StatusChip';

interface RequestCardProps {
  request: ExchangeRequest;
  requester: Person;
  shift: Shift;
  targetShift: Shift;
  targetPerson: Person;
  approverName: string;
  isMine: boolean;
  canModerate?: boolean;
  actions?: ReactNode;
}

export default function RequestCard({
  request,
  requester,
  shift,
  targetShift,
  targetPerson,
  approverName,
  isMine,
  canModerate = false,
  actions,
}: RequestCardProps) {
  const note =
    request.status === 'approved'
      ? `Подтверждено старшим: ${approverName}`
      : request.status === 'declined'
        ? `Отклонено старшим: ${approverName}`
        : canModerate
          ? 'Ожидает вашего решения'
          : isMine
            ? 'Ожидает подтверждения старшего'
            : 'На рассмотрении у старшего';

  return (
    <Grow in appear timeout={350}>
      <Card variant="outlined">
        <CardContent>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            gap={1}
            flexWrap="wrap"
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <PersonAvatar name={requester.name} size={40} />
              <Box>
                <Typography variant="h6">{requester.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Создан {formatDateTime(request.createdAt)}
                </Typography>
              </Box>
            </Stack>
            <Fade in appear key={request.status} timeout={300}>
              <span>
                <StatusChip status={request.status} />
              </span>
            </Fade>
          </Stack>

          <Typography color="text.secondary" variant="body2" mt={1.5}>
            {formatDate(shift.date)} ({shift.start}–{shift.end}) → {formatDate(targetShift.date)},{' '}
            {targetPerson.name}
          </Typography>
          <Typography variant="body2" mt={1}>
            Причина: {request.reason}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            {note}
          </Typography>
        </CardContent>

        <Collapse in={request.status === 'pending' && Boolean(actions)} timeout={250} unmountOnExit>
          <Box>
            <Divider />
            <CardActions sx={{ px: 2, py: 1.5 }}>{actions}</CardActions>
          </Box>
        </Collapse>
      </Card>
    </Grow>
  );
}
