import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ROUTES } from "../constants/routes.js";
import GuestRoute from "../components/auth/GuestRoute.js";
import ProtectedRoute from "../components/auth/ProtectedRoute.js";
import SystemOwnerRoute from "../components/auth/SystemOwnerRoute.js";
import AdminPage from "../pages/admin/AdminPage.js";
import AdminRecoveryPage from "../pages/admin/AdminRecoveryPage.js";
import LoginPage from "../pages/auth/LoginPage.js";
import NotFoundPage from "../pages/notfound/NotFoundPage.js";
import TodoListPage from "../pages/todo/TodoListPage.js";

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path={ROUTES.home} element={<Navigate to={ROUTES.todoList} replace />} />
                <Route
                    path={ROUTES.login}
                    element={
                        <GuestRoute>
                            <LoginPage />
                        </GuestRoute>
                    }
                />

                <Route element={<ProtectedRoute />}>
                    <Route path={ROUTES.todoList} element={<TodoListPage />} />
                </Route>

                <Route element={<ProtectedRoute />}>
                    <Route path={ROUTES.admin} element={<AdminPage />} />
                    <Route element={<SystemOwnerRoute />}>
                        <Route path={ROUTES.adminRecovery} element={<AdminRecoveryPage />} />
                    </Route>
                </Route>

                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}
