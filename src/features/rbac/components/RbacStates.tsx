import { useEffect } from "react";
import { X } from "lucide-react";
import { getApiErrorMessage, isApiStatus } from "../apiErrors.js";

export type RbacToastType = "success" | "error";

export interface RbacToastNotice {
    id: number;
    message: string;
    type: RbacToastType;
}

export function RbacToast({
    notice,
    onDismiss,
}: {
    notice: RbacToastNotice | null;
    onDismiss: () => void;
}) {
    useEffect(() => {
        if (!notice) return;
        const timeout = window.setTimeout(onDismiss, 4000);
        return () => window.clearTimeout(timeout);
    }, [notice, onDismiss]);

    if (!notice) return null;

    return (
        <aside
            className={`rbac-toast rbac-toast--${notice.type}`}
            role={notice.type === "success" ? "status" : "alert"}
            aria-live={notice.type === "success" ? "polite" : "assertive"}
        >
            <p>{notice.message}</p>
            <button type="button" aria-label="Đóng thông báo" onClick={onDismiss}>
                <X size={16} />
            </button>
        </aside>
    );
}

export function RbacError({ error, action }: { error: unknown; action: string }) {
    return (
        <div className="rbac-error" role="alert">
            <strong>{isApiStatus(error, 403) ? "Không đủ quyền" : "Không thể tải dữ liệu"}</strong>
            <p>{getApiErrorMessage(error, action)}</p>
        </div>
    );
}

export function RbacLoading() {
    return <p className="rbac-state" role="status">Đang tải dữ liệu…</p>;
}

export function RbacEmpty({ children }: { children: React.ReactNode }) {
    return <p className="rbac-state">{children}</p>;
}
