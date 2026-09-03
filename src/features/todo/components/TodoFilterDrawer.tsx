import type { TodoPriority } from "../types.js";
import {
    OVERDUE_FILTER_LABELS,
    PRIORITIES,
    STATUSES,
    STATUS_LABELS,
    getPriorityTone,
    type TodoOverdueFilter,
} from "../todoPageUtils.js";
import type { TodoPanelActions, TodoPanelData, TodoPanelFilters } from "./todoPanelTypes.js";

interface TodoFilterDrawerProps {
    actions: Pick<
        TodoPanelActions,
        "onSetOverdueFilter" | "onSetPriorityFilter" | "onSetStatusFilter"
    >;
    counts: TodoPanelData["counts"];
    filters: Pick<
        TodoPanelFilters,
        "overdueFilter" | "priorityFilter" | "statusFilter"
    >;
}

export default function TodoFilterDrawer({
    actions,
    counts,
    filters,
}: TodoFilterDrawerProps) {
    const {
        onSetOverdueFilter,
        onSetPriorityFilter,
        onSetStatusFilter,
    } = actions;
    const { overdueFilter, priorityFilter, statusFilter } = filters;

    return (
        <div className="todo-filter-drawer todo-filter-drawer--wide">
            <div className="todo-filter-group">
                <span>Status</span>
                <div>
                    <button
                        type="button"
                        className={`todo-filter-option ${statusFilter === "All" ? "active" : ""}`}
                        onClick={() => onSetStatusFilter("All")}
                    >
                        <span>All status</span>
                        <small>{counts.all}</small>
                    </button>
                    {STATUSES.map((status) => (
                        <button
                            key={status}
                            type="button"
                            className={`todo-filter-option ${statusFilter === status ? "active" : ""}`}
                            onClick={() => onSetStatusFilter(status)}
                        >
                            <span>
                                <i className={`todo-status-dot todo-status-dot--${status}`} />
                                {STATUS_LABELS[status]}
                            </span>
                            <small>
                                {status === "Todo" && counts.todo}
                                {status === "InProgress" && counts.progress}
                                {status === "Done" && counts.done}
                            </small>
                        </button>
                    ))}
                </div>
            </div>

            <div className="todo-filter-group">
                <span>Priority</span>
                <div>
                    <button
                        type="button"
                        className={`todo-filter-option ${priorityFilter === "All" ? "active" : ""}`}
                        onClick={() => onSetPriorityFilter("All")}
                    >
                        <span>All priority</span>
                    </button>
                    {PRIORITIES.map((priority: TodoPriority) => (
                        <button
                            key={priority}
                            type="button"
                            className={`todo-filter-option ${priorityFilter === priority ? "active" : ""}`}
                            onClick={() => onSetPriorityFilter(priority)}
                        >
                            <span className={getPriorityTone(priority)}>{priority}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="todo-filter-group">
                <span>Due state</span>
                <div>
                    {(Object.keys(OVERDUE_FILTER_LABELS) as TodoOverdueFilter[]).map((filter) => (
                        <button
                            key={filter}
                            type="button"
                            className={`todo-filter-option ${overdueFilter === filter ? "active" : ""}`}
                            onClick={() => onSetOverdueFilter(filter)}
                        >
                            <span>{OVERDUE_FILTER_LABELS[filter]}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
