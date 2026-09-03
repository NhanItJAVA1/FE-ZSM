import { Check } from "lucide-react";
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
        paginatedTodos,
        visibleTodosLength,
    } = data;
    const { editedTodoRows, formError, inlineDrafts } = editing;
    const showDrafts = inlineDrafts.length > 0;
    const showTaskTable = visibleTodosLength > 0 || showDrafts;

    return (
        <div className="todo-left-stage">
            <div className="todo-list-layer">
                <div className="todo-category-list">
                    {loading && <div className="empty-state">Đang tải todo...</div>}

                    {!loading && visibleTodosLength === 0 && !showDrafts && (
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
                                <span>Task Name</span>
                                <span>Description</span>
                                <span>Duedate</span>
                                <span>Labels</span>
                                <span className="todo-task-delete-head">
                                    <button
                                        type="button"
                                        className={`todo-bulk-select-trigger ${selection.bulkDeleteMode ? "active" : ""}`}
                                        title={selection.bulkDeleteMode ? "Tắt chọn nhiều" : "Chọn nhiều để xóa"}
                                        aria-label={selection.bulkDeleteMode ? "Tắt chọn nhiều" : "Chọn nhiều để xóa"}
                                        onClick={actions.onToggleBulkDeleteMode}
                                    >
                                        <Check size={13} strokeWidth={2.5} />
                                    </button>
                                </span>
                            </div>
                            {formError && (
                                <p className="todo-inline-error">{formError}</p>
                            )}
                            {inlineDrafts.map((draft, index) => (
                                <TodoDraftRow
                                    key={draft.id}
                                    categories={categories}
                                    draft={draft}
                                    index={index}
                                    totalDrafts={inlineDrafts.length}
                                    onRemoveInlineDraft={actions.onRemoveInlineDraft}
                                    onSetInlineDraft={actions.onSetInlineDraft}
                                />
                            ))}
                            {paginatedTodos.map((todo) => (
                                <TodoRow
                                    key={todo.id}
                                    categories={categories}
                                    editedTodoRows={editedTodoRows}
                                    selection={selection}
                                    todo={todo}
                                    onDeleteTodo={actions.onDeleteTodo}
                                    onSelectTodo={actions.onSelectTodo}
                                    onSetTodoRow={actions.onSetTodoRow}
                                    onToggleDeleteSelection={actions.onToggleDeleteSelection}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
