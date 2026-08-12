import { Link } from "react-router-dom";
import { ROUTES } from "../../../constants/routes.js";

export default function HomeHero() {
    return (
        <section className="hero-banner">
            <div>
                <p className="eyebrow">ZingSpeed Mobile</p>
                <h1>Video kỷ lục thời gian theo map</h1>
                <p className="hero-copy">
                    Lọc theo map, độ khó, xe đua và xem lap nhanh nhất từ cộng đồng.
                </p>
            </div>
            <Link to={ROUTES.submit} className="primary-link">
                + Đăng kỷ lục mới
            </Link>
        </section>
    );
}
