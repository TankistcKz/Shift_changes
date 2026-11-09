import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import Alert from '@mui/material/Alert';
import type { AlertColor } from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid2 from '@mui/material/Grid2';
import Grow from '@mui/material/Grow';
import Snackbar from '@mui/material/Snackbar';
import { useAppData } from '../../app/providers/AppDataProvider';
import { useSession } from '../../app/providers/SessionProvider';
import type { Person, PersonRole } from '../../entities/person/model/types';
import PersonCard from '../../entities/person/ui/PersonCard';
import PersonFormDialog from '../../features/manage-person/ui/PersonFormDialog';
import ConfirmDialog from '../../shared/ui/ConfirmDialog';
import EmptyState from '../../shared/ui/EmptyState';
import ErrorState from '../../shared/ui/ErrorState';
import PageHeader from '../../shared/ui/PageHeader';
import PageSkeleton from '../../shared/ui/PageSkeleton';

interface Notice {
  message: string;
  severity: AlertColor;
}

interface FormState {
  open: boolean;
  person: Person | null;
}

export default function PeoplePage() {
  const {
    persons,
    shifts,
    loading,
    error,
    reload,
    createPerson,
    updatePerson,
    deletePerson,
  } = useAppData();
  const { currentUser } = useSession();
  const isSenior = currentUser?.role === 'senior';

  const [form, setForm] = useState<FormState>({ open: false, person: null });
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const handleSave = async (values: { name: string; role: PersonRole }) => {
    if (form.person) {
      await updatePerson(form.person.id, values);
    } else {
      await createPerson(values);
    }
    setForm({ open: false, person: null });
    setNotice({
      message: form.person ? 'Данные сотрудника обновлены.' : 'Сотрудник добавлен.',
      severity: 'success',
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePerson(deleteTarget.id);
      setDeleteTarget(null);
      setNotice({ message: 'Сотрудник удалён.', severity: 'success' });
    } catch (deleteError) {
      setNotice({
        message:
          deleteError instanceof Error ? deleteError.message : 'Не удалось удалить сотрудника',
        severity: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Пользователи"
        subtitle="Состав команды дежурных и старшие, подтверждающие обмены."
        actions={
          isSenior ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setForm({ open: true, person: null })}
              disabled={loading || Boolean(error)}
            >
              Добавить сотрудника
            </Button>
          ) : undefined
        }
      />

      {loading && <PageSkeleton variant="cards" />}

      {!loading && error && (
        <ErrorState
          message={error}
          onRetry={() => {
            void reload();
          }}
        />
      )}

      {!loading && !error && persons.length === 0 && (
        <EmptyState
          title="Команда не найдена"
          description={
            isSenior
              ? 'Добавьте первого сотрудника, чтобы составить график.'
              : 'Список пользователей пуст.'
          }
          action={
            isSenior ? (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setForm({ open: true, person: null })}
              >
                Добавить сотрудника
              </Button>
            ) : undefined
          }
        />
      )}

      {!loading && !error && persons.length > 0 && (
        <Grid2 container spacing={2}>
          {persons.map((person, index) => {
            const shiftCount = shifts.filter((shift) => shift.personId === person.id).length;
            return (
              <Grid2 size={{ xs: 12, sm: 6, md: 4 }} key={person.id}>
                <Grow
                  in
                  appear
                  timeout={{ enter: 350, exit: 200 }}
                  style={{ transitionDelay: `${index * 60}ms` }}
                >
                  <Box sx={{ height: '100%' }}>
                    <PersonCard
                      person={person}
                      shiftCount={shiftCount}
                      onEdit={
                        isSenior
                          ? () => setForm({ open: true, person })
                          : undefined
                      }
                      onDelete={
                        isSenior ? () => setDeleteTarget(person) : undefined
                      }
                    />
                  </Box>
                </Grow>
              </Grid2>
            );
          })}
        </Grid2>
      )}

      <PersonFormDialog
        open={form.open}
        person={form.person}
        onClose={() => setForm({ open: false, person: null })}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Удалить сотрудника?"
        message={
          deleteTarget
            ? `Сотрудник «${deleteTarget.name}» будет удалён. Если у него есть смены или запросы, удаление будет отклонено.`
            : ''
        }
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
