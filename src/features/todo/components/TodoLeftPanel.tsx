import type { Dispatch, FormEvent, RefObject, SetStateAction, SyntheticEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { TodoCategoryDto, TodoDto, TodoPriority, TodoStatus } from "../types.js";
import {
    OVERDUE_FILTER_LABELS,
    PRIORITIES,
    STATUSES,
    STATUS_LABELS,
    emptyForm,
    formatShortDate,
    getNextStatusAction,
    getPriorityTone,
    toInputDateTime,
    type TodoCounts,
    type TodoFormState,
    type TodoInlineDraft,
    type TodoOverdueFilter,
} from "../todoPageUtils.js";

const STATUS_ICONS: Record<TodoStatus, string> = {
    Todo: "/images/check-start.png",
    InProgress: "/images/check-inprogress.png",
    Done: "/images/check-done.png",
};

interface TodoLeftPanelProps {
    categories: TodoCategoryDto[];
    counts: TodoCounts;
    editingTodoId: number | null;
    editorDoorRef: RefObject<HTMLFormElement | null>;
    form: TodoFormState;
    formError: string | null;
    inlineDrafts?: TodoInlineDraft[];
    isBulkCreateOpen: boolean;
    isEditorOpen: boolean;
    isLeftCollapsed: boolean;
    leftPanelRef: RefObject<HTMLElement | null>;
    loading: boolean;
    paginatedTodos: TodoDto[];
    search: string;
    filterActive: boolean;
    filterOpen: boolean;
    overdueFilter: TodoOverdueFilter;
    priorityFilter: TodoPriority | "All";
    selectedTodoId: number | null;
    bulkDeleteMode?: boolean;
    selectedDeleteIds?: number[];
    statusFilter: TodoStatus | "All";
    taskPage: number;
    totalTaskPages: number;
    visibleTodosLength: number;
    onClearAdvancedFilters: () => void;
    onClearFilters: () => void;
    onDeleteTodo: (todo: TodoDto) => void;
    onDeleteSelectedTodos?: () => void;
    onEditTodo: (todo: TodoDto) => void;
    onOpenNewTodoEditor: () => void;
    onResetForm: () => void;
    onSearchChange: (value: string) => void;
    onSelectTodo: (todoId: number) => void;
    onRemoveInlineDraft?: (id: string) => void;
    onSetForm: Dispatch<SetStateAction<TodoFormState>>;
    onSetInlineDraft?: (id: string, patch: Partial<TodoFormState>) => void;
    onSetIsLeftCollapsed: Dispatch<SetStateAction<boolean>>;
    onSetOverdueFilter: (filter: TodoOverdueFilter) => void;
    onSetPriorityFilter: (priority: TodoPriority | "All") => void;
    onSetStatusFilter: (status: TodoStatus | "All") => void;
    onSetTaskPage: Dispatch<SetStateAction<number>>;
    onSubmitTodo: (event: FormEvent<HTMLFormElement>) => void;
    onToggleFilter: () => void;
    onToggleDeleteSelection?: (todoId: number) => void;
    onUpdateStatus: (id: number, status: TodoStatus) => void;
    onSaveInlineTodo?: () => void;
    savingTodo: boolean;
    allowCollapse?: boolean;
    inlineMode?: boolean;
}

export default function TodoLeftPanel({
    categories,
    counts,
    editingTodoId,
    editorDoorRef,
    form,
    formError,
    inlineDrafts = [],
    isBulkCreateOpen,
    isEditorOpen,
    isLeftCollapsed,
    leftPanelRef,
    loading,
    paginatedTodos,
    search,
    filterActive,
    filterOpen,
    overdueFilter,
    priorityFilter,
    selectedTodoId,
    bulkDeleteMode = false,
    selectedDeleteIds = [],
    statusFilter,
    taskPage,
    totalTaskPages,
    visibleTodosLength,
    onClearAdvancedFilters,
    onClearFilters,
    onDeleteTodo,
    onDeleteSelectedTodos,
    onEditTodo,
    onOpenNewTodoEditor,
    onResetForm,
    onSearchChange,
    onSelectTodo,
    onRemoveInlineDraft,
    onSetForm,
    onSetInlineDraft,
    onSetIsLeftCollapsed,
    onSetOverdueFilter,
    onSetPriorityFilter,
    onSetStatusFilter,
    onSetTaskPage,
    onSubmitTodo,
    onToggleFilter,
    onToggleDeleteSelection,
    onUpdateStatus,
    onSaveInlineTodo,
    savingTodo,
    allowCollapse = true,
    inlineMode = false,
}: TodoLeftPanelProps) {
    const showInlineDraft = inlineMode && inlineDrafts.length > 0;
    const hasInlineWork = inlineMode && (isEditorOpen || showInlineDraft || editingTodoId !== null);
    const showTaskTable = visibleTodosLength > 0 || showInlineDraft;

    function beginInlineEdit(todo: TodoDto) {
        if (!inlineMode || editingTodoId === todo.id) return;
        onEditTodo(todo);
    }

    function stopRowClick(event: SyntheticEvent) {
        event.stopPropagation();
    }

    return (
        <section
            className={`todo-left-panel ${isLeftCollapsed ? "todo-left-panel--collapsed" : ""} ${inlineMode ? "todo-left-panel--inline" : ""}`}
            ref={leftPanelRef}
        >
            <div className="todo-panel-heading">
                <strong className="todo-left-collapsed-label">{visibleTodosLength}</strong>
                <div className="todo-filter-row">
                    <input
                        value={search}
                        placeholder="Search task"
                        onChange={(event) => onSearchChange(event.target.value)}
                    />
                    <div className="todo-filter-menu todo-filter-menu--inline">
                        <button
                            type="button"
                            className={`todo-filter-trigger ${filterOpen ? "active" : ""}`}
                            onClick={onToggleFilter}
                            aria-expanded={filterOpen}
                            aria-label="Mở bộ lọc todo"
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M4 5h16l-6.4 7.3v4.9l-3.2 1.8v-6.7L4 5Z" />
                            </svg>
                            <span>Filters</span>
                        </button>
                        {filterActive && (
                            <button
                                type="button"
                                className="todo-filter-clear-btn"
                                onClick={onClearAdvancedFilters}
                                aria-label="Xóa bộ lọc"
                                title="Xóa bộ lọc"
                            >
                                ×
                            </button>
                        )}
                    </div>
                    {filterOpen && (
                        <div className="todo-filter-drawer todo-filter-drawer--wide">
                            <div className="todo-filter-group">
                                <span>Status</span>
                                <div>
                                    <button
                                        type="button"
                                        className={`todo-filter-option ${statusFilter === "All" ? "active" : ""}`}
                                        onClick={() => onSetStatusFilter("All")}
                                    >
                                        <span>All status</span>
                                        <small>{counts.all}</small>
                                    </button>
                                    {STATUSES.map((status) => (
                                        <button
                                            key={status}
                                            type="button"
                                            className={`todo-filter-option ${statusFilter === status ? "active" : ""}`}
                                            onClick={() => onSetStatusFilter(status)}
                                        >
                                            <span>
                                                <i className={`todo-status-dot todo-status-dot--${status}`} />
                                                {STATUS_LABELS[status]}
                                            </span>
                                            <small>
                                                {status === "Todo" && counts.todo}
                                                {status === "InProgress" && counts.progress}
                                                {status === "Done" && counts.done}
                                            </small>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="todo-filter-group">
                                <span>Priority</span>
                                <div>
                                    <button
                                        type="button"
                                        className={`todo-filter-option ${priorityFilter === "All" ? "active" : ""}`}
                                        onClick={() => onSetPriorityFilter("All")}
                                    >
                                        <span>All priority</span>
                                    </button>
                                    {PRIORITIES.map((priority) => (
                                        <button
                                            key={priority}
                                            type="button"
                                            className={`todo-filter-option ${priorityFilter === priority ? "active" : ""}`}
                                            onClick={() => onSetPriorityFilter(priority)}
                                        >
                                            <span className={getPriorityTone(priority)}>{priority}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="todo-filter-group">
                                <span>Due state</span>
                                <div>
                                    {(Object.keys(OVERDUE_FILTER_LABELS) as TodoOverdueFilter[]).map((filter) => (
                                        <button
                                            key={filter}
                                            type="button"
                                            className={`todo-filter-option ${overdueFilter === filter ? "active" : ""}`}
                                            onClick={() => onSetOverdueFilter(filter)}
                                        >
                                            <span>{OVERDUE_FILTER_LABELS[filter]}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="todo-panel-actions">
                    {allowCollapse && (
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
                    )}
                    {hasInlineWork && (
                        <button
                            type="button"
                            className="todo-inline-save-trigger"
                            onClick={onSaveInlineTodo}
                            title="Lưu task"
                            disabled={savingTodo}
                        >
                            SAVE
                        </button>
                    )}
                    <button
                        type="button"
                        className={`todo-door-trigger ${!inlineMode && (isEditorOpen || isBulkCreateOpen) ? "active" : ""}`}
                        onClick={() => {
                            if (!inlineMode && isEditorOpen) {
                                onResetForm();
                                return;
                            }

                            onOpenNewTodoEditor();
                        }}
                        title={!inlineMode && (isEditorOpen || isBulkCreateOpen) ? "Đang tạo task" : "Tạo task mới"}
                    >
                        <span>{!inlineMode && isEditorOpen ? "×" : "+"}</span>
                        <span className="sr-only">
                            {!inlineMode && isEditorOpen ? "Đóng form" : "Tạo task mới"}
                        </span>
                    </button>
                </div>
            </div>

            <div className="todo-left-stage">
                <div className="todo-list-layer">
                    <div className="todo-category-list">
                        {loading && <div className="empty-state">Đang tải todo...</div>}

                        {!loading && visibleTodosLength === 0 && !showInlineDraft && (
                            <div className="empty-state empty-state--composed">
                                <p className="empty-state-desc">Hãy tạo task đầu tiên!</p>
                                {(search || filterActive) && (
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

                        {!loading && showTaskTable && (
                            <div className="todo-task-list">
                                <div className="todo-task-table-head">
                                    <span>Task Name</span>
                                    <span>Description</span>
                                    <span>Duedate</span>
                                    <span>Labels</span>
                                    <span className="todo-task-delete-head">
                                        {inlineMode && (
                                            <button
                                                type="button"
                                                className={`todo-bulk-delete-trigger ${bulkDeleteMode ? "active" : ""}`}
                                                title={bulkDeleteMode && selectedDeleteIds.length > 0 ? "Xóa task đã chọn" : bulkDeleteMode ? "Tắt chọn nhiều" : "Chọn nhiều để xóa"}
                                                aria-label={bulkDeleteMode && selectedDeleteIds.length > 0 ? "Xóa task đã chọn" : bulkDeleteMode ? "Tắt chọn nhiều" : "Chọn nhiều để xóa"}
                                                onClick={onDeleteSelectedTodos}
                                            >
                                                {bulkDeleteMode && selectedDeleteIds.length > 0 ? (
                                                    selectedDeleteIds.length
                                                ) : (
                                                    <Trash2 size={13} strokeWidth={2.3} />
                                                )}
                                            </button>
                                        )}
                                    </span>
                                </div>
                                {inlineMode && formError && (
                                    <p className="todo-inline-error">{formError}</p>
                                )}
                                {inlineMode && inlineDrafts.map((draft, index) => (
                                    <article
                                        key={draft.id}
                                        className="todo-card todo-card--editing todo-card--draft"
                                    >
                                        <div className="todo-card-body">
                                            <div className="todo-card-name">
                                                <textarea
                                                    className="todo-inline-field todo-inline-field--strong"
                                                    value={draft.title}
                                                    placeholder="Task name"
                                                    rows={2}
                                                    autoFocus={index === inlineDrafts.length - 1}
                                                    onChange={(event) =>
                                                        onSetInlineDraft?.(draft.id, {
                                                            title: event.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="todo-card-description">
                                                <textarea
                                                    className="todo-inline-field todo-inline-field--textarea"
                                                    value={draft.description}
                                                    placeholder="Description"
                                                    rows={2}
                                                    onChange={(event) =>
                                                        onSetInlineDraft?.(draft.id, {
                                                            description: event.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="todo-card-due">
                                                <input
                                                    className="todo-inline-field todo-inline-field--date"
                                                    type="datetime-local"
                                                    value={draft.dueDate}
                                                    onChange={(event) =>
                                                        onSetInlineDraft?.(draft.id, {
                                                            dueDate: event.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="todo-card-labels">
                                                <select
                                                    className="todo-inline-field todo-inline-field--label"
                                                    value={draft.priority}
                                                    onChange={(event) =>
                                                        onSetInlineDraft?.(draft.id, {
                                                            priority: event.target.value as TodoPriority,
                                                        })
                                                    }
                                                >
                                                    {PRIORITIES.map((priority) => (
                                                        <option key={priority} value={priority}>
                                                            {priority}
                                                        </option>
                                                    ))}
                                                </select>
                                                <select
                                                    className="todo-inline-field todo-inline-field--label"
                                                    value={draft.categoryId}
                                                    onChange={(event) =>
                                                        onSetInlineDraft?.(draft.id, {
                                                            categoryId: event.target.value,
                                                        })
                                                    }
                                                >
                                                    <option value={emptyForm.categoryId}>others</option>
                                                    {categories.map((category) => (
                                                        <option key={category.id} value={category.id}>
                                                            {category.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="todo-card-actions">
                                            <button
                                                type="button"
                                                className="todo-card-side-btn todo-card-side-btn--danger todo-card-side-btn--single"
                                                title="Hủy"
                                                aria-label="Hủy tạo task"
                                                onClick={() => onRemoveInlineDraft?.(draft.id)}
                                            >
                                                <Trash2 size={13} strokeWidth={2.3} />
                                            </button>
                                        </div>
                                    </article>
                                ))}
                                {paginatedTodos.map((todo) => {
                                    const nextStatusAction = getNextStatusAction(todo.status);
                                    const isRowEditing = inlineMode && editingTodoId === todo.id;

                                    return (
                                        <article
                                            key={todo.id}
                                            className={`todo-card ${selectedTodoId === todo.id ? "active" : ""} ${isRowEditing ? "todo-card--editing" : ""}`}
                                            onClick={() => onSelectTodo(todo.id)}
                                        >
                                            <div className="todo-card-body">
                                                <div className="todo-card-name">
                                                    {inlineMode ? (
                                                        <textarea
                                                            className="todo-inline-field todo-inline-field--strong"
                                                            value={isRowEditing ? form.title : todo.title}
                                                            placeholder="Task name"
                                                            rows={2}
                                                            onClick={stopRowClick}
                                                            onFocus={() => beginInlineEdit(todo)}
                                                            onChange={(event) => {
                                                                beginInlineEdit(todo);
                                                                onSetForm((current) => ({
                                                                    ...current,
                                                                    title: event.target.value,
                                                                }));
                                                            }}
                                                        />
                                                    ) : (
                                                        <h3>{todo.title}</h3>
                                                    )}
                                                </div>
                                                <div className="todo-card-description">
                                                    {inlineMode ? (
                                                        <textarea
                                                            className="todo-inline-field todo-inline-field--textarea"
                                                            value={isRowEditing ? form.description : todo.description ?? ""}
                                                            placeholder="Description"
                                                            rows={2}
                                                            onClick={stopRowClick}
                                                            onFocus={() => beginInlineEdit(todo)}
                                                            onChange={(event) => {
                                                                beginInlineEdit(todo);
                                                                onSetForm((current) => ({
                                                                    ...current,
                                                                    description: event.target.value,
                                                                }));
                                                            }}
                                                        />
                                                    ) : (
                                                        <p>{todo.description || "Không có mô tả"}</p>
                                                    )}
                                                </div>
                                                <div className="todo-card-due">
                                                    {inlineMode ? (
                                                        <input
                                                            className="todo-inline-field todo-inline-field--date"
                                                            type="datetime-local"
                                                            value={isRowEditing ? form.dueDate : toInputDateTime(todo.dueDate)}
                                                            placeholder={formatShortDate(todo.dueDate)}
                                                            onClick={stopRowClick}
                                                            onFocus={() => beginInlineEdit(todo)}
                                                            onChange={(event) => {
                                                                beginInlineEdit(todo);
                                                                onSetForm((current) => ({
                                                                    ...current,
                                                                    dueDate: event.target.value,
                                                                }));
                                                            }}
                                                        />
                                                    ) : (
                                                        <span>{formatShortDate(todo.dueDate)}</span>
                                                    )}
                                                </div>
                                                <div className="todo-card-labels">
                                                    {inlineMode ? (
                                                        <>
                                                            <select
                                                                className="todo-inline-field todo-inline-field--label"
                                                                value={isRowEditing ? form.priority : todo.priority}
                                                                onClick={stopRowClick}
                                                                onFocus={() => beginInlineEdit(todo)}
                                                                onChange={(event) => {
                                                                    beginInlineEdit(todo);
                                                                    onSetForm((current) => ({
                                                                        ...current,
                                                                        priority: event.target.value as TodoPriority,
                                                                    }));
                                                                }}
                                                            >
                                                                {PRIORITIES.map((priority) => (
                                                                    <option key={priority} value={priority}>
                                                                        {priority}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <select
                                                                className="todo-inline-field todo-inline-field--label"
                                                                value={isRowEditing ? form.categoryId : todo.categoryId ? String(todo.categoryId) : ""}
                                                                onClick={stopRowClick}
                                                                onFocus={() => beginInlineEdit(todo)}
                                                                onChange={(event) => {
                                                                    beginInlineEdit(todo);
                                                                    onSetForm((current) => ({
                                                                        ...current,
                                                                        categoryId: event.target.value,
                                                                    }));
                                                                }}
                                                            >
                                                                <option value={emptyForm.categoryId}>others</option>
                                                                {categories.map((category) => (
                                                                    <option key={category.id} value={category.id}>
                                                                        {category.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className={getPriorityTone(todo.priority)}>
                                                                {todo.priority}
                                                            </span>
                                                            <span className="todo-category-label">
                                                                {todo.categoryName || "others"}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="todo-card-actions">
                                                {!inlineMode && (
                                                    <button
                                                        type="button"
                                                        className="todo-card-side-btn todo-card-side-btn--status"
                                                        title={nextStatusAction.label}
                                                        aria-label={`${nextStatusAction.label} task ${todo.title}`}
                                                        disabled={todo.status === "Done"}
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            if (todo.status === "Done") return;
                                                            onUpdateStatus(todo.id, nextStatusAction.nextStatus);
                                                        }}
                                                    >
                                                        <img
                                                            src={STATUS_ICONS[todo.status]}
                                                            alt=""
                                                            className="todo-status-action-icon"
                                                        />
                                                    </button>
                                                )}
                                                <div className="todo-card-edit-stack">
                                                    {!inlineMode && (
                                                        <button
                                                            type="button"
                                                            className="todo-card-side-btn"
                                                            title="Sửa task"
                                                            aria-label={`Sửa task ${todo.title}`}
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                onEditTodo(todo);
                                                            }}
                                                        >
                                                            <Pencil size={13} strokeWidth={2.3} />
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className={`todo-card-side-btn todo-card-side-btn--danger ${inlineMode ? "todo-card-side-btn--single" : ""}`}
                                                        title={bulkDeleteMode ? "Chọn task để xóa" : "Xóa task"}
                                                        aria-label={bulkDeleteMode ? `Chọn task ${todo.title} để xóa` : `Xóa task ${todo.title}`}
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            if (bulkDeleteMode) {
                                                                onToggleDeleteSelection?.(todo.id);
                                                                return;
                                                            }
                                                            onDeleteTodo(todo);
                                                        }}
                                                    >
                                                        {bulkDeleteMode ? (
                                                            <span
                                                                className={`todo-delete-select-dot ${selectedDeleteIds.includes(todo.id) ? "active" : ""}`}
                                                            />
                                                        ) : (
                                                            <Trash2 size={13} strokeWidth={2.3} />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}

                        {!loading && totalTaskPages > 1 && (
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

                {!inlineMode && (
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
                )}
            </div>
        </section>
    );
}
