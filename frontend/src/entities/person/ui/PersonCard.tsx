import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { Person } from '../model/types';
import PersonAvatar from './PersonAvatar';

interface PersonCardProps {
  person: Person;
  shiftCount: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function PersonCard({
  person,
  shiftCount,
  onEdit,
  onDelete,
}: PersonCardProps) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <PersonAvatar name={person.name} size={48} />
          <Stack spacing={1} minWidth={0} flexGrow={1}>
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
          {(onEdit || onDelete) && (
            <Box display="flex" flexDirection="column">
              {onEdit && (
                <Tooltip title="Редактировать">
                  <IconButton size="small" aria-label="Редактировать сотрудника" onClick={onEdit}>
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip title="Удалить">
                  <IconButton
                    size="small"
                    color="error"
                    aria-label="Удалить сотрудника"
                    onClick={onDelete}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
