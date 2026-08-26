import type { Dispatch, SetStateAction } from "react";
import type { TodoActivityDto, TodoDto, TodoPriority, TodoStatus } from "../types.js";
import {
    ACTIVITY_PAGE_SIZE,
    OVERDUE_FILTER_LABELS,
    PRIORITIES,
    STATUSES,
    STATUS_LABELS,
    formatFullDate,
    getPriorityTone,
    type TodoCounts,
    type TodoOverdueFilter,
} from "../todoPageUtils.js";

interface TodoDetailPanelProps {
    activities: TodoActivityDto[];
    activityPage: number;
    activitiesLoading: boolean;
    clearFiltersVisible: boolean;
    counts: TodoCounts;
    filterActive: boolean;
    historyOpen: boolean;
    overdueFilter: TodoOverdueFilter;
    paginatedActivities: TodoActivityDto[];
    priorityFilter: TodoPriority | "All";
    selectedTodo: TodoDto | null;
    statusFilter: TodoStatus | "All";
    statusFilterLabel: string;
    statusFilterOpen: boolean;
    totalActivityPages: number;
    onClearAdvancedFilters: () => void;
    onClearFilters: () => void;
    onSetActivityPage: Dispatch<SetStateAction<number>>;
    onSetHistoryOpen: Dispatch<SetStateAction<boolean>>;
    onSetOverdueFilter: (filter: TodoOverdueFilter) => void;
    onSetPriorityFilter: (priority: TodoPriority | "All") => void;
    onSetStatusFilter: (status: TodoStatus | "All") => void;
    onToggleFilter: () => void;
}

export default function TodoDetailPanel({
    activities,
    activityPage,
    activitiesLoading,
    clearFiltersVisible,
    counts,
    filterActive,
    historyOpen,
    overdueFilter,
    paginatedActivities,
    priorityFilter,
    selectedTodo,
    statusFilter,
    statusFilterLabel,
    statusFilterOpen,
    totalActivityPages,
    onClearAdvancedFilters,
    onClearFilters,
    onSetActivityPage,
    onSetHistoryOpen,
    onSetOverdueFilter,
    onSetPriorityFilter,
    onSetStatusFilter,
    onToggleFilter,
}: TodoDetailPanelProps) {
    if (!selectedTodo) {
        return (
            <aside className="todo-detail-panel todo-detail-panel--empty">
                <div>
                    <p className="eyebrow">No task selected</p>
                    <p>no data</p>
                </div>
                {clearFiltersVisible && (
                    <button
                        type="button"
                        className="ghost-btn"
                        onClick={onClearFilters}
                    >
                        Bỏ filter
                    </button>
                )}
            </aside>
        );
    }

    return (
        <aside className="todo-detail-panel">
            <div className="todo-detail-overview">
                <div className="todo-detail-summary">
                    <span className={getPriorityTone(selectedTodo.priority)}>
                        {selectedTodo.priority}
                    </span>
                    <h3>{selectedTodo.title}</h3>
                    <p>{selectedTodo.description || "Task này chưa có mô tả."}</p>
                </div>

                <dl className="todo-detail-grid">
                    <div>
                        <dt>Start</dt>
                        <dd>{formatFullDate(selectedTodo.createdAt)}</dd>
                    </div>
                    <div>
                        <dt>Due</dt>
                        <dd>{formatFullDate(selectedTodo.dueDate)}</dd>
                    </div>
                    <div>
                        <dt>Category</dt>
                        <dd>{selectedTodo.categoryName || "others"}</dd>
                    </div>
                    <div>
                        <dt>Status</dt>
                        <dd>{STATUS_LABELS[selectedTodo.status]}</dd>
                    </div>
                </dl>
            </div>

            <div className="todo-status-actions">
                <div className="todo-filter-menu">
                    <button
                        type="button"
                        className={`todo-filter-trigger ${statusFilterOpen ? "active" : ""}`}
                        onClick={onToggleFilter}
                        aria-expanded={statusFilterOpen}
                        aria-label="Chọn filter trạng thái"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M4 5h16l-6.4 7.3v4.9l-3.2 1.8v-6.7L4 5Z" />
                        </svg>
                    </button>
                    {statusFilterOpen && (
                        <div className="todo-filter-drawer todo-filter-drawer--wide">
                            <div className="todo-filter-group">
                                <span>Status</span>
                                <div>
                                    <button
                                        type="button"
                                        className={`todo-filter-option ${statusFilter === "All" ? "active" : ""}`}
                                        onClick={() => {
                                            onSetStatusFilter("All");
                                        }}
                                    >
                                        <span>All status</span>
                                        <small>{counts.all}</small>
                                    </button>
                                    {STATUSES.map((status) => (
                                        <button
                                            key={status}
                                            type="button"
                                            className={`todo-filter-option ${statusFilter === status ? "active" : ""}`}
                                            onClick={() => {
                                                onSetStatusFilter(status);
                                            }}
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
                                    {PRIORITIES.map((priority) => (
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
                    )}
                </div>
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
                <span className="todo-status-filter-tab">
                    Filter: {statusFilterLabel}
                </span>
                <button
                    type="button"
                    className={`todo-history-eye-btn ${historyOpen ? "active" : ""}`}
                    onClick={() => onSetHistoryOpen((current) => !current)}
                    title={historyOpen ? "Ẩn lịch sử" : "Xem lịch sử"}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
                        <circle cx="12" cy="12" r="2.5" />
                    </svg>
                    <span className="sr-only">
                        {historyOpen ? "Ẩn lịch sử" : "Xem lịch sử"}
                    </span>
                </button>
            </div>

            {historyOpen && (
                <div className="todo-activity-log">
                    <div className="todo-activity-heading">
                        <h4>Activity</h4>
                        <button
                            type="button"
                            className="ghost-btn"
                            onClick={() => onSetHistoryOpen(false)}
                        >
                            Ẩn
                        </button>
                    </div>
                    {activitiesLoading && <p>Đang tải activity...</p>}
                    {paginatedActivities.map((activity) => (
                        <div key={activity.id}>
                            <span>{activity.type}</span>
                            <p>{activity.description}</p>
                            <small>{formatFullDate(activity.createdAt)}</small>
                        </div>
                    ))}
                    {!activitiesLoading && activities.length === 0 && (
                        <p>Chưa có activity.</p>
                    )}
                    {!activitiesLoading && activities.length > ACTIVITY_PAGE_SIZE && (
                        <div className="todo-activity-pagination">
                            <button
                                type="button"
                                className="ghost-btn"
                                disabled={activityPage === 1}
                                onClick={() =>
                                    onSetActivityPage((current) =>
                                        Math.max(1, current - 1)
                                    )
                                }
                            >
                                Prev
                            </button>
                            <span>
                                {activityPage} / {totalActivityPages}
                            </span>
                            <button
                                type="button"
                                className="ghost-btn"
                                disabled={activityPage === totalActivityPages}
                                onClick={() =>
                                    onSetActivityPage((current) =>
                                        Math.min(totalActivityPages, current + 1)
                                    )
                                }
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
        </aside>
    );
}
