import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "../hooks/useLogin.js";
import {
    loginSchema,
    type LoginFormValues,
} from "../schemas/loginSchema.js";

export default function LoginForm() {
    const { login, error } = useLogin();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { username: "", password: "" },
    });

    return (
        <form
            onSubmit={handleSubmit(login)}
            className="login-form"
        >
            <label>
                Username
                <input
                    type="text"
                    placeholder="Nhập username"
                    autoComplete="username"
                    {...register("username")}
                />
                {errors.username && (
                    <span className="field-error">{errors.username.message}</span>
                )}
            </label>

            <label>
                Password
                <input
                    type="password"
                    placeholder="Nhập password"
                    autoComplete="current-password"
                    {...register("password")}
                />
                {errors.password && (
                    <span className="field-error">{errors.password.message}</span>
                )}
            </label>

            {error && <p className="form-error">{error}</p>}

            <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
        </form>
    );
}
