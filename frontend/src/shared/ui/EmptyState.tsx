import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import InboxIcon from '@mui/icons-material/Inbox';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 3, sm: 5 },
        textAlign: 'center',
        borderStyle: 'dashed',
        backgroundColor: 'transparent',
      }}
    >
      <Box sx={{ color: 'text.secondary', display: 'flex', justifyContent: 'center' }}>
        {icon ?? <InboxIcon sx={{ fontSize: 52 }} />}
      </Box>
      <Typography variant="h6" mt={1}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          {description}
        </Typography>
      )}
      {action && <Box mt={2}>{action}</Box>}
    </Paper>
  );
}
