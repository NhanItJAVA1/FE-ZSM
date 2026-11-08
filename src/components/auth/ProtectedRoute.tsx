import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ROUTES } from "../../constants/routes.js";
import { useAppSelector } from "../../stores/hook.js";

export default function ProtectedRoute() {
    const { isAuthenticated, status } = useAppSelector((state) => state.auth);
    const location = useLocation();

    if (status === "checking") {
        return null;
    }

    if (!isAuthenticated) {
        return (
            <Navigate
                to={ROUTES.login}
                replace
                state={{
                    from: `${location.pathname}${location.search}${location.hash}`,
                }}
            />
        );
    }

    return <Outlet />;
}
