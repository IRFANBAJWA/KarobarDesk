import { Navigate, Route, Routes } from 'react-router-dom';

import AppLayout from '@/layouts/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import ProtectedRoute from '@/routes/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}