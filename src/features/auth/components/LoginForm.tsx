import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GoogleLogin } from "@react-oauth/google";
import { useLogin } from "../../../hooks/useLogin.js";
import {
    loginSchema,
    type LoginFormValues,
} from "../schemas/loginSchema.js";

export default function LoginForm() {
    const { login, loginWithGoogle, error } = useLogin();

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

            <div className="login-divider" aria-hidden="true">
                <span />
                <p>hoặc</p>
                <span />
            </div>

            <div className="google-login-wrap">
                <GoogleLogin
                    onSuccess={(credentialResponse) => {
                        if (!credentialResponse.credential) return;
                        void loginWithGoogle(credentialResponse.credential);
                    }}
                    onError={() => {
                        void loginWithGoogle("");
                    }}
                    text="signin_with"
                    shape="rectangular"
                    width="100%"
                />
            </div>
        </form>
    );
}
