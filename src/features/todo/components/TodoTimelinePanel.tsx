import type { CSSProperties, ReactNode } from "react";
import type { TodoDto } from "../types.js";
import {
    STATUS_LABELS,
    formatTimelineTick,
    getTimelineStyle,
    type TodoCounts,
} from "../todoPageUtils.js";

interface TodoTimelinePanelProps {
    children: ReactNode;
    clearFiltersVisible: boolean;
    loading: boolean;
    selectedTodoId: number | null;
    timeline: {
        start: Date;
        end: Date;
        ticks: Date[];
    };
    timelineGridStyle: CSSProperties;
    todos: TodoDto[];
    visibleCounts: TodoCounts;
    onClearFilters: () => void;
    onSelectTodo: (todoId: number) => void;
}

export default function TodoTimelinePanel({
    children,
    clearFiltersVisible,
    loading,
    selectedTodoId,
    timeline,
    timelineGridStyle,
    todos,
    visibleCounts,
    onClearFilters,
    onSelectTodo,
}: TodoTimelinePanelProps) {
    return (
        <section className="todo-timeline-panel">
            <div className="todo-timeline-header">
                <div>
                    <p className="eyebrow">Schedule</p>
                    {/* <h2>Schedule map</h2> */}
                </div>
                <div className="todo-timeline-legend">
                    <span><i className="todo-status-dot todo-status-dot--Todo" />Todo</span>
                    <span><i className="todo-status-dot todo-status-dot--InProgress" />In progress</span>
                    <span><i className="todo-status-dot todo-status-dot--Done" />Done</span>
                </div>
            </div>

            <div className="todo-board-summary">
                <span><b>{visibleCounts.todo}</b> Todo</span>
                <span><b>{visibleCounts.progress}</b> In progress</span>
                <span><b>{visibleCounts.done}</b> Done</span>
            </div>

            <div className="todo-timeline" style={timelineGridStyle}>
                <div className="todo-timeline-axis">
                    <span>Task</span>
                    {timeline.ticks.map((tick) => (
                        <span key={tick.toISOString()}>{formatTimelineTick(tick)}</span>
                    ))}
                </div>

                <div className="todo-timeline-rows">
                    {todos.map((todo) => (
                        <button
                            type="button"
                            key={todo.id}
                            className={`todo-timeline-row ${selectedTodoId === todo.id ? "active" : ""}`}
                            onClick={() => onSelectTodo(todo.id)}
                        >
                            <span className="todo-timeline-title">
                                <b>{todo.title}</b>
                                <small>{todo.categoryName || "others"}</small>
                            </span>
                            <span className="todo-timeline-track">
                                {timeline.ticks.map((tick) => (
                                    <i key={tick.toISOString()} />
                                ))}
                                <span
                                    className={`todo-timeline-bar todo-timeline-bar--${todo.status}`}
                                    style={getTimelineStyle(todo, timeline.start, timeline.end)}
                                >
                                    {STATUS_LABELS[todo.status]}
                                </span>
                            </span>
                        </button>
                    ))}
                    {!loading && todos.length === 0 && (
                        <div className="todo-timeline-empty">
                            <p>no data</p>
                            {clearFiltersVisible && (
                                <button
                                    type="button"
                                    className="ghost-btn"
                                    onClick={onClearFilters}
                                >
                                    Bỏ filter
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {children}
        </section>
    );
}
