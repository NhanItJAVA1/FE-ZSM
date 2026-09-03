import { Check, Trash2, X } from "lucide-react";
import TodoFilterDrawer from "./TodoFilterDrawer.js";
import type {
    TodoPanelActions,
    TodoPanelData,
    TodoPanelEditing,
    TodoPanelFilters,
    TodoPanelSelection,
} from "./todoPanelTypes.js";

interface TodoPanelToolbarProps {
    actions: TodoPanelActions;
    counts: TodoPanelData["counts"];
    editing: TodoPanelEditing;
    filters: TodoPanelFilters;
    selection: TodoPanelSelection;
}

export default function TodoPanelToolbar({
    actions,
    counts,
    editing,
    filters,
    selection,
}: TodoPanelToolbarProps) {
    const {
        onClearAdvancedFilters,
        onDeleteSelectedTodos,
        onOpenNewTodoEditor,
        onResetForm,
        onSaveTodo,
        onSearchChange,
        onSetOverdueFilter,
        onSetPriorityFilter,
        onSetStatusFilter,
        onToggleFilter,
    } = actions;
    const { editedTodoRows, inlineDrafts, savingTodo } = editing;
    const { bulkDeleteMode, selectedDeleteIds } = selection;
    const { filterActive, filterOpen, search } = filters;
    const hasChanges = inlineDrafts.length > 0 || Object.keys(editedTodoRows).length > 0;
    const canDeleteSelected = bulkDeleteMode && selectedDeleteIds.length > 0;

    return (
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
                    <TodoFilterDrawer
                        actions={{
                            onSetOverdueFilter,
                            onSetPriorityFilter,
                            onSetStatusFilter,
                        }}
                        counts={counts}
                        filters={filters}
                    />
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
    );
}
