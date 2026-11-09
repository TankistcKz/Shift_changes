import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Alert from '@mui/material/Alert';
import type { AlertColor } from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import { useAppData } from '../../app/providers/AppDataProvider';
import { useSession } from '../../app/providers/SessionProvider';
import type { ExchangeRequest, RequestStatus } from '../../entities/exchange-request/model/types';
import RequestCard from '../../entities/exchange-request/ui/RequestCard';
import { findPerson } from '../../entities/person/model/selectors';
import { findShift } from '../../entities/shift/model/selectors';
import type { ExchangeRequestDraft } from '../../features/exchange-request/model/types';
import RequestFormDialog from '../../features/exchange-request/ui/RequestFormDialog';
import ModerationButtons from '../../features/moderate-request/ui/ModerationButtons';
import ConfirmDialog from '../../shared/ui/ConfirmDialog';
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
    deleteRequest,
    pendingRequest,
  } = useAppData();

  const { currentUser } = useSession();
  const currentUserId = currentUser?.personId ?? null;

  const [filter, setFilter] = useState<Filter>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ExchangeRequest | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const counts: Record<Filter, number> = {
    all: requests.length,
    pending: requests.filter((request) => request.status === 'pending').length,
    approved: requests.filter((request) => request.status === 'approved').length,
    declined: requests.filter((request) => request.status === 'declined').length,
  };

  const filtered =
    filter === 'all' ? requests : requests.filter((request) => request.status === filter);

  const currentUserName = currentUser?.name ?? 'сотрудник';
  const isSenior = currentUser?.role === 'senior';
  const canCreate = currentUser?.role === 'guard';
  const approverName = persons.find((person) => person.role === 'senior')?.name ?? 'Старший';

  const handleApprove = async (id: number) => {
    try {
      await approveRequest(id);
      setNotice({
        message: 'Запрос подтверждён: смены в графике обновлены.',
        severity: 'success',
      });
    } catch (mutationError) {
      setNotice({
        message:
          mutationError instanceof Error
            ? mutationError.message
            : 'Не удалось подтвердить запрос',
        severity: 'error',
      });
    }
  };

  const handleDecline = async (id: number) => {
    try {
      await declineRequest(id);
      setNotice({ message: 'Запрос отклонён.', severity: 'info' });
    } catch (mutationError) {
      setNotice({
        message:
          mutationError instanceof Error
            ? mutationError.message
            : 'Не удалось отклонить запрос',
        severity: 'error',
      });
    }
  };

  const handleCreate = async (draft: ExchangeRequestDraft) => {
    await createRequest(draft);
    setDialogOpen(false);
    setFilter('pending');
    setNotice({ message: 'Запрос на обмен отправлен старшему.', severity: 'success' });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRequest(deleteTarget.id);
      setDeleteTarget(null);
      setNotice({ message: 'Запрос удалён.', severity: 'success' });
    } catch (mutationError) {
      setNotice({
        message:
          mutationError instanceof Error
            ? mutationError.message
            : 'Не удалось удалить запрос',
        severity: 'error',
      });
    } finally {
      setDeleting(false);
    }
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
                  const isMine = request.requesterId === currentUserId;
                  const canDelete = isMine || isSenior;

                  return (
                    <RequestCard
                      key={request.id}
                      request={request}
                      requester={requester}
                      shift={shift}
                      targetShift={targetShift}
                      targetPerson={targetPerson}
                      approverName={approverName}
                      isMine={isMine}
                      canModerate={isSenior}
                      actions={
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          useFlexGap
                          flexWrap="wrap"
                          sx={{ width: '100%' }}
                        >
                          {request.status === 'pending' && isSenior && (
                            <ModerationButtons
                              pendingAction={pendingAction}
                              onApprove={() => {
                                void handleApprove(request.id);
                              }}
                              onDecline={() => {
                                void handleDecline(request.id);
                              }}
                            />
                          )}
                          {canDelete && (
                            <Tooltip title="Удалить запрос">
                              <IconButton
                                size="small"
                                color="error"
                                aria-label="Удалить запрос"
                                onClick={() => setDeleteTarget(request)}
                                sx={{ ml: 'auto' }}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
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

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Удалить запрос?"
        message="Запрос будет удалён без возможности восстановления. Смены в графике не изменятся."
        busy={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          void handleDelete();
        }}
      />

      <Snackbar
        open={notice !== null}
        autoHideDuration={5000}
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
