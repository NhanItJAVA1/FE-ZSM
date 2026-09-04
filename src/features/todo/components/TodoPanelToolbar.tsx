import { Check, Filter, Trash2, X } from "lucide-react";
import TodoFilterDrawer from "./TodoFilterDrawer.js";
import type {
    TodoPanelActions,
    TodoPanelData,
    TodoPanelEditing,
    TodoPanelFilters,
} from "./todoPanelTypes.js";

interface TodoPanelToolbarProps {
    actions: TodoPanelActions;
    counts: TodoPanelData["counts"];
    editing: TodoPanelEditing;
    filters: TodoPanelFilters;
    selectedCount: number;
}

export default function TodoPanelToolbar({
    actions,
    counts,
    editing,
    filters,
    selectedCount,
}: TodoPanelToolbarProps) {
    const {
        onClearAdvancedFilters,
        onDeleteSelected,
        onAddDraft,
        onResetForm,
        onSave,
        onSearchChange,
        onSetOverdueFilter,
        onSetPriorityFilter,
        onSetStatusFilter,
        onToggleFilter,
    } = actions;
    const { hasUnsavedChanges, saving } = editing;
    const { filterActive, filterOpen, search } = filters;
    const canDeleteSelected = selectedCount > 0;
    const hasChanges = hasUnsavedChanges || canDeleteSelected;

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
                        <Filter size={15} strokeWidth={1.8} />
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
                    onClick={onSave}
                    title="Lưu thay đổi"
                    aria-label="Lưu thay đổi"
                    disabled={!hasChanges || saving}
                >
                    <Check size={15} strokeWidth={2.4} />
                </button>
                <button
                    type="button"
                    className={`todo-header-action-btn todo-header-action-btn--cancel ${hasChanges ? "active" : ""}`}
                    onClick={onResetForm}
                    title="Hủy thay đổi"
                    aria-label="Hủy thay đổi"
                    disabled={!hasChanges || saving}
                >
                    <X size={15} strokeWidth={2.4} />
                </button>
                <button
                    type="button"
                    className={`todo-header-action-btn todo-header-action-btn--danger ${canDeleteSelected ? "active" : ""}`}
                    onClick={onDeleteSelected}
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
                    onClick={onAddDraft}
                    title="Tạo task mới"
                >
                    <span>+</span>
                    <span className="sr-only">Tạo task mới</span>
                </button>
            </div>
        </div>
    );
}
