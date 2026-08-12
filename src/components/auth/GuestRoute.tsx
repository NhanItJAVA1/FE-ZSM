import { Navigate } from "react-router-dom";
import { ROUTES } from "../../constants/routes.js";
import { useAppSelector } from "../../stores/hook.js";

interface GuestRouteProps {
    children: React.ReactNode;
}

export default function GuestRoute({ children }: GuestRouteProps) {
    const { isAuthenticated } = useAppSelector((state) => state.auth);

    if (isAuthenticated) {
        return <Navigate to={ROUTES.home} replace />;
    }

    return children;
}
