import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Grid2 from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { persons, shifts } from '../data/mock';

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('');
}

export default function People() {
  return (
    <Box>
      <Typography variant="h5" mb={2}>
        Пользователи
      </Typography>
      <Typography color="text.secondary" mb={2}>
        Состав команды дежурных и старшие, подтверждающие обмены.
      </Typography>
      <Grid2 container spacing={2}>
        {persons.map((person) => {
          const shiftCount = shifts.filter((shift) => shift.personId === person.id).length;
          return (
            <Grid2 size={{ xs: 12, sm: 6, md: 4 }} key={person.id}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar>{initials(person.name)}</Avatar>
                    <Stack spacing={1}>
                      <Typography variant="h6">{person.name}</Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip
                          size="small"
                          label={person.role === 'senior' ? 'Старший' : 'Дежурный'}
                          color={person.role === 'senior' ? 'secondary' : 'default'}
                        />
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`${shiftCount} смен в месяце`}
                        />
                      </Stack>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid2>
          );
        })}
      </Grid2>
    </Box>
  );
}