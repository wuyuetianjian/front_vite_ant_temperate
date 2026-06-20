import { createBrowserRouter, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import PermissionRoute from './components/PermissionRoute'
import BiDashboardPage from './pages/BiDashboardPage'
import LoginPage from './pages/LoginPage'
import SetupPage from './pages/SetupPage'
import AdminLayout from './pages/admin/AdminLayout'
import DashboardPage from './pages/admin/DashboardPage'
import UsersPage from './pages/admin/UsersPage'
import RolesPage from './pages/admin/RolesPage'
import PermissionsPage from './pages/admin/PermissionsPage'
import SSOPage from './pages/admin/SSOPage'
import ProfilePage from './pages/admin/ProfilePage'

const SVC = '/temperate.v1.TemperateService'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
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
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
  { path: '/', element: <BiDashboardPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
])
