import type { RefObject, SyntheticEvent } from "react";
import { Check, Trash2, X } from "lucide-react";
import type { TodoCategoryDto, TodoDto, TodoPriority, TodoStatus } from "../types.js";
import {
    OVERDUE_FILTER_LABELS,
    PRIORITIES,
    STATUSES,
    STATUS_LABELS,
    emptyForm,
    formatShortDate,
    getPriorityTone,
    toInputDateTime,
    type TodoCounts,
    type TodoFormState,
    type TodoInlineDraft,
    type TodoOverdueFilter,
} from "../todoPageUtils.js";

interface TodoPanelProps {
    categories: TodoCategoryDto[];
    counts: TodoCounts;
    editedTodoRows?: Record<number, TodoFormState>;
    formError: string | null;
    inlineDrafts?: TodoInlineDraft[];
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
    onOpenNewTodoEditor: () => void;
    onResetForm: () => void;
    onSearchChange: (value: string) => void;
    onSelectTodo: (todoId: number) => void;
    onRemoveInlineDraft?: (id: string) => void;
    onSetInlineDraft?: (id: string, patch: Partial<TodoFormState>) => void;
    onSetTodoRow: (todo: TodoDto, patch: Partial<TodoFormState>) => void;
    onSetOverdueFilter: (filter: TodoOverdueFilter) => void;
    onSetPriorityFilter: (priority: TodoPriority | "All") => void;
    onSetStatusFilter: (status: TodoStatus | "All") => void;
    onSetTaskPage: (updater: (current: number) => number) => void;
    onToggleBulkDeleteMode?: () => void;
    onToggleFilter: () => void;
    onToggleDeleteSelection?: (todoId: number) => void;
    onSaveTodo?: () => void;
    savingTodo: boolean;
}

