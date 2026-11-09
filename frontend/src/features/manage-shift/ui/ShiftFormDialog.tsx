import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import type { Person } from '../../../entities/person/model/types';
import type { Shift } from '../../../entities/shift/model/types';
import type { ShiftInput } from '../../../shared/api/appApi';
import { toIsoDate } from '../../../shared/lib/date';
import SlideUpTransition from '../../../shared/ui/SlideUpTransition';

interface ShiftFormDialogProps {
  open: boolean;
  shift: Shift | null;
  shifts: Shift[];
  persons: Person[];
  onClose: () => void;
  onSubmit: (values: ShiftInput) => Promise<void>;
}

interface FormErrors {
  date?: string;
  start?: string;
  end?: string;
  personId?: string;
}

function todayIso(): string {
  const now = new Date();
  return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
}

export default function ShiftFormDialog({
  open,
  shift,
  shifts,
  persons,
  onClose,
  onSubmit,
}: ShiftFormDialogProps) {
  const [date, setDate] = useState('');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('21:00');
  const [personId, setPersonId] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDate(shift?.date ?? todayIso());
    setStart(shift?.start ?? '09:00');
    setEnd(shift?.end ?? '21:00');
    setPersonId(shift ? String(shift.personId) : persons[0] ? String(persons[0].id) : '');
    setErrors({});
    setSubmitError(null);
    setSubmitting(false);
  }, [open, shift]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const nextErrors: FormErrors = {};
    if (!date) {
      nextErrors.date = 'Выберите дату';
    } else if (
      shifts.some((item) => item.date === date && item.id !== shift?.id)
    ) {
      nextErrors.date = 'На эту дату уже есть смена';
    }
    if (!start) nextErrors.start = 'Укажите время начала';
    if (!end) nextErrors.end = 'Укажите время окончания';
    if (start && end && end <= start) {
      nextErrors.end = 'Окончание должно быть позже начала';
    }
    if (!personId) nextErrors.personId = 'Выберите сотрудника';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        date,
        start,
        end,
        personId: Number(personId),
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Не удалось сохранить смену');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      TransitionComponent={SlideUpTransition}
    >
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle>{shift ? 'Редактировать смену' : 'Новая смена'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Collapse in={Boolean(submitError)} timeout={200} unmountOnExit>
              <Alert severity="error">{submitError}</Alert>
            </Collapse>
            <TextField
              label="Дата"
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setErrors((prev) => ({ ...prev, date: undefined }));
              }}
              error={Boolean(errors.date)}
              helperText={errors.date ?? ' '}
              disabled={submitting}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Начало"
                type="time"
                value={start}
                onChange={(event) => {
                  setStart(event.target.value);
                  setErrors((prev) => ({ ...prev, start: undefined }));
                }}
                error={Boolean(errors.start)}
                helperText={errors.start ?? ' '}
                disabled={submitting}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Окончание"
                type="time"
                value={end}
                onChange={(event) => {
                  setEnd(event.target.value);
                  setErrors((prev) => ({ ...prev, end: undefined }));
                }}
                error={Boolean(errors.end)}
                helperText={errors.end ?? ' '}
                disabled={submitting}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
            <TextField
              select
              label="Сотрудник"
              value={personId}
              onChange={(event) => {
                setPersonId(event.target.value);
                setErrors((prev) => ({ ...prev, personId: undefined }));
              }}
              error={Boolean(errors.personId)}
              helperText={errors.personId ?? ' '}
              disabled={submitting}
              fullWidth
            >
              {persons.map((person) => (
                <MenuItem key={person.id} value={String(person.id)}>
                  {person.name} ({person.role === 'senior' ? 'старший' : 'дежурный'})
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={onClose} disabled={submitting}>
            Отмена
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {submitting ? 'Сохраняем…' : 'Сохранить'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
