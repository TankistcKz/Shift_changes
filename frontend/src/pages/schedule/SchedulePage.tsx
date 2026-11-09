import { useMemo, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import Alert from '@mui/material/Alert';
import type { AlertColor } from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Fade from '@mui/material/Fade';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useAppData } from '../../app/providers/AppDataProvider';
import { useSession } from '../../app/providers/SessionProvider';
import { findPerson } from '../../entities/person/model/selectors';
import type { Shift } from '../../entities/shift/model/types';
import ShiftDetailsDialog from '../../entities/shift/ui/ShiftDetailsDialog';
import ShiftGrid from '../../entities/shift/ui/ShiftGrid';
import ShiftFormDialog from '../../features/manage-shift/ui/ShiftFormDialog';
import type { ShiftInput } from '../../shared/api/appApi';
import { monthKey, monthLabel } from '../../shared/lib/date';
import ConfirmDialog from '../../shared/ui/ConfirmDialog';
import EmptyState from '../../shared/ui/EmptyState';
import ErrorState from '../../shared/ui/ErrorState';
import PageHeader from '../../shared/ui/PageHeader';
import PageSkeleton from '../../shared/ui/PageSkeleton';

interface Notice {
  message: string;
  severity: AlertColor;
}

interface FormState {
  open: boolean;
  shift: Shift | null;
}

export default function SchedulePage() {
  const {
    shifts,
    persons,
    loading,
    error,
    reload,
    createShift,
    updateShift,
    deleteShift,
  } = useAppData();
  const { currentUser } = useSession();
  const canManage = currentUser?.role === 'senior';

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({ open: false, shift: null });
  const [deleteTarget, setDeleteTarget] = useState<Shift | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

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

  const handleSave = async (values: ShiftInput) => {
    const editing = form.shift;
    if (editing) {
      await updateShift(editing.id, values);
    } else {
      await createShift(values);
    }

    const [nextYear, nextMonth] = values.date.split('-').map(Number);
    if (Number.isInteger(nextYear) && Number.isInteger(nextMonth)) {
      setYear(nextYear);
      setMonth(nextMonth - 1);
    }
    setForm({ open: false, shift: null });
    setNotice({
      message: editing ? 'Смена обновлена.' : 'Смена добавлена в график.',
      severity: 'success',
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteShift(deleteTarget.id);
      setDeleteTarget(null);
      setNotice({ message: 'Смена удалена.', severity: 'success' });
    } catch (deleteError) {
      setNotice({
        message:
          deleteError instanceof Error ? deleteError.message : 'Не удалось удалить смену',
        severity: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="График дежурств"
        subtitle={
          canManage
            ? 'Кликните по дню, чтобы посмотреть, изменить или удалить смену.'
            : 'Кликните по дню, чтобы посмотреть детали смены.'
        }
        actions={
          <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
            {canManage && (
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setForm({ open: true, shift: null })}
                disabled={loading || Boolean(error)}
              >
                Добавить смену
              </Button>
            )}
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
          description={
            canManage
              ? 'Добавьте первую смену на выбранный месяц.'
              : 'Обратитесь к старшему, чтобы он заполнил график.'
          }
          action={
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent="center">
              <Button variant="outlined" onClick={goToCurrentMonth}>
                Вернуться к текущему месяцу
              </Button>
              {canManage && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setForm({ open: true, shift: null })}
                >
                  Добавить смену
                </Button>
              )}
            </Stack>
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
        canManage={canManage}
        canRequestExchange={Boolean(
          selectedShift &&
            currentUser?.role === 'guard' &&
            selectedShift.personId === currentUser.personId,
        )}
        onEdit={() => {
          if (!selectedShift) return;
          setForm({ open: true, shift: selectedShift });
          setSelectedShiftId(null);
        }}
        onDelete={() => {
          if (!selectedShift) return;
          setDeleteTarget(selectedShift);
          setSelectedShiftId(null);
        }}
        onClose={() => setSelectedShiftId(null)}
      />

      <ShiftFormDialog
        open={form.open}
        shift={form.shift}
        shifts={shifts}
        persons={persons}
        onClose={() => setForm({ open: false, shift: null })}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Удалить смену?"
        message={
          deleteTarget
            ? `Смена от ${deleteTarget.date} (${deleteTarget.start}–${deleteTarget.end}) будет удалена. Если с ней связан запрос на обмен, удаление будет отклонено.`
            : ''
        }
        busy={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          void handleDelete();
        }}
      />

      <Snackbar
        open={notice !== null}
        autoHideDuration={5000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={notice?.severity ?? 'info'}
          variant="filled"
          onClose={() => setNotice(null)}
          sx={{ width: '100%' }}
        >
          {notice?.message ?? ''}
        </Alert>
      </Snackbar>
    </Box>
  );
}
