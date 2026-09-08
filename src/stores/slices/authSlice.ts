import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "../../features/auth/types.js";
import { tokenStorage } from "../../services/storage/token.js";
import { userStorage } from "../../services/storage/user.js";

export interface AuthState {
    user: User | null;
    status: "checking" | "authenticated" | "unauthenticated";
    isAuthenticated: boolean;
}

const storedUser = userStorage.get();
const storedToken = tokenStorage.get();
const hasUsableStoredSession =
    Boolean(storedUser && storedToken) && tokenStorage.hasUsableAccessToken();
const wasLoggedOut = tokenStorage.wasLoggedOut();

const initialState: AuthState = {
    user: hasUsableStoredSession ? storedUser : null,
    status: wasLoggedOut
        ? "unauthenticated"
        : hasUsableStoredSession
            ? "authenticated"
            : "checking",
    isAuthenticated: hasUsableStoredSession,
};

const authSlice = createSlice({
    name: "auth",
    initialState,

    reducers: {
        setAuth: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            state.status = "authenticated";
            state.isAuthenticated = true;
            userStorage.set(action.payload);
        },

        logout: (state) => {
            state.user = null;
            state.status = "unauthenticated";
            state.isAuthenticated = false;
            tokenStorage.remove();
            tokenStorage.markLoggedOut();
            userStorage.remove();
        },

        setUnauthenticated: (state) => {
            state.user = null;
            state.status = "unauthenticated";
            state.isAuthenticated = false;
            tokenStorage.remove();
            userStorage.remove();
        },
    },
});

export const { setAuth, logout, setUnauthenticated } = authSlice.actions;

export default authSlice.reducer;
