import { ApiError } from "../../services/api/apiError.js";

export { ApiError };

export function getApiErrorMessage(error: unknown, action: string): string {
    if (!(error instanceof ApiError)) {
        return error instanceof Error ? error.message : `Không thể ${action}.`;
    }

    switch (error.status) {
        case 400:
            return `Dữ liệu không hợp lệ: ${error.message}`;
        case 403:
            return "Tài khoản hiện tại không có quyền thực hiện thao tác này.";
        case 404:
            return "Dữ liệu không còn tồn tại. Hãy tải lại danh sách rồi thử lại.";
        case 409:
            return error.code === "LAST_ADMIN_PROTECTED"
                ? "Không thể hoàn tất: thao tác sẽ loại bỏ RBAC administrator cuối cùng."
                : `Xung đột dữ liệu: ${error.message}`;
        default:
            return error.message || `Không thể ${action}.`;
    }
}

export function isApiStatus(error: unknown, status: number): boolean {
    return error instanceof ApiError && error.status === status;
}

export function getApiErrorCode(error: unknown): string | undefined {
    return error instanceof ApiError ? error.code : undefined;
}
