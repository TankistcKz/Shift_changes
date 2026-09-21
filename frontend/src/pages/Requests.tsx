import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import type { ExchangeRequest, RequestStatus } from '../types';
import { currentUserId, exchangeRequests as initialRequests, getPersonById } from '../data/mock';
import RequestCard from '../components/RequestCard';
import RequestFormDialog, { type NewRequestData } from '../components/RequestFormDialog';

type Filter = 'all' | RequestStatus;

export default function Requests() {
  const [requests, setRequests] = useState<ExchangeRequest[]>(initialRequests);
  const [filter, setFilter] = useState<Filter>('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  const counts: Record<Filter, number> = {
    all: requests.length,
    pending: requests.filter((request) => request.status === 'pending').length,
    approved: requests.filter((request) => request.status === 'approved').length,
    declined: requests.filter((request) => request.status === 'declined').length,
  };

  const filtered =
    filter === 'all'
      ? requests
      : requests.filter((request) => request.status === filter);

  const handleApprove = (id: number) => {
    setRequests((prev) =>
      prev.map((request) =>
        request.id === id ? { ...request, status: 'approved' as RequestStatus } : request,
      ),
    );
  };

  const handleDecline = (id: number) => {
    setRequests((prev) =>
      prev.map((request) =>
        request.id === id ? { ...request, status: 'declined' as RequestStatus } : request,
      ),
    );
  };

  const handleCreate = (data: NewRequestData) => {
    setRequests((prev) => [
      {
        id: Math.max(...prev.map((request) => request.id)) + 1,
        requesterId: currentUserId,
        shiftId: data.shiftId,
        targetShiftId: data.targetShiftId,
        reason: data.reason,
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setDialogOpen(false);
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        gap={1}
      >
        <Typography variant="h5">Запросы обмена</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          Создать запрос
        </Button>
      </Stack>

      <Alert severity="info" sx={{ mb: 2 }}>
        Вы вошли как {getPersonById(currentUserId).name}. Старшие подтверждают или отклоняют запросы
        на обмен.
      </Alert>

      <Tabs
        value={filter}
        onChange={(_, value) => setFilter(value as Filter)}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ mb: 2 }}
      >
        <Tab label={`Все (${counts.all})`} value="all" />
        <Tab label={`На рассмотрении (${counts.pending})`} value="pending" />
        <Tab label={`Подтверждённые (${counts.approved})`} value="approved" />
        <Tab label={`Отклонённые (${counts.declined})`} value="declined" />
      </Tabs>

      {filtered.length === 0 ? (
        <Alert severity="info">Запросов в этой категории нет.</Alert>
      ) : (
        <Stack spacing={2}>
          {filtered.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onApprove={handleApprove}
              onDecline={handleDecline}
            />
          ))}
        </Stack>
      )}

      <RequestFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreate}
      />
    </Box>
  );
}