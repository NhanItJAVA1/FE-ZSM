import { X } from "lucide-react";
import { TodoDraftRow, TodoRow } from "./TodoTableRows.js";
import type {
    TodoPanelActions,
    TodoPanelData,
    TodoPanelEditing,
    TodoPanelFilters,
    TodoPanelSelection,
} from "./todoPanelTypes.js";

interface TodoTableProps {
    actions: TodoPanelActions;
    data: TodoPanelData;
    editing: TodoPanelEditing;
    filters: Pick<TodoPanelFilters, "filterActive" | "search">;
    selection: TodoPanelSelection;
}

export default function TodoTable({
    actions,
    data,
    editing,
    filters,
    selection,
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
                                        className={`todo-delete-checkbox todo-delete-checkbox--head ${selection.selectedIds.length > 0 ? "active" : ""}`}
                                        title={selection.selectedIds.length > 0 ? "Bỏ chọn tất cả" : "Chọn tất cả task trên trang"}
                                        aria-label={selection.selectedIds.length > 0 ? "Bỏ chọn tất cả task trên trang" : "Chọn tất cả task trên trang"}
                                        onClick={
                                            selection.selectedIds.length > 0
                                                ? actions.onClearDeleteSelection
                                                : actions.onSelectPage
                                        }
                                    >
                                        {selection.selectedIds.length > 0 && (
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
                                    selection={selection}
                                    todo={todo}
                                    onSelectRow={actions.onSelectRow}
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
