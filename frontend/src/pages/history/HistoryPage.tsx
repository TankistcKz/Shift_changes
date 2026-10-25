import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import { useAppData } from '../../app/providers/AppDataProvider';
import HistoryTable from '../../entities/replacement/ui/HistoryTable';
import EmptyState from '../../shared/ui/EmptyState';
import ErrorState from '../../shared/ui/ErrorState';
import PageHeader from '../../shared/ui/PageHeader';
import PageSkeleton from '../../shared/ui/PageSkeleton';

export default function HistoryPage() {
  const { history, persons, loading, error, reload } = useAppData();

  return (
    <Box>
      <PageHeader
        title="История замен"
        subtitle="Завершённые обмены сменами и их подтверждения старшими."
      />

      {loading && <PageSkeleton variant="table" />}

      {!loading && error && (
        <ErrorState
          message={error}
          onRetry={() => {
            void reload();
          }}
        />
      )}

      {!loading && !error && history.length === 0 && (
        <EmptyState
          title="Замен ещё не было"
          description="После подтверждения обмена записи появятся в этой таблице."
        />
      )}

      {!loading && !error && history.length > 0 && (
        <Fade in appear timeout={300}>
          <Box>
            <HistoryTable records={history} persons={persons} />
          </Box>
        </Fade>
      )}
    </Box>
  );
}
