import Box from '@mui/material/Box';
import Grid2 from '@mui/material/Grid2';
import Grow from '@mui/material/Grow';
import { useAppData } from '../../app/providers/AppDataProvider';
import PersonCard from '../../entities/person/ui/PersonCard';
import EmptyState from '../../shared/ui/EmptyState';
import ErrorState from '../../shared/ui/ErrorState';
import PageHeader from '../../shared/ui/PageHeader';
import PageSkeleton from '../../shared/ui/PageSkeleton';

export default function PeoplePage() {
  const { persons, shifts, loading, error, reload } = useAppData();

  return (
    <Box>
      <PageHeader
        title="Пользователи"
        subtitle="Состав команды дежурных и старшие, подтверждающие обмены."
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
        <EmptyState title="Команда не найдена" description="Список пользователей пуст." />
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
                    <PersonCard person={person} shiftCount={shiftCount} />
                  </Box>
                </Grow>
              </Grid2>
            );
          })}
        </Grid2>
      )}
    </Box>
  );
}
