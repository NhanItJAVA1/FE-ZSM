import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../constants/routes.js";
import { useAppDispatch } from "../stores/hook.js";
import { setAuth } from "../stores/slices/authSlice.js";
import { authService } from "../services/api/authService.js";
import type { LoginFormValues } from "../features/auth/schemas/loginSchema.js";

export function useLogin() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    async function login(values: LoginFormValues) {
        setError(null);

        try {
            const response = await authService.login(values);
            dispatch(setAuth(response.user));
            navigate(ROUTES.apps, { replace: true });
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

    return { login, error };
}
