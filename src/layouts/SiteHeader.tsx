import { Link, NavLink, useNavigate } from "react-router-dom";
import { ROUTES } from "../constants/routes.js";
import { useIsAdmin } from "../hooks/useIsAdmin.js";
import { useAppDispatch, useAppSelector } from "../stores/hook.js";
import { logout } from "../stores/slices/authSlice.js";

export default function SiteHeader() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { user } = useAppSelector((state) => state.auth);
    const isAdmin = useIsAdmin();

    function handleLogout() {
        dispatch(logout());
        navigate(ROUTES.login);
    }

    return (
        <header className="site-header">
            <Link to={ROUTES.home} className="brand">
                <span className="brand-mark">ZSM</span>
                <span>
                    <strong>ZingSpeed Records</strong>
                    <small>Kho video kỷ lục Mobile</small>
                </span>
            </Link>

            <nav className="site-nav">
                <NavLink to={ROUTES.home} end>
                    Trang chủ
                </NavLink>
                <NavLink to={ROUTES.submit}>Đăng kỷ lục</NavLink>
                {isAdmin && <NavLink to={ROUTES.admin}>Kiểm duyệt</NavLink>}
            </nav>

            <div className="site-user">
                {user && (
                    <>
                        <span>{user.displayName || user.username}</span>
                        <button type="button" className="ghost-btn" onClick={handleLogout}>
                            Đăng xuất
                        </button>
                    </>
                )}
            </div>
        </header>
    );
}
