import { Navigate } from "react-router-dom";
import { ROUTES } from "../../constants/routes.js";
import { useAppSelector } from "../../stores/hook.js";

interface GuestRouteProps {
    children: React.ReactNode;
}

export default function GuestRoute({ children }: GuestRouteProps) {
    const { isAuthenticated, status } = useAppSelector((state) => state.auth);

    if (status === "checking") {
        return null;
    }

    if (isAuthenticated) {
        return <Navigate to={ROUTES.apps} replace />;
    }

    return children;
}
