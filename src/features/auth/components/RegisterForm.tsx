import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegister } from "../../../hooks/useRegister.js";
import {
    registerSchema,
    type RegisterFormValues,
} from "../schemas/registerSchema.js";

export default function RegisterForm() {
    const { register: submitRegister, error } = useRegister();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            username: "",
            email: "",
            password: "",
            displayName: "",
            avatarUrl: "",
        },
    });

    return (
        <form
            onSubmit={handleSubmit(submitRegister)}
            className="login-form"
        >
            <label>
                Username
                <input
                    type="text"
                    placeholder="Chọn username"
                    autoComplete="username"
                    {...register("username")}
                />
                {errors.username && (
                    <span className="field-error">{errors.username.message}</span>
                )}
            </label>

            <label>
                Email
                <input
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    {...register("email")}
                />
                {errors.email && (
                    <span className="field-error">{errors.email.message}</span>
                )}
            </label>

            <label>
                Password
                <input
                    type="password"
                    placeholder="Tạo password"
                    autoComplete="new-password"
                    {...register("password")}
                />
                {errors.password && (
                    <span className="field-error">{errors.password.message}</span>
                )}
            </label>

            <label>
                Tên hiển thị
                <input
                    type="text"
                    placeholder="Tên hiển thị trong bảng xếp hạng"
                    autoComplete="name"
                    {...register("displayName")}
                />
                {errors.displayName && (
                    <span className="field-error">{errors.displayName.message}</span>
                )}
            </label>

            <label>
                Avatar URL
                <input
                    type="url"
                    placeholder="https://..."
                    autoComplete="url"
                    {...register("avatarUrl")}
                />
                {errors.avatarUrl && (
                    <span className="field-error">{errors.avatarUrl.message}</span>
                )}
            </label>

            {error && <p className="form-error">{error}</p>}

            <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang đăng ký..." : "Đăng ký"}
            </button>
        </form>
    );
}
