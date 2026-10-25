import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import type { Person } from '../../person/model/types';
import { findPerson } from '../../person/model/selectors';
import { buildMonthMatrix, monthKey } from '../../../shared/lib/date';
import type { Shift } from '../model/types';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

interface ShiftGridProps {
  year: number;
  month: number;
  shifts: Shift[];
  persons: Person[];
  onSelectShift?: (shift: Shift) => void;
  selectedShiftId?: number | null;
}

export default function ShiftGrid({
  year,
  month,
  shifts,
  persons,
  onSelectShift,
  selectedShiftId = null,
}: ShiftGridProps) {
  const cells = useMemo(() => buildMonthMatrix(year, month), [year, month]);
  const prefix = monthKey(year, month);

  const shiftByDay = useMemo(() => {
    const map = new Map<number, Shift>();
    for (const shift of shifts) {
      if (shift.date.startsWith(prefix)) {
        map.set(Number(shift.date.slice(8, 10)), shift);
      }
    }
    return map;
  }, [shifts, prefix]);

  return (
    <Box>
      <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={{ xs: 0.5, sm: 1 }} mb={1}>
        {WEEKDAYS.map((label) => (
          <Box key={label} textAlign="center">
            <Typography variant="overline" color="text.secondary">
              {label}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={{ xs: 0.5, sm: 1 }}>
        {cells.map((day, index) => {
          const shift = day === null ? undefined : shiftByDay.get(day);
          const person = shift ? findPerson(persons, shift.personId) : undefined;
          const selected = Boolean(shift && shift.id === selectedShiftId);
          return (
            <Paper
              key={day ?? `empty-${index}`}
              elevation={0}
              variant={shift ? 'outlined' : undefined}
              sx={{
                p: { xs: 1, md: 1.5 },
                minHeight: { xs: 64, md: 84 },
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                backgroundColor: day === null ? 'action.hover' : undefined,
                transition: 'transform 160ms ease, box-shadow 160ms ease, outline-color 160ms ease',
                ...(shift
                  ? {
                      cursor: 'pointer',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
                    }
                  : {}),
                ...(selected
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
