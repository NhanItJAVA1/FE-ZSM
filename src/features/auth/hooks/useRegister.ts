import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../constants/routes.js";
import { useAppDispatch } from "../../../stores/hook.js";
import { setAuth } from "../../../stores/slices/authSlice.js";
import { authService } from "../services/authService.js";
import type { RegisterFormValues } from "../schemas/registerSchema.js";

export function useRegister() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    async function register(values: RegisterFormValues) {
        setError(null);

        try {
            await authService.register(values);
            const response = await authService.login({
                username: values.username,
                password: values.password,
            });
            dispatch(setAuth(response.user));
            navigate(ROUTES.home, { replace: true });
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Đăng ký thất bại";

            setError(message);
        }
    }

    return { register, error };
}
