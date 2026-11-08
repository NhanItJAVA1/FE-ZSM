import { useQueryClient } from "@tanstack/react-query";
import { NavLink, useNavigate } from "react-router-dom";
import NavIcon, { type NavIconName } from "../components/ui/NavIcon.js";
import { ROUTES } from "../constants/routes.js";
import { authService } from "../services/api/authService.js";
import { useAppDispatch, useAppSelector } from "../stores/hook.js";
import { logout } from "../stores/slices/authSlice.js";

const NAV_ITEMS: Array<{
    to: string;
    label: string;
    icon: NavIconName;
    end?: boolean;
}> = [
    { to: ROUTES.todoList, label: "Todo list", icon: "todoList" },
    { to: ROUTES.admin, label: "Quản trị", icon: "admin" },
];

export default function SiteHeader() {
    const dispatch = useAppDispatch();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { user } = useAppSelector((state) => state.auth);

    async function handleLogout() {
        try {
            await authService.logout();
        } finally {
            dispatch(logout());
            queryClient.clear();
            navigate(ROUTES.login);
        }
    }

    const visibleNavItems = NAV_ITEMS;

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
