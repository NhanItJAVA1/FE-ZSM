import type { TodoPanelActions, TodoPanelPagination } from "./todoPanelTypes.js";

interface TodoPaginationProps {
    actions: Pick<TodoPanelActions, "onSetTaskPage">;
    pagination: TodoPanelPagination;
}

export default function TodoPagination({
    actions,
    pagination,
}: TodoPaginationProps) {
    const { taskPage, totalTaskPages } = pagination;

    if (totalTaskPages <= 1) return null;

    return (
        <div className="todo-list-pagination">
            <button
                type="button"
                className="ghost-btn"
                disabled={taskPage === 1}
                onClick={() =>
                    actions.onSetTaskPage((current) =>
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
                    actions.onSetTaskPage((current) =>
                        Math.min(totalTaskPages, current + 1)
                    )
                }
            >
                Next
            </button>
        </div>
    );
}
