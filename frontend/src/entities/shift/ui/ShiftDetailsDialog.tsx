import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import type { Person } from '../../person/model/types';
import { formatDate } from '../../../shared/lib/date';
import SlideUpTransition from '../../../shared/ui/SlideUpTransition';
import type { Shift } from '../model/types';

interface ShiftDetailsDialogProps {
  shift: Shift | null;
  person?: Person;
  onClose: () => void;
}

export default function ShiftDetailsDialog({ shift, person, onClose }: ShiftDetailsDialogProps) {
  return (
    <Dialog
      open={shift !== null}
      onClose={onClose}
      TransitionComponent={SlideUpTransition}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle>
        {shift ? `Дежурство ${formatDate(shift.date)}` : 'Дежурство'}
      </DialogTitle>
      <DialogContent dividers>
        {shift && (
          <Stack spacing={1}>
            <Typography>
              Дежурный: <strong>{person?.name ?? 'Неизвестный сотрудник'}</strong>
            </Typography>
            <Typography color="text.secondary">
              Время: {shift.start}–{shift.end}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Смена #{shift.id}
            </Typography>
            <Box>
              <Link to="/requests">Предложить обмен этой смены</Link>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
}
