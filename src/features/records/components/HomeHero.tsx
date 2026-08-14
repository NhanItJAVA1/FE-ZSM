import { Link } from "react-router-dom";
import { ROUTES } from "../../../constants/routes.js";
import Skeleton from "../../../components/ui/Skeleton.js";

interface HomeHeroProps {
    recordCount?: number;
    isLoading?: boolean;
}

export default function HomeHero({
    recordCount = 0,
    isLoading = false,
}: HomeHeroProps) {
    return (
        <section className="hero-banner hero-banner--split hero-banner--video">
            <video
                className="hero-banner-video"
                src="/videos/background-video.mp4"
                autoPlay
                loop
                muted
                playsInline
                aria-hidden="true"
            />
            <div className="hero-banner-content">
                <p className="eyebrow">ZingSpeed Mobile</p>
                <h1>Video kỷ lục thời gian theo map</h1>
                <p className="hero-copy">
                    Lọc theo map, độ khó, xe đua và xem lap nhanh nhất từ cộng đồng.
                </p>
                <div className="hero-actions">
                    <Link to={ROUTES.submit} className="primary-link">
                        Đăng kỷ lục mới
                    </Link>
                </div>
            </div>

            <aside className="hero-banner-aside" aria-label="Thống kê nhanh">
                <div className="hero-stat-card">
                    <span className="hero-stat-label">Kỷ lục đã duyệt</span>
                    {isLoading ? (
                        <Skeleton className="skeleton-stat" />
                    ) : (
                        <strong className="hero-stat-value">{recordCount}</strong>
                    )}
                    <span className="hero-stat-hint">video công khai</span>
                </div>
                <div className="hero-stat-card hero-stat-card--muted">
                    <span className="hero-stat-label">Lọc theo</span>
                    <strong className="hero-stat-tags">Map · Rate · Xe</strong>
                </div>
            </aside>
        </section>
    );
}
