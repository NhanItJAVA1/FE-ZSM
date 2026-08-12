import { useState } from "react";
import LoginBrand from "../../features/auth/components/LoginBrand.js";
import LoginForm from "../../features/auth/components/LoginForm.js";
import RegisterForm from "../../features/auth/components/RegisterForm.js";

type AuthMode = "login" | "register";

export default function LoginPage() {
    const [mode, setMode] = useState<AuthMode>("login");

    return (
        <div className="login-page">
            <div className="login-card">
                <LoginBrand />
                <div className="auth-mode-tabs" aria-label="Chọn chức năng">
                    <button
                        type="button"
                        className={mode === "login" ? "active" : ""}
                        onClick={() => setMode("login")}
                    >
                        Đăng nhập
                    </button>
                    <button
                        type="button"
                        className={mode === "register" ? "active" : ""}
                        onClick={() => setMode("register")}
                    >
                        Đăng ký
                    </button>
                </div>

                {mode === "login" ? <LoginForm /> : <RegisterForm />}
            </div>
        </div>
    );
}
