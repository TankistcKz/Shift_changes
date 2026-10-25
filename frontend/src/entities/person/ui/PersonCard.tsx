import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Person } from '../model/types';
import PersonAvatar from './PersonAvatar';

interface PersonCardProps {
  person: Person;
  shiftCount: number;
}

export default function PersonCard({ person, shiftCount }: PersonCardProps) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <PersonAvatar name={person.name} size={48} />
          <Stack spacing={1} minWidth={0}>
            <Typography variant="h6" noWrap>
              {person.name}
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip
                size="small"
                label={person.role === 'senior' ? 'Старший' : 'Дежурный'}
                color={person.role === 'senior' ? 'secondary' : 'default'}
              />
              <Chip size="small" variant="outlined" label={`${shiftCount} смен в месяце`} />
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
