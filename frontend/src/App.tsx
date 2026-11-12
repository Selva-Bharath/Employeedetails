import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout';
import { LoginPage } from './pages/admin/LoginPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { LinksManagementPage } from './pages/admin/LinksManagementPage';
import { SubmissionsPage } from './pages/admin/SubmissionsPage';
import { EmployeeDetailPage } from './pages/admin/EmployeeDetailPage';
import { DocumentsPage } from './pages/admin/DocumentsPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { EmployeeRegisterPage } from './pages/employee/EmployeeRegisterPage';

// Protected Route Guard for HR
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('hr_token');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Employee Onboarding Route (Token Based) */}
        <Route path="/register/:token" element={<EmployeeRegisterPage />} />

        {/* HR Auth */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* HR Admin Protected Portal */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="links" element={<LinksManagementPage />} />
          <Route path="employees" element={<SubmissionsPage />} />
          <Route path="employees/:id" element={<EmployeeDetailPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Default Redirect to HR Login */}
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
