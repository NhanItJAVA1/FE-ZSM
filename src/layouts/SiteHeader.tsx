import { useQueryClient } from "@tanstack/react-query";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import NavIcon, { type NavIconName } from "../components/ui/NavIcon.js";
import { ROUTES } from "../constants/routes.js";
import { useIsAdmin } from "../hooks/useIsAdmin.js";
import { authService } from "../services/api/authService.js";
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
    { to: ROUTES.todoList, label: "Todo list", icon: "todoList" },
    { to: ROUTES.submit, label: "Đăng kỷ lục", icon: "submit" },
    { to: ROUTES.myRecords, label: "Kỷ lục của tôi", icon: "records" },
    { to: ROUTES.admin, label: "Kiểm duyệt", icon: "admin", adminOnly: true },
];

export default function SiteHeader() {
    const dispatch = useAppDispatch();
    const queryClient = useQueryClient();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAppSelector((state) => state.auth);
    const isAdmin = useIsAdmin();
    const isTodoWorkspace = location.pathname === ROUTES.todoList;
    const isAppSelection = location.pathname === ROUTES.apps;

    async function handleLogout() {
        try {
            await authService.logout();
        } finally {
            dispatch(logout());
            queryClient.clear();
            navigate(ROUTES.login);
        }
    }

    const visibleNavItems = NAV_ITEMS.filter((item) => {
        if (item.adminOnly && !isAdmin) return false;

        if (isTodoWorkspace) {
            return (
                item.to === ROUTES.apps ||
                item.to === ROUTES.todoList
            );
        }

        if (isAppSelection) {
            return item.to === ROUTES.apps;
        }

        return item.to !== ROUTES.todoList;
    });

    return (
        <header className="site-header">
            <div className="site-header-left site-header-rail">
                <nav
                    className="site-nav site-nav--icons"
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
                    <button
                        type="button"
                        className="site-nav-icon-btn site-nav-icon-btn--logout"
                        onClick={handleLogout}
                        title="Đăng xuất"
                    >
                        <NavIcon name="logout" className="site-nav-icon" />
                        <span className="sr-only">Đăng xuất</span>
                    </button>
                )}
            </div>

        </header>
    );
}
