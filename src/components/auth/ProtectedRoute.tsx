import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ROUTES } from "../../constants/routes.js";
import { useRequireAdmin } from "../../hooks/useRequireAdmin.js";
import { useAppSelector } from "../../stores/hook.js";

interface ProtectedRouteProps {
    requireAdmin?: boolean;
}

export default function ProtectedRoute({ requireAdmin = false }: ProtectedRouteProps) {
    const { isAuthenticated, status } = useAppSelector((state) => state.auth);
    const location = useLocation();
    const adminCheck = useRequireAdmin();

    if (status === "checking") {
        return null;
    }

    if (!isAuthenticated) {
        return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
    }

    if (requireAdmin && !adminCheck.allowed) {
        return <Navigate to={adminCheck.redirectTo ?? ROUTES.home} replace />;
    }

    return <Outlet />;
}
