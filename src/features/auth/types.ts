import type { UserRole } from "../../constants/roles.js";

export interface User {
    id: number;
    username: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    role: UserRole;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    displayName: string;
    avatarUrl: string;
}

export interface LoginResponse {
    message: string;
    accessToken: string;
    refreshToken: string;
    user: User;
}
