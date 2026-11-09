import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import MenuIcon from '@mui/icons-material/Menu';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import HistoryIcon from '@mui/icons-material/History';
import GroupIcon from '@mui/icons-material/Group';
import LogoutIcon from '@mui/icons-material/Logout';
import { useSession } from './providers/SessionProvider';

const drawerWidth = 260;

const navItems = [
  { to: '/', label: 'График', icon: <CalendarMonthIcon /> },
  { to: '/requests', label: 'Запросы обмена', icon: <SwapHorizIcon /> },
  { to: '/history', label: 'История замен', icon: <HistoryIcon /> },
  { to: '/people', label: 'Пользователи', icon: <GroupIcon /> },
];

interface DrawerContentProps {
  onNavigate?: () => void;
}

function DrawerContent({ onNavigate }: DrawerContentProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useSession();

  const handleLogout = async () => {
    await logout();
    onNavigate?.();
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar>
        <Typography variant="h6" noWrap>
          Смены дежурств
        </Typography>
      </Toolbar>
      <List>
        {navItems.map((item) => {
          const active =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);
          return (
            <ListItem key={item.to} disablePadding>
              <ListItemButton
                component={NavLink}
                to={item.to}
                end={item.to === '/'}
                selected={active}
                onClick={onNavigate}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ mt: 'auto', p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="caption" color="text.secondary">
          Вы вошли как
        </Typography>
        <Typography variant="body2" fontWeight={600} noWrap>
          {currentUser?.name ?? 'Загрузка…'}
        </Typography>
        {currentUser && (
          <Chip
            size="small"
            label={currentUser.role === 'senior' ? 'Старший' : 'Дежурный'}
            color={currentUser.role === 'senior' ? 'secondary' : 'default'}
            sx={{ mt: 0.5 }}
          />
        )}
        <Button
          size="small"
          fullWidth
          startIcon={<LogoutIcon />}
          onClick={() => {
            void handleLogout();
          }}
          sx={{ mt: 1, justifyContent: 'flex-start', px: 1 }}
        >
          Выйти
        </Button>
      </Box>
    </Box>
  );
}

export default function AppLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const closeMobile = () => setMobileOpen(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          {!isDesktop && (
            <IconButton
              color="inherit"
              edge="start"
              aria-label="Открыть меню"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap component="div">
            Обмен сменами дежурств
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isDesktop ? 'permanent' : 'temporary'}
          open={isDesktop || mobileOpen}
          onClose={closeMobile}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          <DrawerContent onNavigate={closeMobile} />
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          p: { xs: 2, md: 3 },
        }}
      >
        <Toolbar />
        <Fade in appear key={location.pathname} timeout={300}>
          <Box>
            <Outlet />
          </Box>
        </Fade>
      </Box>
    </Box>
  );
}
