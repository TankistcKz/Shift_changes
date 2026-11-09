import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession } from './providers/SessionProvider';

export default function RequireAuth() {
  const { currentUserId } = useSession();
  const location = useLocation();

  if (currentUserId === null) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/login" replace state={{ from }} />;
  }

  return <Outlet />;
}
