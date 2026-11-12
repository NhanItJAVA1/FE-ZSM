import TodoCategoryPanel from "../../features/todo/components/TodoCategoryPanel.js";
import TodoDialog from "../../features/todo/components/TodoDialog.js";
import TodoPanel from "../../features/todo/components/TodoPanel.js";
import TodoActionNotice from "../../features/todo/components/TodoActionNotice.js";
import TodoUsersTab from "../../features/todo/components/TodoUsersTab.js";
import { useTodoListPageModel } from "../../features/todo/hooks/useTodoListPageModel.js";
import AppLayout from "../../layouts/AppLayout.js";

export default function TodoListPage() {
    const { categoryPanelProps, dialogProps, managementProps, notificationProps, panelProps } = useTodoListPageModel();
    const hasAnyReadPermission = managementProps.canReadMine || managementProps.canReadAll;
    const userLabel = managementProps.viewingUser?.displayName.trim() ||
        managementProps.viewingUser?.email.trim() ||
        `User ${managementProps.todoView.type === "user" ? managementProps.todoView.userId : ""}`;

    return (
        <AppLayout>
            {hasAnyReadPermission && (
                <nav className="todo-management-tabs" role="tablist" aria-label="Todo views">
                    {managementProps.canShowTodosTab && <button
                        type="button"
                        role="tab"
                        aria-selected={managementProps.activeTab === "todos"}
                        className={managementProps.activeTab === "todos" ? "active" : ""}
                        onClick={() => managementProps.onSelectTab("todos")}
                    >Todos</button>}
                    {managementProps.canReadAll && <button
                        type="button"
                        role="tab"
                        aria-selected={managementProps.activeTab === "users"}
                        className={managementProps.activeTab === "users" ? "active" : ""}
                        onClick={() => managementProps.onSelectTab("users")}
                    >Users</button>}
                </nav>
            )}

            {managementProps.activeTab === "users" && managementProps.canReadAll && (
                <TodoUsersTab
                    users={managementProps.users}
                    loading={managementProps.usersLoading}
                    fetching={managementProps.usersFetching}
                    error={managementProps.usersError}
                    page={managementProps.usersPage}
                    totalPages={managementProps.usersTotalPages}
                    search={managementProps.usersSearch}
                    onSearchChange={managementProps.onUsersSearchChange}
                    onSetPage={managementProps.onUsersPage}
                    onSelectUser={managementProps.onSelectUser}
                    onRetry={managementProps.onRetryUsers}
                />
            )}

            {managementProps.activeTab === "todos" && managementProps.canReadCurrentView && (
                <main className={`todo-list-page${managementProps.todoView.type === "user" ? " todo-list-page--viewing-user" : ""}`}>
                    {managementProps.todoView.type === "mine" && <TodoCategoryPanel {...categoryPanelProps} />}

                    <div className="todo-list-page-panel">
                        <div className="todo-view-context">
                            <div>
                                <p className="eyebrow">{managementProps.todoView.type === "mine" ? "Todos" : "Viewing user"}</p>
                                <strong>{managementProps.todoView.type === "mine" ? "My Todos" : userLabel}</strong>
                                {managementProps.todoView.type === "user" && <small>User ID: {managementProps.todoView.userId}</small>}
                            </div>
                            {managementProps.todoView.type === "user" && managementProps.canReadMine && (
                                <button type="button" className="ghost-btn" onClick={managementProps.onReturnToMyTodos}>Return to My Todos</button>
                            )}
                        </div>
                        <TodoPanel {...panelProps} />
                    </div>
                </main>
            )}

            {managementProps.activeTab === "todos" && !managementProps.canReadCurrentView && (
                <div className="empty-state todo-scope-empty" role="status">
                    {managementProps.todoView.type === "user"
                        ? "You need todos.read-all to view another user's todos."
                        : managementProps.canReadAll
                            ? "Select a user from the Users tab to view their todos."
                            : "You need todos.read to view your todos."}
                </div>
            )}

            {!hasAnyReadPermission && (
                <div className="empty-state todo-scope-empty" role="status">
                    You need todos.read or todos.read-all to view todos.
                </div>
            )}

            <TodoDialog {...dialogProps} />
            <TodoActionNotice {...notificationProps} />
        </AppLayout>
    );
}
