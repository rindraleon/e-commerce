import { Navigate, Outlet } from 'react-router-dom';
import PageState from '@/components/common/PageState';
import { useAuth } from '@/hooks/useAuth';

export default function AdminRoute() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <PageState type="loading" title="Chargement..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
