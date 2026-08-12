import { ROUTES } from "../constants/routes.js";
import { isAdminRole } from "../constants/roles.js";
import { useAppSelector } from "../stores/hook.js";

export function useRequireAdmin() {
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);

    if (!isAuthenticated) {
        return { allowed: false, redirectTo: ROUTES.login };
    }

    if (!isAdminRole(user?.role)) {
        return { allowed: false, redirectTo: ROUTES.home };
    }

    return { allowed: true, redirectTo: null };
}
