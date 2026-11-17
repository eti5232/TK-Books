import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loading } from '../components/ui';
import { useAuth } from '../context/AuthContext';

/** עוטף את אזור המנהלת: בלי התחברות מעביר ל-/admin/login */
export default function ProtectedRoute() {
  const { admin, loading } = useAuth();
  const loc = useLocation();
  if (loading) {
    return (
      <div className="container section">
        <Loading />
      </div>
    );
  }
  if (!admin) return <Navigate to="/admin/login" replace state={{ from: loc.pathname }} />;
  return <Outlet />;
}
