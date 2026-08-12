import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "../../features/auth/types.js";
import { tokenStorage } from "../../services/storage/token.js";
import { userStorage } from "../../services/storage/user.js";

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
}

const storedUser = userStorage.get();
const storedToken = tokenStorage.get();

const initialState: AuthState = {
    user: storedUser,
    isAuthenticated: Boolean(storedUser && storedToken),
};

const authSlice = createSlice({
    name: "auth",
    initialState,

    reducers: {
        setAuth: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            state.isAuthenticated = true;
            userStorage.set(action.payload);
        },

        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            tokenStorage.remove();
            userStorage.remove();
        },
    },
});

export const { setAuth, logout } = authSlice.actions;

export default authSlice.reducer;
