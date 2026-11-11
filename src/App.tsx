import { useEffect } from "react";
import AppRoutes from "./routes/index.js";
import ParticleBurstLayer from "./components/ui/ParticleBurstLayer.js";
import { authService } from "./services/api/authService.js";
import { useAppDispatch, useAppSelector } from "./stores/hook.js";
import {
    setAuth,
    setUnauthenticated,
    syncAuthFromStorage,
    syncUnauthenticatedFromStorage,
} from "./stores/slices/authSlice.js";
import { USER_STORAGE_KEY, userStorage } from "./services/storage/user.js";

let authBootstrapPromise: Promise<void> | null = null;
const AUTH_REFRESH_COOLDOWN_KEY = "auth_session_refresh_at";
const AUTH_REFRESH_COOLDOWN_MS = 5_000;

export default function App() {
    const dispatch = useAppDispatch();
    const authStatus = useAppSelector((state) => state.auth.status);

    useEffect(() => {
        if (authStatus === "unauthenticated") {
            return;
        }

        const now = Date.now();
        const lastRefresh = Number(localStorage.getItem(AUTH_REFRESH_COOLDOWN_KEY));
        if (Number.isFinite(lastRefresh) && now - lastRefresh < AUTH_REFRESH_COOLDOWN_MS) {
            const cachedUser = userStorage.get();
            if (cachedUser) {
                dispatch(authStatus === "checking" ? setAuth(cachedUser) : syncAuthFromStorage(cachedUser));
            }
            return;
        }

        localStorage.setItem(AUTH_REFRESH_COOLDOWN_KEY, String(now));
        authBootstrapPromise ??= authService
            .refreshSession()
            .then((user) => {
                dispatch(setAuth(user));
            })
            .catch(() => {
                if (authStatus === "checking") {
                    dispatch(setUnauthenticated());
                }
            })
            .finally(() => {
                authBootstrapPromise = null;
            });
    }, []);

    useEffect(() => {
        function syncUserAcrossTabs(event: StorageEvent) {
            if (event.key !== USER_STORAGE_KEY) {
                return;
            }

            const updatedUser = userStorage.get();
            dispatch(updatedUser ? syncAuthFromStorage(updatedUser) : syncUnauthenticatedFromStorage());
        }

        window.addEventListener("storage", syncUserAcrossTabs);
        return () => window.removeEventListener("storage", syncUserAcrossTabs);
    }, [dispatch]);

    return (
        <>
            <ParticleBurstLayer />
            <AppRoutes />
        </>
    );
}
