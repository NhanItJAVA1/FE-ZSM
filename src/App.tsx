import { useEffect } from "react";
import AppRoutes from "./routes/index.js";
import ParticleBurstLayer from "./components/ui/ParticleBurstLayer.js";
import { authService } from "./services/api/authService.js";
import { useAppDispatch, useAppSelector } from "./stores/hook.js";
import { setAuth, setUnauthenticated } from "./stores/slices/authSlice.js";

let authBootstrapPromise: Promise<void> | null = null;

export default function App() {
    const dispatch = useAppDispatch();
    const authStatus = useAppSelector((state) => state.auth.status);

    useEffect(() => {
        if (authStatus !== "checking") {
            return;
        }

        authBootstrapPromise ??= authService
            .refreshSession()
            .then((user) => {
                dispatch(setAuth(user));
            })
            .catch(() => {
                dispatch(setUnauthenticated());
            });
    }, [authStatus, dispatch]);

    return (
        <>
            <ParticleBurstLayer />
            <AppRoutes />
        </>
    );
}
