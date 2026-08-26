import type { Dispatch, FormEvent, RefObject, SetStateAction } from "react";
import type { TodoCategoryDto, TodoDto, TodoPriority, TodoStatus } from "../types.js";
import {
    LEFT_TASK_PAGE_SIZE,
    PRIORITIES,
    STATUSES,
    STATUS_LABELS,
    emptyForm,
    formatShortDate,
    getNextStatusAction,
    getPriorityTone,
    type TodoCounts,
    type TodoFormState,
} from "../todoPageUtils.js";

interface TodoLeftPanelProps {
    categories: TodoCategoryDto[];
    counts: TodoCounts;
    editingTodoId: number | null;
    editorDoorRef: RefObject<HTMLFormElement | null>;
    form: TodoFormState;
    formError: string | null;
    isEditorOpen: boolean;
    isLeftCollapsed: boolean;
    leftPanelRef: RefObject<HTMLElement | null>;
    loading: boolean;
    paginatedTodos: TodoDto[];
    search: string;
    selectedTodoId: number | null;
    statusFilter: TodoStatus | "All";
    taskPage: number;
    totalTaskPages: number;
    visibleTodosLength: number;
    onClearFilters: () => void;
    onDeleteTodo: (todo: TodoDto) => void;
    onEditTodo: (todo: TodoDto) => void;
    onOpenNewTodoEditor: () => void;
    onResetForm: () => void;
    onSearchChange: (value: string) => void;
    onSelectTodo: (todoId: number) => void;
    onSetForm: Dispatch<SetStateAction<TodoFormState>>;
    onSetIsLeftCollapsed: Dispatch<SetStateAction<boolean>>;
    onSetStatusFilter: (status: TodoStatus | "All") => void;
    onSetTaskPage: Dispatch<SetStateAction<number>>;
    onSubmitTodo: (event: FormEvent<HTMLFormElement>) => void;
    onUpdateStatus: (id: number, status: TodoStatus) => void;
    savingTodo: boolean;
}

