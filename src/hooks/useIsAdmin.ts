import { useAppSelector } from "../stores/hook.js";
import { isAdminRole } from "../constants/roles.js";

export function useIsAdmin() {
    const { user } = useAppSelector((state) => state.auth);

    return isAdminRole(user?.role);
}