export default function TodoPanel({
    categories,
    counts,
    editedTodoRows = {},
    formError,
    inlineDrafts = [],
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
    onOpenNewTodoEditor,
    onResetForm,
    onSearchChange,
    onSelectTodo,
    onRemoveInlineDraft,
    onSetInlineDraft,
    onSetTodoRow,
    onSetOverdueFilter,
    onSetPriorityFilter,
    onSetStatusFilter,
    onSetTaskPage,
    onToggleBulkDeleteMode,
    onToggleFilter,
    onToggleDeleteSelection,
    onSaveTodo,
    savingTodo,
}: TodoPanelProps) {
    const showDrafts = inlineDrafts.length > 0;
    const showTaskTable = visibleTodosLength > 0 || showDrafts;
    const hasChanges = showDrafts || Object.keys(editedTodoRows).length > 0;
    const canDeleteSelected = bulkDeleteMode && selectedDeleteIds.length > 0;

    function updateDraftTodo(id: string, patch: Partial<TodoFormState>) {
        onSetInlineDraft?.(id, patch);
    }

    function stopRowClick(event: SyntheticEvent) {
        event.stopPropagation();
    }

    return (
        <section
            className="todo-left-panel todo-left-panel--inline"
            ref={leftPanelRef}
        >
            <div className="todo-panel-heading">
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

                <div className="todo-header-action-table" aria-label="Task actions">
                    <button
                        type="button"
                        className={`todo-header-action-btn todo-header-action-btn--save ${hasChanges ? "active" : ""}`}
                        onClick={onSaveTodo}
                        title="Lưu thay đổi"
                        aria-label="Lưu thay đổi"
                        disabled={!hasChanges || savingTodo}
                    >
                        <Check size={15} strokeWidth={2.4} />
                    </button>
                    <button
                        type="button"
                        className={`todo-header-action-btn todo-header-action-btn--cancel ${hasChanges ? "active" : ""}`}
                        onClick={onResetForm}
                        title="Hủy thay đổi"
                        aria-label="Hủy thay đổi"
                        disabled={!hasChanges || savingTodo}
                    >
                        <X size={15} strokeWidth={2.4} />
                    </button>
                    <button
                        type="button"
                        className={`todo-header-action-btn todo-header-action-btn--danger ${canDeleteSelected ? "active" : ""}`}
                        onClick={onDeleteSelectedTodos}
                        title={canDeleteSelected ? "Xóa task đã chọn" : "Chọn task trong bảng để xóa"}
                        aria-label={canDeleteSelected ? "Xóa task đã chọn" : "Chọn task trong bảng để xóa"}
                        disabled={!canDeleteSelected}
                    >
                        <Trash2 size={14} strokeWidth={2.4} />
                    </button>
                </div>

                <div className="todo-panel-actions">
                    <button
                        type="button"
                        className="todo-door-trigger"
                        onClick={onOpenNewTodoEditor}
                        title="Tạo task mới"
                    >
                        <span>+</span>
                        <span className="sr-only">Tạo task mới</span>
                    </button>
                </div>
            </div>

            <div className="todo-left-stage">
                <div className="todo-list-layer">
                    <div className="todo-category-list">
                        {loading && <div className="empty-state">Đang tải todo...</div>}

                        {!loading && visibleTodosLength === 0 && !showDrafts && (
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
                                        <button
                                            type="button"
                                            className={`todo-bulk-select-trigger ${bulkDeleteMode ? "active" : ""}`}
                                            title={bulkDeleteMode ? "Tắt chọn nhiều" : "Chọn nhiều để xóa"}
                                            aria-label={bulkDeleteMode ? "Tắt chọn nhiều" : "Chọn nhiều để xóa"}
                                            onClick={onToggleBulkDeleteMode}
                                        >
                                            <Check size={13} strokeWidth={2.5} />
                                        </button>
                                    </span>
                                </div>
                                {formError && (
                                    <p className="todo-inline-error">{formError}</p>
                                )}
                                {inlineDrafts.map((draft, index) => (
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
                                                        updateDraftTodo(draft.id, {
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
                                                        updateDraftTodo(draft.id, {
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
                                                        updateDraftTodo(draft.id, {
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
                                                        updateDraftTodo(draft.id, {
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
                                                        updateDraftTodo(draft.id, {
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
                                    const rowDraft = editedTodoRows[todo.id];
                                    const rowValues = rowDraft ?? {
                                        title: todo.title,
                                        description: todo.description ?? "",
                                        priority: todo.priority,
                                        dueDate: toInputDateTime(todo.dueDate),
                                        categoryId: todo.categoryId ? String(todo.categoryId) : "",
                                    };

                                    return (
                                        <article
                                            key={todo.id}
                                            className={`todo-card ${selectedTodoId === todo.id ? "active" : ""} ${rowDraft ? "todo-card--editing" : ""}`}
                                            onClick={() => onSelectTodo(todo.id)}
                                        >
                                            <div className="todo-card-body">
                                                <div className="todo-card-name">
                                                    <textarea
                                                        className="todo-inline-field todo-inline-field--strong"
                                                        value={rowValues.title}
                                                        placeholder="Task name"
                                                        rows={2}
                                                        onClick={stopRowClick}
                                                        onChange={(event) =>
                                                            onSetTodoRow(todo, {
                                                                title: event.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <div className="todo-card-description">
                                                    <textarea
                                                        className="todo-inline-field todo-inline-field--textarea"
                                                        value={rowValues.description}
                                                        placeholder="Description"
                                                        rows={2}
                                                        onClick={stopRowClick}
                                                        onChange={(event) =>
                                                            onSetTodoRow(todo, {
                                                                description: event.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <div className="todo-card-due">
                                                    <input
                                                        className="todo-inline-field todo-inline-field--date"
                                                        type="datetime-local"
                                                        value={rowValues.dueDate}
                                                        placeholder={formatShortDate(todo.dueDate)}
                                                        onClick={stopRowClick}
                                                        onChange={(event) =>
                                                            onSetTodoRow(todo, {
                                                                dueDate: event.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <div className="todo-card-labels">
                                                    <select
                                                        className="todo-inline-field todo-inline-field--label"
                                                        value={rowValues.priority}
                                                        onClick={stopRowClick}
                                                        onChange={(event) =>
                                                            onSetTodoRow(todo, {
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
                                                        value={rowValues.categoryId}
                                                        onClick={stopRowClick}
                                                        onChange={(event) =>
                                                            onSetTodoRow(todo, {
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
                                                <div className="todo-card-edit-stack">
                                                    <button
                                                        type="button"
                                                        className="todo-card-side-btn todo-card-side-btn--danger todo-card-side-btn--single"
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
            </div>
        </section>
    );
}
