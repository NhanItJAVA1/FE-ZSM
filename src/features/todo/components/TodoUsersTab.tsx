import { ApiError } from "../../../services/api/apiError.js";
import type { TodoUserSummaryDto } from "../types.js";
import TodoPagination from "./TodoPagination.js";
import type { TodoPanelActions } from "./todoPanelTypes.js";

interface TodoUsersTabProps {
    users: TodoUserSummaryDto[];
    loading: boolean;
    fetching: boolean;
    error: unknown;
    page: number;
    totalPages: number;
    search: string;
    onSearchChange: (value: string) => void;
    onSetPage: TodoPanelActions["onSetPage"];
    onSelectUser: (user: TodoUserSummaryDto) => void;
    onRetry: () => void;
}

function getErrorMessage(error: unknown) {
    if (error instanceof ApiError) {
        if (error.status === 401) return "Your session has expired. Please sign in again.";
        if (error.status === 403) return "You do not have permission to view all users' todos.";
        return error.message || "Could not load users. Please try again.";
    }

    return error instanceof Error ? error.message : "Could not load users. Please try again.";
}

export default function TodoUsersTab({
    users,
    loading,
    fetching,
    error,
    page,
    totalPages,
    search,
    onSearchChange,
    onSetPage,
    onSelectUser,
    onRetry,
}: TodoUsersTabProps) {
    return (
        <section className="todo-users-panel">
            <div className="todo-users-toolbar todo-view-context">
                <div>
                    <p className="eyebrow">Todos</p>
                    <h2>Users</h2>
                </div>
                <label>
                    Search users
                    <input
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="Name, email, or User ID"
                        autoComplete="off"
                    />
                </label>
            </div>

            {loading && <div className="empty-state" role="status">Loading users…</div>}
            {!loading && Boolean(error) && (
                <div className="empty-state todo-users-error" role="alert">
                    <p>{getErrorMessage(error)}</p>
                    <button type="button" className="ghost-btn" onClick={onRetry}>Retry</button>
                </div>
            )}
            {!loading && !error && users.length === 0 && (
                <div className="empty-state">No users found.</div>
            )}
            {!loading && !error && users.length > 0 && (
                <div className="todo-users-table-wrap" aria-busy={fetching}>
                    <table className="todo-users-table">
                        <thead>
                            <tr><th scope="col">Display name</th><th scope="col">Email</th><th scope="col">Todos</th></tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr
                                    key={user.userId}
                                    tabIndex={0}
                                    onClick={() => onSelectUser(user)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            onSelectUser(user);
                                        }
                                    }}
                                    aria-label={`View todos for ${user.displayName || user.email || `User ${user.userId}`}`}
                                >
                                    <td>{user.displayName.trim() || user.email.trim() || `User ${user.userId}`}</td>
                                    <td>{user.email || "—"}</td>
                                    <td>{user.todoCount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!loading && !error && users.length > 0 && (
                <TodoPagination
                    onSetPage={onSetPage}
                    pagination={{ page, totalPages }}
                />
            )}
        </section>
    );
}
