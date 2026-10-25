import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppData } from './providers/AppDataProvider';
import { useSession } from './providers/SessionProvider';

export default function RequireAuth() {
  const { currentUserId, logout } = useSession();
  const { persons, loading, error } = useAppData();
  const location = useLocation();

  const isUnknownUser =
    currentUserId !== null &&
    !loading &&
    !error &&
    !persons.some((person) => person.id === currentUserId);

  useEffect(() => {
    if (isUnknownUser) {
      logout();
    }
  }, [isUnknownUser, logout]);

  if (currentUserId === null || isUnknownUser) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/login" replace state={{ from }} />;
  }

  return <Outlet />;
}
