import { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { currentUserId, getPersonById, shifts } from '../data/mock';

export interface NewRequestData {
  shiftId: number;
  targetShiftId: number;
  reason: string;
}

interface RequestFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NewRequestData) => void;
}

function formatDate(date: string) {
  const [, m, d] = date.split('-');
  return `${d}.${m}`;
}

export default function RequestFormDialog({ open, onClose, onSubmit }: RequestFormDialogProps) {
  const myShifts = shifts.filter((shift) => shift.personId === currentUserId);
  const otherShifts = shifts.filter((shift) => shift.personId !== currentUserId);
  const [shiftId, setShiftId] = useState('');
  const [targetShiftId, setTargetShiftId] = useState('');
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setShiftId('');
      setTargetShiftId('');
      setReason('');
      setTouched(false);
    }
  }, [open]);

  const valid = shiftId !== '' && targetShiftId !== '' && reason.trim().length > 0;

  const handleSubmit = () => {
    setTouched(true);
    if (!valid) return;
    onSubmit({
      shiftId: Number(shiftId),
      targetShiftId: Number(targetShiftId),
      reason: reason.trim(),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Новый запрос на обмен</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Вы — {getPersonById(currentUserId).name}. Выберите свою смену и смену коллеги, с которой
          хотите поменяться.
        </Typography>
        <Stack spacing={2} mt={2}>
          <FormControl fullWidth>
            <InputLabel id="shift-label">Моя смена</InputLabel>
            <Select
              labelId="shift-label"
              label="Моя смена"
              value={shiftId}
              onChange={(event) => setShiftId(event.target.value)}
            >
              {myShifts.map((shift) => (
                <MenuItem key={shift.id} value={shift.id}>
                  {formatDate(shift.date)} — {shift.start}–{shift.end}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="target-label">Смена для обмена</InputLabel>
            <Select
              labelId="target-label"
              label="Смена для обмена"
              value={targetShiftId}
              onChange={(event) => setTargetShiftId(event.target.value)}
            >
              {otherShifts.map((shift) => (
                <MenuItem key={shift.id} value={shift.id}>
                  {formatDate(shift.date)} — {getPersonById(shift.personId).name} ({shift.start}–
                  {shift.end})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Причина обмена"
            multiline
            minRows={2}
            fullWidth
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            error={touched && reason.trim().length === 0}
            helperText={touched && reason.trim().length === 0 ? 'Укажите причину' : ' '}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={touched && !valid}>
          Отправить
        </Button>
      </DialogActions>
    </Dialog>
  );
}