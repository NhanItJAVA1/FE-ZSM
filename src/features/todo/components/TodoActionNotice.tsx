import { X } from "lucide-react";

interface TodoActionNoticeProps {
    notice: { id: number; message: string } | null;
    onDismiss: () => void;
}

export default function TodoActionNotice({ notice, onDismiss }: TodoActionNoticeProps) {
    if (!notice) return null;

    return (
        <aside className="todo-action-notice" role="alert" aria-live="assertive">
            <div>
                <strong>Không thể hoàn tất thao tác</strong>
                <p>{notice.message}</p>
            </div>
            <button type="button" aria-label="Đóng thông báo" onClick={onDismiss}>
                <X size={16} />
            </button>
        </aside>
    );
}
