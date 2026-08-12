import { Link } from "react-router-dom";
import { ROUTES } from "../../constants/routes.js";

export default function NotFoundPage() {
    return (
        <div className="login-page">
            <div className="login-card">
                <h1>404</h1>
                <p>Trang bạn tìm không tồn tại.</p>
                <Link to={ROUTES.home} className="primary-link">
                    Về trang chủ
                </Link>
            </div>
        </div>
    );
}
