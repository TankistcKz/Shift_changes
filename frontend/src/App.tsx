import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Schedule from './pages/Schedule';
import Requests from './pages/Requests';
import History from './pages/History';
import People from './pages/People';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Schedule />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/history" element={<History />} />
        <Route path="/people" element={<People />} />
      </Route>
    </Routes>
  );
}