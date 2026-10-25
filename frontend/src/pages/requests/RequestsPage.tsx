import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import Alert from '@mui/material/Alert';
import type { AlertColor } from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Fade from '@mui/material/Fade';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useAppData } from '../../app/providers/AppDataProvider';
import { useSession } from '../../app/providers/SessionProvider';
import type { RequestStatus } from '../../entities/exchange-request/model/types';
import RequestCard from '../../entities/exchange-request/ui/RequestCard';
import { findPerson } from '../../entities/person/model/selectors';
import { findShift } from '../../entities/shift/model/selectors';
import type { ExchangeRequestDraft } from '../../features/exchange-request/model/types';
import RequestFormDialog from '../../features/exchange-request/ui/RequestFormDialog';
import ModerationButtons from '../../features/moderate-request/ui/ModerationButtons';
import EmptyState from '../../shared/ui/EmptyState';
import ErrorState from '../../shared/ui/ErrorState';
import PageHeader from '../../shared/ui/PageHeader';
import PageSkeleton from '../../shared/ui/PageSkeleton';

type Filter = 'all' | RequestStatus;

interface Notice {
  message: string;
  severity: AlertColor;
}

export default function RequestsPage() {
  const {
    requests,
    shifts,
    persons,
    loading,
    error,
    reload,
    createRequest,
    approveRequest,
    declineRequest,
    pendingRequest,
  } = useAppData();

  const { currentUserId } = useSession();

  const [filter, setFilter] = useState<Filter>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const counts: Record<Filter, number> = {
    all: requests.length,
    pending: requests.filter((request) => request.status === 'pending').length,
    approved: requests.filter((request) => request.status === 'approved').length,
    declined: requests.filter((request) => request.status === 'declined').length,
  };

  const filtered =
    filter === 'all' ? requests : requests.filter((request) => request.status === filter);

  const currentUser =
    currentUserId === null ? undefined : findPerson(persons, currentUserId);
  const currentUserName = currentUser?.name ?? 'сотрудник';
  const isSenior = currentUser?.role === 'senior';
  const canCreate = currentUser?.role === 'guard';
  const approverName = persons.find((person) => person.role === 'senior')?.name ?? 'Старший';

  const handleApprove = async (id: number) => {
    await approveRequest(id);
    setNotice({ message: 'Запрос подтверждён: смены в графике обновлены.', severity: 'success' });
  };

  const handleDecline = async (id: number) => {
    await declineRequest(id);
    setNotice({ message: 'Запрос отклонён.', severity: 'info' });
  };

  const handleCreate = async (draft: ExchangeRequestDraft) => {
    if (!canCreate || currentUserId === null) return;
    await createRequest(draft, currentUserId);
    setDialogOpen(false);
    setFilter('pending');
    setNotice({ message: 'Запрос на обмен отправлен старшему.', severity: 'success' });
  };

  return (
    <Box>
      <PageHeader
        title="Запросы обмена"
        subtitle={
          isSenior
            ? 'Следите за запросами дежурных и принимайте решения.'
            : 'Создавайте запросы на обмен и следите за их статусом.'
        }
        actions={
          isSenior ? (
            <Chip label="Режим старшего" color="secondary" />
          ) : canCreate ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
              disabled={loading || Boolean(error)}
            >
              Создать запрос
            </Button>
          ) : undefined
        }
      />

      {loading && <PageSkeleton variant="list" />}

      {!loading && error && (
        <ErrorState
          message={error}
          onRetry={() => {
            void reload();
          }}
        />
      )}

      {!loading && !error && (
        <>
          <Alert severity={isSenior ? 'warning' : 'info'} sx={{ mb: 2 }}>
            {isSenior
              ? `Вы вошли как ${currentUserName} (старший). Подтверждайте или отклоняйте запросы дежурных.`
              : `Вы вошли как ${currentUserName} (дежурный). Создавайте запросы — их подтверждает старший.`}
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
            <EmptyState
              title={filter === 'all' ? 'Запросов пока нет' : 'В этой категории запросов нет'}
              description={
                filter === 'all'
                  ? canCreate
                    ? 'Создайте запрос на обмен сменой — он появится здесь.'
                    : 'Когда дежурные отправят запросы, они появятся здесь.'
                  : 'Попробуйте выбрать другую категорию.'
              }
              action={
                filter === 'all' ? (
                  canCreate ? (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setDialogOpen(true)}
                    >
                      Создать запрос
                    </Button>
                  ) : undefined
                ) : (
                  <Button variant="outlined" onClick={() => setFilter('all')}>
                    Показать все
                  </Button>
                )
              }
            />
          ) : (
            <Fade in appear key={filter} timeout={250}>
              <Stack spacing={2}>
                {filtered.map((request) => {
                  const requester = findPerson(persons, request.requesterId);
                  const shift = findShift(shifts, request.shiftId);
                  const targetShift = findShift(shifts, request.targetShiftId);
                  // Для подтверждённого запроса целевая смена уже принадлежит
                  // исполнителю, поэтому прежний владелец — это владелец смены заявителя.
                  const targetPerson =
                    shift && targetShift
                      ? findPerson(
                          persons,
                          request.status === 'approved' ? shift.personId : targetShift.personId,
                        )
                      : undefined;

                  if (!requester || !shift || !targetShift || !targetPerson) return null;

                  const pendingAction =
                    pendingRequest?.id === request.id ? pendingRequest.action : null;

                  return (
                    <RequestCard
                      key={request.id}
                      request={request}
                      requester={requester}
                      shift={shift}
                      targetShift={targetShift}
                      targetPerson={targetPerson}
                      approverName={approverName}
                      isMine={request.requesterId === currentUserId}
                      canModerate={isSenior}
                      actions={
                        request.status === 'pending' && isSenior ? (
                          <ModerationButtons
                            pendingAction={pendingAction}
                            onApprove={() => {
                              void handleApprove(request.id);
                            }}
                            onDecline={() => {
                              void handleDecline(request.id);
                            }}
                          />
                        ) : undefined
                      }
                    />
                  );
                })}
              </Stack>
            </Fade>
          )}
        </>
      )}

      {currentUserId !== null && (
        <RequestFormDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          shifts={shifts}
          persons={persons}
          currentUserId={currentUserId}
          onSubmit={handleCreate}
        />
      )}

      <Snackbar
        open={notice !== null}
        autoHideDuration={4000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={notice?.severity ?? 'info'}
          variant="filled"
          onClose={() => setNotice(null)}
          sx={{ width: '100%' }}
        >
          {notice?.message ?? ''}
        </Alert>
      </Snackbar>
    </Box>
  );
}
