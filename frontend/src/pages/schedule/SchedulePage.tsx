import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Fade from '@mui/material/Fade';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useAppData } from '../../app/providers/AppDataProvider';
import { findPerson } from '../../entities/person/model/selectors';
import ShiftDetailsDialog from '../../entities/shift/ui/ShiftDetailsDialog';
import ShiftGrid from '../../entities/shift/ui/ShiftGrid';
import { monthKey, monthLabel } from '../../shared/lib/date';
import EmptyState from '../../shared/ui/EmptyState';
import ErrorState from '../../shared/ui/ErrorState';
import PageHeader from '../../shared/ui/PageHeader';
import PageSkeleton from '../../shared/ui/PageSkeleton';

export default function SchedulePage() {
  const { shifts, persons, loading, error, reload } = useAppData();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);

  const monthShifts = useMemo(() => {
    const prefix = monthKey(year, month);
    return shifts.filter((shift) => shift.date.startsWith(prefix));
  }, [shifts, year, month]);

  const selectedShift =
    selectedShiftId === null
      ? null
      : (shifts.find((shift) => shift.id === selectedShiftId) ?? null);

  const changeMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
    setSelectedShiftId(null);
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelectedShiftId(null);
  };

  return (
    <Box>
      <PageHeader
        title="График дежурств"
        subtitle="Кликните по дню, чтобы посмотреть детали смены."
        actions={
          <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
            <Button size="small" onClick={() => changeMonth(-1)} startIcon={<ChevronLeftIcon />}>
              Назад
            </Button>
            <Typography minWidth={170} textAlign="center" fontWeight={600}>
              {monthLabel(year, month)}
            </Typography>
            <Button size="small" onClick={() => changeMonth(1)} endIcon={<ChevronRightIcon />}>
              Вперёд
            </Button>
          </Stack>
        }
      />

      {loading && <PageSkeleton variant="grid" />}

      {!loading && error && (
        <ErrorState
          message={error}
          onRetry={() => {
            void reload();
          }}
        />
      )}

      {!loading && !error && monthShifts.length === 0 && (
        <EmptyState
          title="На этот месяц смен нет"
          description="В демо-данных график заполнен только для текущего месяца."
          action={
            <Button variant="outlined" onClick={goToCurrentMonth}>
              Вернуться к текущему месяцу
            </Button>
          }
        />
      )}

      {!loading && !error && monthShifts.length > 0 && (
        <Fade in appear key={monthKey(year, month)} timeout={300}>
          <Box>
            <ShiftGrid
              year={year}
              month={month}
              shifts={monthShifts}
              persons={persons}
              onSelectShift={(shift) => setSelectedShiftId(shift.id)}
              selectedShiftId={selectedShiftId}
            />
          </Box>
        </Fade>
      )}

      <ShiftDetailsDialog
        shift={selectedShift}
        person={selectedShift ? findPerson(persons, selectedShift.personId) : undefined}
        onClose={() => setSelectedShiftId(null)}
      />
    </Box>
  );
}
