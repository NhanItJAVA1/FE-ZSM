import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ROUTES } from "../constants/routes.js";
import GuestRoute from "../components/auth/GuestRoute.js";
import ProtectedRoute from "../components/auth/ProtectedRoute.js";
import AdminPage from "../pages/admin/AdminPage.js";
import AppSelectionPage from "../pages/apps/AppSelectionPage.js";
import LoginPage from "../pages/auth/LoginPage.js";
import HomePage from "../pages/home/HomePage.js";
import NotFoundPage from "../pages/notfound/NotFoundPage.js";
import SubmitRecordPage from "../pages/submit/SubmitRecordPage.js";
import MyRecordsPage from "../pages/records/MyRecordsPage.js";
import TodoListPage from "../pages/todo/TodoListPage.js";

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path={ROUTES.login}
                    element={
                        <GuestRoute>
                            <LoginPage />
                        </GuestRoute>
                    }
                />

                <Route element={<ProtectedRoute />}>
                    <Route path={ROUTES.apps} element={<AppSelectionPage />} />
                    <Route path={ROUTES.home} element={<HomePage />} />
                    <Route path={ROUTES.todoList} element={<TodoListPage />} />
                    <Route path={ROUTES.submit} element={<SubmitRecordPage />} />
                    <Route path={ROUTES.myRecords} element={<MyRecordsPage />} />
                </Route>

                <Route element={<ProtectedRoute requireAdmin />}>
                    <Route path={ROUTES.admin} element={<AdminPage />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}
