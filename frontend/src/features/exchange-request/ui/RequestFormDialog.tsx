import type { FormEvent } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { Person } from '../../../entities/person/model/types';
import { findPerson } from '../../../entities/person/model/selectors';
import type { Shift } from '../../../entities/shift/model/types';
import { formatShortDate } from '../../../shared/lib/date';
import SlideUpTransition from '../../../shared/ui/SlideUpTransition';
import type {
  ExchangeRequestDraft,
  ExchangeRequestFormField,
} from '../model/types';
import { useRequestForm } from '../model/useRequestForm';
import { reasonLimit } from '../model/validation';

interface RequestFormDialogProps {
  open: boolean;
  onClose: () => void;
  shifts: Shift[];
  persons: Person[];
  currentUserId: number;
  onSubmit: (draft: ExchangeRequestDraft) => Promise<void>;
}

export default function RequestFormDialog({
  open,
  onClose,
  shifts,
  persons,
  currentUserId,
  onSubmit,
}: RequestFormDialogProps) {
  const {
    values,
    errors,
    touched,
    submitting,
    submitAttempted,
    submitError,
    setField,
    handleBlur,
    handleSubmit,
  } = useRequestForm({ open, shifts, currentUserId, onSubmit });

  const myShifts = shifts.filter((shift) => shift.personId === currentUserId);
  const otherShifts = shifts.filter((shift) => shift.personId !== currentUserId);
  const currentUserName = findPerson(persons, currentUserId)?.name ?? 'сотрудник';
  const hasErrors = Object.keys(errors).length > 0;

  const showError = (field: ExchangeRequestFormField) =>
    submitAttempted || touched[field] ? errors[field] : undefined;

  const shiftError = showError('shiftId');
  const targetShiftError = showError('targetShiftId');
  const reasonError = showError('reason');

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSubmit().catch(() => {
      // Ошибка уже показана в форме.
    });
  };

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      TransitionComponent={SlideUpTransition}
    >
      <form onSubmit={handleFormSubmit} noValidate>
        <DialogTitle>Новый запрос на обмен</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Вы — {currentUserName}. Выберите свою смену и смену коллеги, с которой хотите
            поменяться.
          </Typography>

          <Stack spacing={2}>
            <Collapse in={submitAttempted && hasErrors} timeout={200}>
              <Alert severity="error">Проверьте выделенные поля формы.</Alert>
            </Collapse>

            <Collapse in={Boolean(submitError)} timeout={200} unmountOnExit>
              <Alert severity="error">{submitError}</Alert>
            </Collapse>

            <FormControl fullWidth error={Boolean(shiftError)}>
              <InputLabel id="my-shift-label">Моя смена</InputLabel>
              <Select
                labelId="my-shift-label"
                label="Моя смена"
                value={values.shiftId}
                onChange={(event) => setField('shiftId', event.target.value)}
                onBlur={() => handleBlur('shiftId')}
                disabled={submitting}
              >
                {myShifts.map((shift) => (
                  <MenuItem key={shift.id} value={String(shift.id)}>
                    {formatShortDate(shift.date)} — {shift.start}–{shift.end}
                  </MenuItem>
                ))}
              </Select>
              {shiftError && <FormHelperText>{shiftError}</FormHelperText>}
            </FormControl>

            <FormControl fullWidth error={Boolean(targetShiftError)}>
              <InputLabel id="target-shift-label">Смена для обмена</InputLabel>
              <Select
                labelId="target-shift-label"
                label="Смена для обмена"
                value={values.targetShiftId}
                onChange={(event) => setField('targetShiftId', event.target.value)}
                onBlur={() => handleBlur('targetShiftId')}
                disabled={submitting}
              >
                {otherShifts.map((shift) => (
                  <MenuItem key={shift.id} value={String(shift.id)}>
                    {formatShortDate(shift.date)} —{' '}
                    {findPerson(persons, shift.personId)?.name ?? 'Неизвестный сотрудник'} (
                    {shift.start}–{shift.end})
                  </MenuItem>
                ))}
              </Select>
              {targetShiftError && <FormHelperText>{targetShiftError}</FormHelperText>}
            </FormControl>

            <TextField
              label="Причина обмена"
              multiline
              minRows={2}
              fullWidth
              value={values.reason}
              onChange={(event) => setField('reason', event.target.value)}
              onBlur={() => handleBlur('reason')}
              error={Boolean(reasonError)}
              helperText={reasonError ?? `${values.reason.length}/${reasonLimit}`}
              disabled={submitting}
              inputProps={{ maxLength: reasonLimit }}
            />
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
            {submitting ? 'Отправляем…' : 'Отправить'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
