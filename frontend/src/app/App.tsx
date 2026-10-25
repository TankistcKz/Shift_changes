import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './AppLayout';
import RequireAuth from './RequireAuth';
import HistoryPage from '../pages/history/HistoryPage';
import LoginPage from '../pages/login/LoginPage';
import PeoplePage from '../pages/people/PeoplePage';
import RequestsPage from '../pages/requests/RequestsPage';
import SchedulePage from '../pages/schedule/SchedulePage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<SchedulePage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
