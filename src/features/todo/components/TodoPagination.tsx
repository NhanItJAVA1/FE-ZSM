import type { TodoPanelActions, TodoPanelPagination } from "./todoPanelTypes.js";

interface TodoPaginationProps {
    onSetPage: TodoPanelActions["onSetPage"];
    pagination: TodoPanelPagination;
}

export default function TodoPagination({
    onSetPage,
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
                    onSetPage((prev) =>
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
                    onSetPage((prev) =>
                        Math.min(totalPages, prev + 1)
                    )
                }
            >
                Next
            </button>
        </div>
    );
}
