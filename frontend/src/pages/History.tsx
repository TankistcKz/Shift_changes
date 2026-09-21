import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { getPersonById, replacementHistory } from '../data/mock';

function formatDate(date: string) {
  const [y, m, d] = date.slice(0, 10).split('-');
  return `${d}.${m}.${y}`;
}

function formatDateTime(value: string) {
  const [date, time] = value.split('T');
  const [y, m, d] = date.split('-');
  const [hh, mm] = time.split(':');
  return `${d}.${m}.${y} ${hh}:${mm}`;
}

export default function History() {
  return (
    <Box>
      <Typography variant="h5" mb={2}>
        История замен
      </Typography>
      <Typography color="text.secondary" mb={2}>
        Завершённые обмены сменами и их подтверждения старшими.
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table sx={{ minWidth: 640 }}>
          <TableHead>
            <TableRow>
              <TableCell>Дата смены</TableCell>
              <TableCell>Кто был назначен</TableCell>
              <TableCell>Кто заменил</TableCell>
              <TableCell>Кем подтверждено</TableCell>
              <TableCell>Дата подтверждения</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {replacementHistory.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{formatDate(record.date)}</TableCell>
                <TableCell>{getPersonById(record.fromPersonId).name}</TableCell>
                <TableCell>{getPersonById(record.toPersonId).name}</TableCell>
                <TableCell>{getPersonById(record.approvedById).name}</TableCell>
                <TableCell>{formatDateTime(record.approvedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}