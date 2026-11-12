import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "../../constants/routes.js";
import { useAppSelector } from "../../stores/hook.js";

export default function SystemOwnerRoute() {
    const user = useAppSelector((state) => state.auth.user);

    if (!user?.isSystemOwner) {
        return <Navigate to={ROUTES.todoList} replace />;
    }

    return <Outlet />;
}
