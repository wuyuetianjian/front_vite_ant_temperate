import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

interface Props {
  operation: string
  children: React.ReactNode
}

export default function PermissionRoute({ operation, children }: Props) {
  const hasPermission = useAuthStore((s) => s.hasPermission)
  return hasPermission(operation) ? <>{children}</> : <Navigate to="/403" replace />
}
