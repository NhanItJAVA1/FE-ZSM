import { getApiErrorMessage, isApiStatus } from "../apiErrors.js";

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
