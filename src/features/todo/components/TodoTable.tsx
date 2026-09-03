import { X } from "lucide-react";
import { TodoDraftRow, TodoRow } from "./TodoTableRows.js";
import type {
    TodoPanelActions,
    TodoPanelData,
    TodoPanelEditing,
    TodoPanelFilters,
} from "./todoPanelTypes.js";

interface TodoTableProps {
    actions: TodoPanelActions;
    data: TodoPanelData;
    editing: TodoPanelEditing;
    filters: Pick<TodoPanelFilters, "filterActive" | "search">;
    selectedIds: number[];
}

export default function TodoTable({
    actions,
    data,
    editing,
    filters,
    selectedIds,
}: TodoTableProps) {
    const {
        categories,
        loading,
        rows,
        totalRows,
    } = data;
    const { editedRows, formError, drafts } = editing;
    const showDrafts = drafts.length > 0;
    const showTaskTable = totalRows > 0 || showDrafts;
    const hasSelectedRows = selectedIds.length > 0;

    return (
        <div className="todo-left-stage">
            <div className="todo-list-layer">
                <div className="todo-category-list">
                    {loading && <div className="empty-state">Đang tải todo...</div>}

                    {!loading && totalRows === 0 && !showDrafts && (
                        <div className="empty-state empty-state--composed">
                            <p className="empty-state-desc">Hãy tạo task đầu tiên!</p>
                            {(filters.search || filters.filterActive) && (
                                <button
                                    type="button"
                                    className="ghost-btn"
                                    onClick={actions.onClearFilters}
                                >
                                    Bỏ filter
                                </button>
                            )}
                        </div>
                    )}

                    {!loading && showTaskTable && (
                        <div className="todo-task-list">
                            <div className="todo-task-table-head">
                                <span className="todo-task-name-head">
                                    <button
                                        type="button"
                                        className={`todo-delete-checkbox todo-delete-checkbox--head ${hasSelectedRows ? "active" : ""}`}
                                        title={hasSelectedRows ? "Bỏ chọn tất cả" : "Chọn tất cả task trên trang"}
                                        aria-label={hasSelectedRows ? "Bỏ chọn tất cả task trên trang" : "Chọn tất cả task trên trang"}
                                        onClick={
                                            hasSelectedRows
                                                ? actions.onClearDeleteSelection
                                                : actions.onSelectPage
                                        }
                                    >
                                        {hasSelectedRows && (
                                            <X size={13} strokeWidth={2.5} />
                                        )}
                                    </button>
                                    <span>Task Name</span>
                                </span>
                                <span>Description</span>
                                <span>Duedate</span>
                                <span>Labels</span>
                            </div>
                            {formError && (
                                <p className="todo-inline-error">{formError}</p>
                            )}
                            {drafts.map((draft, index) => (
                                <TodoDraftRow
                                    key={draft.id}
                                    categories={categories}
                                    draft={draft}
                                    index={index}
                                    totalDrafts={drafts.length}
                                    onRemoveDraft={actions.onRemoveDraft}
                                    onUpdateDraft={actions.onUpdateDraft}
                                />
                            ))}
                            {rows.map((todo) => (
                                <TodoRow
                                    key={todo.id}
                                    categories={categories}
                                    editedRows={editedRows}
                                    isDeleteSelected={selectedIds.includes(todo.id)}
                                    todo={todo}
                                    onUpdateRow={actions.onUpdateRow}
                                    onToggleSelection={actions.onToggleSelection}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
