import { Link, NavLink, useNavigate } from "react-router-dom";
import PixelAnimation from "../components/animate/PixelAnimation.js";
import { INDIVIDUAL_SPRITE_FRAMES } from "../components/animate/individualSpriteFrames.js";
import NavIcon, { type NavIconName } from "../components/ui/NavIcon.js";
import { ROUTES } from "../constants/routes.js";
import { useIsAdmin } from "../hooks/useIsAdmin.js";
import { useAppDispatch, useAppSelector } from "../stores/hook.js";
import { logout } from "../stores/slices/authSlice.js";

const NAV_ITEMS: Array<{
    to: string;
    label: string;
    icon: NavIconName;
    end?: boolean;
    adminOnly?: boolean;
}> = [
    { to: ROUTES.home, label: "Trang chủ", icon: "home", end: true },
    { to: ROUTES.submit, label: "Đăng kỷ lục", icon: "submit" },
    { to: ROUTES.myRecords, label: "Kỷ lục của tôi", icon: "records" },
    { to: ROUTES.admin, label: "Kiểm duyệt", icon: "admin", adminOnly: true },
];

function getUserInitials(displayName: string, username: string): string {
    const source = displayName.trim() || username.trim();
    const parts = source.split(/\s+/).filter(Boolean);

    const firstChar = parts[0]?.[0] ?? "";
    const secondChar = parts[1]?.[0] ?? "";

    if (firstChar && secondChar) {
        return `${firstChar}${secondChar}`.toUpperCase();
    }

    return source.slice(0, 2).toUpperCase();
}

export default function SiteHeader() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { user } = useAppSelector((state) => state.auth);
    const isAdmin = useIsAdmin();

    function handleLogout() {
        dispatch(logout());
        navigate(ROUTES.login);
    }

    const visibleNavItems = NAV_ITEMS.filter(
        (item) => !item.adminOnly || isAdmin
    );

    return (
        <header className="site-header">
            <div className="site-header-left">
                <Link
                    to={ROUTES.home}
                    className="header-chip header-chip--brand brand brand--compact"
                    title="ZingSpeed Records"
                >
                    <span className="brand-mark">ZSM</span>
                </Link>

                <nav
                    className="header-chip header-chip--nav site-nav site-nav--icons"
                    aria-label="Điều hướng chính"
                >
                    {visibleNavItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end ?? false}
                            className="site-nav-icon-btn"
                            title={item.label}
                        >
                            <NavIcon name={item.icon} className="site-nav-icon" />
                            <span className="sr-only">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {user && (
                    <div className="header-chip header-chip--user site-user site-user--compact">
                        {user.avatarUrl ? (
                            <img
                                src={user.avatarUrl}
                                alt=""
                                className="site-user-avatar"
                                loading="lazy"
                            />
                        ) : (
                            <span
                                className="site-user-avatar site-user-avatar--fallback"
                                title={user.displayName || user.username}
                            >
                                {getUserInitials(
                                    user.displayName,
                                    user.username
                                )}
                            </span>
                        )}
                        <div className="site-header-animation site-header-animation--before-logout">
                            <PixelAnimation
                                frames={INDIVIDUAL_SPRITE_FRAMES}
                                intervalMs={80}
                                className="h-[40px] w-auto object-contain"
                            />
                        </div>
                        <button
                            type="button"
                            className="site-nav-icon-btn"
                            onClick={handleLogout}
                            title="Đăng xuất"
                        >
                            <NavIcon name="logout" className="site-nav-icon" />
                            <span className="sr-only">Đăng xuất</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="site-header-right">
                <PixelAnimation folder="jump" frameCount={11} intervalMs={90} />
                <PixelAnimation folder="Run" frameCount={8} intervalMs={100} />
                <PixelAnimation folder="Spell" frameCount={10} intervalMs={110} />
            </div>
        </header>
    );
}
