import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "../constants/routes.js";
import { useAppDispatch } from "../stores/hook.js";
import { setAuth } from "../stores/slices/authSlice.js";
import { authService } from "../services/api/authService.js";
import type { LoginFormValues } from "../features/auth/schemas/loginSchema.js";

export function useLogin() {
    const dispatch = useAppDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const redirectTo = getRedirectTarget(location.state);

    async function login(values: LoginFormValues) {
        setError(null);

        try {
            const response = await authService.login(values);
            dispatch(setAuth(response.user));
            navigate(redirectTo, { replace: true });
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Đăng nhập thất bại";

            setError(
                message.includes("401") || message.toLowerCase().includes("invalid")
                    ? "Sai username hoặc password"
                    : message
            );
        }
    }

    async function loginWithGoogle(idToken: string) {
        setError(null);

        if (!idToken) {
            setError("Không nhận được credential từ Google.");
            return;
        }

        try {
            const response = await authService.loginWithGoogle({
                provider: "Google",
                token: idToken,
            });
            dispatch(setAuth(response.user));
            navigate(redirectTo, { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Đăng nhập Google thất bại");
        }
    }

    return { login, loginWithGoogle, error };
}

function getRedirectTarget(state: unknown) {
    if (
        typeof state === "object" &&
        state !== null &&
        "from" in state &&
        typeof state.from === "string" &&
        state.from.startsWith("/")
    ) {
        return state.from;
    }

    return ROUTES.apps;
}
