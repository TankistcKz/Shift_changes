import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import type { Shift } from '../types';
import { getPersonById } from '../data/mock';

const weekdayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

interface ShiftGridProps {
  year: number;
  month: number;
  shifts: Shift[];
  onSelectShift?: (shift: Shift) => void;
  selectedShiftId?: number | null;
}

export default function ShiftGrid({
  year,
  month,
  shifts,
  onSelectShift,
  selectedShiftId = null,
}: ShiftGridProps) {
  const cells = useMemo(() => {
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result: Array<number | null> = [];
    for (let i = 0; i < firstWeekday; i += 1) result.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) result.push(day);
    return result;
  }, [year, month]);

  const shiftByDay = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const map: Record<number, Shift> = {};
    for (const shift of shifts) {
      if (shift.date.startsWith(prefix)) {
        map[Number(shift.date.slice(8, 10))] = shift;
      }
    }
    return map;
  }, [shifts, year, month]);

  const weeks: Array<Array<number | null>> = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <Box>
      <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={{ xs: 0.5, sm: 1 }}>
        {weekdayLabels.map((label) => (
          <Box key={label} textAlign="center">
            <Typography variant="overline" color="text.secondary">
              {label}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={{ xs: 0.5, sm: 1 }}>
        {weeks.flat().map((day, index) => {
          const key = day ?? `empty-${index}`;
          const shift = day ? shiftByDay[day] : undefined;
          const person = shift ? getPersonById(shift.personId) : undefined;
          return (
            <Paper
              key={key}
              elevation={0}
              variant={shift ? 'outlined' : undefined}
              sx={{
                p: { xs: 1, md: 1.5 },
                minHeight: { xs: 64, md: 84 },
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                cursor: shift ? 'pointer' : 'default',
                backgroundColor: day === undefined ? 'action.hover' : undefined,
                ...(shift && shift.id === selectedShiftId
                  ? { outline: '2px solid', outlineColor: 'primary.main' }
                  : {}),
              }}
              onClick={shift && onSelectShift ? () => onSelectShift(shift) : undefined}
            >
              <Typography variant="subtitle2" color="text.secondary">
                {day ?? ''}
              </Typography>
              {person && (
                <Typography variant="body2" fontWeight={600} noWrap>
                  {person.name}
                </Typography>
              )}
              {shift && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {shift.start}–{shift.end}
                </Typography>
              )}
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}