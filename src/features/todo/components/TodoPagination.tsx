import type { TodoPanelActions, TodoPanelPagination } from "./todoPanelTypes.js";

interface TodoPaginationProps {
    actions: Pick<TodoPanelActions, "onSetPage">;
    pagination: TodoPanelPagination;
}

export default function TodoPagination({
    actions,
    pagination,
}: TodoPaginationProps) {
    const { page, totalPages } = pagination;

    if (totalPages <= 1) return null;

    return (
        <div className="todo-list-pagination">
            <button
                type="button"
                className="ghost-btn"
                disabled={page === 1}
                onClick={() =>
                    actions.onSetPage((prev) =>
                        Math.max(1, prev - 1)
                    )
                }
            >
                Prev
            </button>
            <span>
                {page} / {totalPages}
            </span>
            <button
                type="button"
                className="ghost-btn"
                disabled={page === totalPages}
                onClick={() =>
                    actions.onSetPage((prev) =>
                        Math.min(totalPages, prev + 1)
                    )
                }
            >
                Next
            </button>
        </div>
    );
}
