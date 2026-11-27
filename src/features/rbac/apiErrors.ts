import { ApiError } from "../../services/api/apiError.js";

export { ApiError };

export function getApiErrorMessage(error: unknown, action: string, language: "vi" | "en" = "vi"): string {
    if (!(error instanceof ApiError)) {
        return error instanceof Error ? error.message : language === "en" ? `Unable to ${action}.` : `Không thể ${action}.`;
    }

    if (language === "en") {
        switch (error.status) {
            case 400:
                return `Invalid data: ${error.message}`;
            case 403:
                return "You do not have permission to perform this action.";
            case 404:
                return "This item no longer exists. Reload the list and try again.";
            case 409:
                return error.code === "LAST_ADMIN_PROTECTED"
                    ? "This action would remove the last RBAC administrator."
                    : error.code === "ROLE_IN_USE" || error.code === "ROLE_DELETE_CONFLICT"
                        ? "This Role cannot be deleted while it is assigned to Users or still has Permissions."
                        : `Data conflict: ${error.message}`;
            default:
                return error.message || `Unable to ${action}.`;
        }
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
                : error.code === "ROLE_IN_USE" || error.code === "ROLE_DELETE_CONFLICT"
                    ? "Không thể xóa Role vì đang được User sử dụng hoặc Role vẫn còn Permissions."
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
