import { Link } from "react-router-dom";
import { ROUTES } from "../../constants/routes.js";
import { useAppSelector } from "../../stores/hook.js";

export default function AppSelectionPage() {
    const { user } = useAppSelector((state) => state.auth);
    const displayName = user?.displayName || user?.username || "Player";

    return (
        <main className="app-select-page">
            <section className="app-select-hero" aria-labelledby="workspace-title">
                <div className="app-select-copy">
                    <p className="eyebrow">Workspace switcher</p>
                    <h1 id="workspace-title">Chọn không gian làm việc</h1>
                    <p>
                        Xin chào {displayName}. Vào ZSM như trước hoặc mở Todo để quản lý task theo danh sách.
                    </p>
                </div>

                <div className="app-select-grid">
                    <Link to={ROUTES.home} className="app-choice app-choice--zsm">
                        <span className="app-choice-kicker">01</span>
                        <strong>ZSM</strong>
                        <small>Kỷ lục, xe, map và kiểm duyệt gameplay.</small>
                        <span className="app-choice-action">Vào ZSM</span>
                    </Link>

                    <Link to={ROUTES.todoList} className="app-choice app-choice--todo">
                        <span className="app-choice-kicker">02</span>
                        <strong>Todo</strong>
                        <small>Task, category và deadline trong một bảng chỉnh sửa nhanh.</small>
                        <span className="app-choice-action">Mở Todo</span>
                    </Link>
                </div>
            </section>
        </main>
    );
}
