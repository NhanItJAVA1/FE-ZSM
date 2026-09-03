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
                selection={selection}
            />
            <TodoTable
                actions={actions}
                data={data}
                editing={editing}
                filters={{
                    filterActive: filters.filterActive,
                    search: filters.search,
                }}
                selection={selection}
            />
            <TodoPagination
                actions={{ onSetTaskPage: actions.onSetTaskPage }}
                pagination={pagination}
            />
        </section>
    );
}
