import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import type { Person } from '../../person/model/types';
import { personName } from '../../person/model/selectors';
import { formatDate, formatDateTime } from '../../../shared/lib/date';
import type { ReplacementRecord } from '../model/types';

interface HistoryTableProps {
  records: ReplacementRecord[];
  persons: Person[];
}

export default function HistoryTable({ records, persons }: HistoryTableProps) {
  return (
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
          {records.map((record) => (
            <TableRow key={record.id} hover>
              <TableCell>{formatDate(record.date)}</TableCell>
              <TableCell>{personName(persons, record.fromPersonId)}</TableCell>
              <TableCell>{personName(persons, record.toPersonId)}</TableCell>
              <TableCell>{personName(persons, record.approvedById)}</TableCell>
              <TableCell>{formatDateTime(record.approvedAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
