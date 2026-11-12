export interface AdminRecoveryUser {
    id: number;
    displayName: string;
    email: string;
}

export interface AdminRecoveryUserPage {
    items: AdminRecoveryUser[];
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

export interface SearchAdminRecoveryUsersParams {
    search: string;
    page: number;
    pageSize: number;
}
