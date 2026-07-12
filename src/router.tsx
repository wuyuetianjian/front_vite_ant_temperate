import { createBrowserRouter, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import PermissionRoute from './components/PermissionRoute'
import BiDashboardPage from './pages/BiDashboardPage'
import LoginPage from './pages/LoginPage'
import ForbiddenPage from './pages/ForbiddenPage'
import SetupPage from './pages/SetupPage'
import AdminLayout from './pages/admin/AdminLayout'
import DashboardPage from './pages/admin/DashboardPage'
import UsersPage from './pages/admin/UsersPage'
import RolesPage from './pages/admin/RolesPage'
import PermissionsPage from './pages/admin/PermissionsPage'
import SSOPage from './pages/admin/SSOPage'
import ProfilePage from './pages/admin/ProfilePage'
import SessionsPage from './pages/admin/SessionsPage'
import AuditLogsPage from './pages/admin/AuditLogsPage'
import SettingsPage from './pages/admin/SettingsPage'
import ServiceAccountsPage from './pages/admin/ServiceAccountsPage'

const SVC = '/temperate.v1.TemperateService'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/403', element: <ForbiddenPage /> },
  { path: '/setup', element: <SetupPage /> },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      {
        path: 'users',
        element: (
          <PermissionRoute operation={`${SVC}/ListUsers`}>
            <UsersPage />
          </PermissionRoute>
        ),
      },
      {
        path: 'roles',
        element: (
          <PermissionRoute operation={`${SVC}/ListRoles`}>
            <RolesPage />
          </PermissionRoute>
        ),
      },
      {
        path: 'permissions',
        element: (
          <PermissionRoute operation={`${SVC}/ListPermissions`}>
            <PermissionsPage />
          </PermissionRoute>
        ),
      },
      {
        path: 'sso',
        element: (
          <PermissionRoute operation={`${SVC}/ListSSOProviders`}>
            <SSOPage />
          </PermissionRoute>
        ),
      },
      {
        path: 'sessions',
        element: (
          <PermissionRoute operation={`${SVC}/ListSessions`}>
            <SessionsPage />
          </PermissionRoute>
        ),
      },
      {
        path: 'audit-logs',
        element: (
          <PermissionRoute operation={`${SVC}/ListAuditLogs`}>
            <AuditLogsPage />
          </PermissionRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <PermissionRoute operation={`${SVC}/GetSystemSettings`}>
            <SettingsPage />
          </PermissionRoute>
        ),
      },
      {
        path: 'service-accounts',
        element: (
          <PermissionRoute operation={`${SVC}/ListServiceAccounts`}>
            <ServiceAccountsPage />
          </PermissionRoute>
        ),
      },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
  { path: '/', element: <BiDashboardPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
])
