import api from "./axios.js";
import type {
    AdminRecoveryUser,
    AdminRecoveryUserPage,
    SearchAdminRecoveryUsersParams,
} from "../../features/adminRecovery/types.js";

function mapSearchResponse(response: unknown): AdminRecoveryUserPage {
    if (typeof response !== "object" || response === null) {
        throw new Error("Phản hồi tìm kiếm User không đúng định dạng.");
    }

    const page = response as Record<string, unknown>;
    if (
        !Array.isArray(page.items) ||
        !Number.isInteger(page.page) ||
        !Number.isInteger(page.pageSize) ||
        !Number.isInteger(page.totalItems) ||
        !Number.isInteger(page.totalPages)
    ) {
        throw new Error("Phản hồi tìm kiếm User không đúng định dạng phân trang.");
    }

    const items = page.items.map((value): AdminRecoveryUser => {
        if (typeof value !== "object" || value === null) {
            throw new Error("Phản hồi tìm kiếm User chứa dữ liệu không hợp lệ.");
        }

        const user = value as Record<string, unknown>;
        if (
            typeof user.id !== "number" ||
            typeof user.displayName !== "string" ||
            typeof user.email !== "string"
        ) {
            throw new Error("Phản hồi tìm kiếm User thiếu trường bắt buộc.");
        }

        return { id: user.id, displayName: user.displayName, email: user.email };
    });

    return {
        items,
        page: page.page as number,
        pageSize: page.pageSize as number,
        totalItems: page.totalItems as number,
        totalPages: page.totalPages as number,
    };
}

export const adminRecoveryService = {
    async searchRecoveryUsers(params: SearchAdminRecoveryUsersParams): Promise<AdminRecoveryUserPage> {
        // Keep backend pagination response mapping isolated here for contract changes.
        const response = await api.get<unknown>("/admin-recovery/users", { params });
        return mapSearchResponse(response.data);
    },

    async restoreAdminAccess(userId: number, reason: string): Promise<void> {
        // The API returns 204 No Content; intentionally do not read a response body.
        await api.post("/admin-recovery/restore", { userId, reason });
    },
};
