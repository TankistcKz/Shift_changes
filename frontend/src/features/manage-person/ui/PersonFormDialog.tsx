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
import type { Person, PersonRole } from '../../../entities/person/model/types';
import SlideUpTransition from '../../../shared/ui/SlideUpTransition';

interface PersonFormDialogProps {
  open: boolean;
  person: Person | null;
  onClose: () => void;
  onSubmit: (values: { name: string; role: PersonRole }) => Promise<void>;
}

interface FormErrors {
  name?: string;
}

export default function PersonFormDialog({
  open,
  person,
  onClose,
  onSubmit,
}: PersonFormDialogProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<PersonRole>('guard');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(person?.name ?? '');
    setRole(person?.role ?? 'guard');
    setErrors({});
    setSubmitError(null);
    setSubmitting(false);
  }, [open, person]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const nextErrors: FormErrors = {};
    if (!name.trim()) nextErrors.name = 'Введите имя сотрудника';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({ name: name.trim(), role });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Не удалось сохранить сотрудника');
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
        <DialogTitle>{person ? 'Редактировать сотрудника' : 'Новый сотрудник'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Collapse in={Boolean(submitError)} timeout={200} unmountOnExit>
              <Alert severity="error">{submitError}</Alert>
            </Collapse>
            <TextField
              label="Имя и фамилия"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setErrors({});
              }}
              error={Boolean(errors.name)}
              helperText={errors.name ?? ' '}
              autoFocus
              disabled={submitting}
              fullWidth
            />
            <TextField
              select
              label="Роль"
              value={role}
              onChange={(event) => setRole(event.target.value as PersonRole)}
              disabled={submitting}
              fullWidth
            >
              <MenuItem value="guard">Дежурный</MenuItem>
              <MenuItem value="senior">Старший</MenuItem>
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
