import { useQueryClient } from "@tanstack/react-query";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
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
    { to: ROUTES.apps, label: "Chọn app", icon: "apps" },
    { to: ROUTES.home, label: "Trang chủ", icon: "home", end: true },
    { to: ROUTES.todo, label: "Todo timeline", icon: "todo", end: true },
    { to: ROUTES.todoList, label: "Todo list", icon: "todoList" },
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
    const queryClient = useQueryClient();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAppSelector((state) => state.auth);
    const isAdmin = useIsAdmin();
    const isTodoWorkspace =
        location.pathname === ROUTES.todo ||
        location.pathname === ROUTES.todoList;
    const isAppSelection = location.pathname === ROUTES.apps;

    function handleLogout() {
        dispatch(logout());
        queryClient.clear();
        navigate(ROUTES.login);
    }

    const visibleNavItems = NAV_ITEMS.filter((item) => {
        if (item.adminOnly && !isAdmin) return false;

        if (isTodoWorkspace) {
            return (
                item.to === ROUTES.apps ||
                item.to === ROUTES.todo ||
                item.to === ROUTES.todoList
            );
        }

        if (isAppSelection) {
            return item.to === ROUTES.apps;
        }

        return item.to !== ROUTES.todo && item.to !== ROUTES.todoList;
    });

    return (
        <header className="site-header">
            <div className="site-header-left">
                <Link
                    to={ROUTES.apps}
                    className="header-chip header-chip--brand brand brand--compact"
                    title="Chọn app"
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
                            <img
                                src="/animations/Pixel fire asset pack v1.2/Pixel Fire Asset Pack Colored/fire asset purple/Group 7 - 1/Group 7 - 1.gif"
                                alt=""
                                className="site-user-fire"
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
                <img
                    src="/animations/Pixel fire asset pack v1.2/Pixel Fire Asset Pack Colored/fire asset red/Group 5 - 1/Group 5 - 1.gif"
                    alt=""
                    className="site-header-fire"
                />
            </div>
        </header>
    );
}
