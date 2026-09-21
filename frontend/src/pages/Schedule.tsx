import { useMemo, useState } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { Shift } from '../types';
import { getPersonById, shifts } from '../data/mock';
import ShiftGrid from '../components/ShiftGrid';

const monthNames = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

export default function Schedule() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  const monthShifts = useMemo(
    () =>
      shifts.filter((shift) =>
        shift.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`),
      ),
    [year, month],
  );

  const changeMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };

  const person = selectedShift ? getPersonById(selectedShift.personId) : null;

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        gap={1}
      >
        <Typography variant="h5">График дежурств</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button size="small" onClick={() => changeMonth(-1)} startIcon={<ChevronLeftIcon />}>
            Предыдущий
          </Button>
          <Typography minWidth={180} textAlign="center" fontWeight={600}>
            {monthNames[month]} {year}
          </Typography>
          <Button size="small" onClick={() => changeMonth(1)} endIcon={<ChevronRightIcon />}>
            Следующий
          </Button>
        </Stack>
      </Stack>

      <ShiftGrid
        year={year}
        month={month}
        shifts={monthShifts}
        onSelectShift={setSelectedShift}
        selectedShiftId={selectedShift?.id ?? null}
      />

      <Dialog open={selectedShift !== null} onClose={() => setSelectedShift(null)}>
        <DialogTitle>Дежурство {selectedShift?.date ?? ''}</DialogTitle>
        <DialogContent dividers>
          {selectedShift && person && (
            <Stack spacing={1}>
              <Typography>
                Дежурный: <strong>{person.name}</strong>
              </Typography>
              <Typography color="text.secondary">
                Время: {selectedShift.start}–{selectedShift.end}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Идентификатор смены: {selectedShift.id}
              </Typography>
              <Box>
                <Link to="/requests">Предложить обмен этой смены</Link>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedShift(null)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}