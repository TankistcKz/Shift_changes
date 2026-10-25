import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

type PageSkeletonVariant = 'grid' | 'list' | 'table' | 'cards';

interface PageSkeletonProps {
  variant: PageSkeletonVariant;
}

const GRID_CELLS = 35;
const LIST_ROWS = 3;
const TABLE_ROWS = 5;
const CARD_COUNT = 6;

export default function PageSkeleton({ variant }: PageSkeletonProps) {
  if (variant === 'grid') {
    return (
      <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={{ xs: 0.5, sm: 1 }}>
        {Array.from({ length: GRID_CELLS }, (_, index) => (
          <Skeleton key={index} variant="rounded" height={84} />
        ))}
      </Box>
    );
  }

  if (variant === 'table') {
    return (
      <Stack spacing={1}>
        <Skeleton variant="rounded" height={56} />
        {Array.from({ length: TABLE_ROWS }, (_, index) => (
          <Skeleton key={index} variant="rounded" height={48} />
        ))}
      </Stack>
    );
  }

  if (variant === 'cards') {
    return (
      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }}
        gap={2}
      >
        {Array.from({ length: CARD_COUNT }, (_, index) => (
          <Skeleton key={index} variant="rounded" height={120} />
        ))}
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {Array.from({ length: LIST_ROWS }, (_, index) => (
        <Skeleton key={index} variant="rounded" height={150} />
      ))}
    </Stack>
  );
}