export default function TodoLeftPanel({
    categories,
    counts,
    editingTodoId,
    editorDoorRef,
    form,
    formError,
    isEditorOpen,
    isLeftCollapsed,
    leftPanelRef,
    loading,
    paginatedTodos,
    search,
    selectedTodoId,
    statusFilter,
    taskPage,
    totalTaskPages,
    visibleTodosLength,
    onClearFilters,
    onDeleteTodo,
    onEditTodo,
    onOpenNewTodoEditor,
    onResetForm,
    onSearchChange,
    onSelectTodo,
    onSetForm,
    onSetIsLeftCollapsed,
    onSetStatusFilter,
    onSetTaskPage,
    onSubmitTodo,
    onUpdateStatus,
    savingTodo,
}: TodoLeftPanelProps) {
    return (
        <section
            className={`todo-left-panel ${isLeftCollapsed ? "todo-left-panel--collapsed" : ""}`}
            ref={leftPanelRef}
        >
            <div className="todo-panel-heading">
                <div>
                    <p className="eyebrow">Todo</p>
                    <strong className="todo-left-collapsed-label">{visibleTodosLength}</strong>
                </div>
                <div className="todo-panel-actions">
                    <button
                        type="button"
                        className="todo-collapse-trigger"
                        onClick={() => {
                            if (!isLeftCollapsed && isEditorOpen) {
                                onResetForm();
                            }
                            onSetIsLeftCollapsed((current) => !current);
                        }}
                        title={isLeftCollapsed ? "Mở rộng danh sách task" : "Thu gọn danh sách task"}
                        aria-label={isLeftCollapsed ? "Mở rộng danh sách task" : "Thu gọn danh sách task"}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.9"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            {isLeftCollapsed ? (
                                <>
                                    <path d="m9 6 6 6-6 6" />
                                    <path d="M4 4v16" />
                                </>
                            ) : (
                                <>
                                    <path d="m15 6-6 6 6 6" />
                                    <path d="M20 4v16" />
                                </>
                            )}
                        </svg>
                    </button>
                    <button
                        type="button"
                        className={`todo-door-trigger ${isEditorOpen ? "active" : ""}`}
                        onClick={() => {
                            if (isEditorOpen) {
                                onResetForm();
                                return;
                            }

                            onOpenNewTodoEditor();
                        }}
                        title={isEditorOpen ? "Đóng form" : "Tạo task mới"}
                    >
                        <span>{isEditorOpen ? "×" : "+"}</span>
                        <span className="sr-only">
                            {isEditorOpen ? "Đóng form" : "Tạo task mới"}
                        </span>
                    </button>
                </div>
            </div>

            <div className="todo-stat-row">
                <span><b>{counts.all}</b> Total</span>
                <span><b>{counts.progress}</b> Running</span>
                <span><b>{counts.overdue}</b> Overdue</span>
            </div>

            <div className="todo-left-stage">
                <div className="todo-list-layer">
                    <div className="todo-filter-row">
                        <input
                            value={search}
                            placeholder="Search task/category"
                            onChange={(event) => onSearchChange(event.target.value)}
                        />
                        <select
                            value={statusFilter}
                            onChange={(event) =>
                                onSetStatusFilter(event.target.value as TodoStatus | "All")
                            }
                        >
                            <option value="All">All status</option>
                            {STATUSES.map((status) => (
                                <option key={status} value={status}>
                                    {STATUS_LABELS[status]}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="todo-category-list">
                        {loading && <div className="empty-state">Đang tải todo...</div>}

                        {!loading && visibleTodosLength === 0 && (
                            <div className="empty-state empty-state--composed">
                                <p className="empty-state-desc">Hãy tạo task đầu tiên!</p>
                                {(search || statusFilter !== "All") && (
                                    <button
                                        type="button"
                                        className="ghost-btn"
                                        onClick={onClearFilters}
                                    >
                                        Bỏ filter
                                    </button>
                                )}
                            </div>
                        )}

                        {!loading && visibleTodosLength > 0 && (
                            <div className="todo-task-list">
                                {paginatedTodos.map((todo) => {
                                    const nextStatusAction = getNextStatusAction(todo.status);

                                    return (
                                        <article
                                            key={todo.id}
                                            className={`todo-card ${selectedTodoId === todo.id ? "active" : ""}`}
                                            onClick={() => onSelectTodo(todo.id)}
                                        >
                                            <div className="todo-card-body">
                                                <div className="todo-card-topline">
                                                    <span className={getPriorityTone(todo.priority)}>
                                                        {todo.priority}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="todo-card-trash-btn"
                                                        title="Xóa task"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            onDeleteTodo(todo);
                                                        }}
                                                    >
                                                        <svg
                                                            width="15"
                                                            height="15"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="1.8"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            aria-hidden="true"
                                                        >
                                                            <path d="M4 7h16" />
                                                            <path d="M10 11v6" />
                                                            <path d="M14 11v6" />
                                                            <path d="M6 7l1 14h10l1-14" />
                                                            <path d="M9 7V4h6v3" />
                                                        </svg>
                                                        <span className="sr-only">Xóa task</span>
                                                    </button>
                                                </div>
                                                <h3>{todo.title}</h3>
                                                <p>{todo.description || "Không có mô tả"}</p>
                                                <div className="todo-card-meta">
                                                    <span className={`todo-status-dot todo-status-dot--${todo.status}`} />
                                                    <span>{STATUS_LABELS[todo.status]}</span>
                                                    <span>{todo.categoryName || "others"}</span>
                                                    <span>{formatShortDate(todo.dueDate)}</span>
                                                </div>
                                            </div>

                                            <div className="todo-card-actions">
                                                <button
                                                    type="button"
                                                    className="todo-card-side-btn"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        onEditTodo(todo);
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    className="todo-card-side-btn todo-card-side-btn--status"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        onUpdateStatus(todo.id, nextStatusAction.nextStatus);
                                                    }}
                                                >
                                                    {nextStatusAction.label}
                                                </button>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}

                        {!loading && visibleTodosLength > LEFT_TASK_PAGE_SIZE && (
                            <div className="todo-list-pagination">
                                <button
                                    type="button"
                                    className="ghost-btn"
                                    disabled={taskPage === 1}
                                    onClick={() =>
                                        onSetTaskPage((current) =>
                                            Math.max(1, current - 1)
                                        )
                                    }
                                >
                                    Prev
                                </button>
                                <span>
                                    {taskPage} / {totalTaskPages}
                                </span>
                                <button
                                    type="button"
                                    className="ghost-btn"
                                    disabled={taskPage === totalTaskPages}
                                    onClick={() =>
                                        onSetTaskPage((current) =>
                                            Math.min(totalTaskPages, current + 1)
                                        )
                                    }
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <form
                    ref={editorDoorRef}
                    className={`todo-editor-door ${isEditorOpen ? "open" : ""}`}
                    onSubmit={onSubmitTodo}
                    aria-hidden={!isEditorOpen}
                >
                    <div className="todo-editor-door-handle">
                        <span />
                    </div>
                    <div className="todo-editor-door-header">
                        <div>
                            <p className="eyebrow">{editingTodoId ? "Edit task" : "New task"}</p>
                        </div>
                        <button type="button" className="ghost-btn" onClick={onResetForm}>
                            Close
                        </button>
                    </div>

                    <label>
                        Title
                        <input
                            value={form.title}
                            placeholder="VD: Chuẩn bị tài liệu sprint"
                            onChange={(event) =>
                                onSetForm((current) => ({
                                    ...current,
                                    title: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label>
                        Description
                        <textarea
                            value={form.description}
                            rows={3}
                            placeholder="Ghi chú ngắn về task"
                            onChange={(event) =>
                                onSetForm((current) => ({
                                    ...current,
                                    description: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <div className="todo-form-grid">
                        <label>
                            Priority
                            <select
                                value={form.priority}
                                onChange={(event) =>
                                    onSetForm((current) => ({
                                        ...current,
                                        priority: event.target.value as TodoPriority,
                                    }))
                                }
                            >
                                {PRIORITIES.map((priority) => (
                                    <option key={priority} value={priority}>
                                        {priority}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Due date
                            <input
                                type="datetime-local"
                                value={form.dueDate}
                                onChange={(event) =>
                                    onSetForm((current) => ({
                                        ...current,
                                        dueDate: event.target.value,
                                    }))
                                }
                            />
                        </label>
                    </div>

                    <label>
                        Category
                        <select
                            value={form.categoryId}
                            onChange={(event) =>
                                onSetForm((current) => ({
                                    ...current,
                                    categoryId: event.target.value,
                                }))
                            }
                        >
                            <option value={emptyForm.categoryId}>others</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    {formError && <p className="form-error">{formError}</p>}

                    <div className="todo-editor-actions">
                        <button type="button" className="ghost-btn" onClick={onResetForm}>
                            Cancel
                        </button>
                        <button type="submit" disabled={savingTodo}>
                            {editingTodoId ? "Save task" : "Create task"}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}
