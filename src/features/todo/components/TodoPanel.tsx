import TodoPagination from "./TodoPagination.js";
import TodoPanelToolbar from "./TodoPanelToolbar.js";
import TodoTable from "./TodoTable.js";
import type { TodoPanelProps } from "./todoPanelTypes.js";

export default function TodoPanel({
    actions,
    data,
    editing,
    filters,
    leftPanelRef,
    pagination,
    selection,
}: TodoPanelProps) {
    return (
        <section
            className="todo-left-panel todo-left-panel--inline"
            ref={leftPanelRef}
        >
            <TodoPanelToolbar
                actions={actions}
                counts={data.counts}
                editing={editing}
                filters={filters}
                selectedCount={selection.selectedIds.length}
            />
            <TodoTable
                actions={actions}
                data={data}
                editing={editing}
                filters={{
                    filterActive: filters.filterActive,
                    search: filters.search,
                }}
                selectedIds={selection.selectedIds}
            />
            <TodoPagination
                onSetPage={actions.onSetPage}
                pagination={pagination}
            />
        </section>
    );
}
