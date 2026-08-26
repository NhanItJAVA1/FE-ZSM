import type {
    CreateTodoPayload,
    TodoCategoryDto,
    TodoDto,
    TodoPriority,
    TodoStatus,
} from "./types.js";

export const STATUS_LABELS: Record<TodoStatus, string> = {
    Todo: "Todo",
    InProgress: "In progress",
    Done: "Done",
};

export const PRIORITIES: TodoPriority[] = ["Low", "Medium", "High"];
export const STATUSES: TodoStatus[] = ["Todo", "InProgress", "Done"];
export const LEFT_TASK_PAGE_SIZE = 10;
export const ACTIVITY_PAGE_SIZE = 5;

const DAY_MS = 86_400_000;

export type CategoryFilter = "all" | "uncategorized" | `category-${number}`;

export interface TodoFormState {
    title: string;
    description: string;
    priority: TodoPriority;
    dueDate: string;
    categoryId: string;
}

export type TodoDialogState =
    | { type: "deleteTodo"; todo: TodoDto }
    | { type: "deleteCategory"; category: TodoCategoryDto }
    | { type: "renameCategory"; category: TodoCategoryDto }
    | null;

export interface TodoCounts {
    all: number;
    todo: number;
    progress: number;
    done: number;
    overdue: number;
}

export const emptyForm: TodoFormState = {
    title: "",
    description: "",
    priority: "Medium",
    dueDate: "",
    categoryId: "",
};

export function parseBackendDate(value: string) {
    const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
    return new Date(hasTimezone ? value : `${value}Z`);
}

export function toInputDateTime(value: string | null) {
    if (!value) return "";
    const date = parseBackendDate(value);
    if (Number.isNaN(date.getTime())) return "";

    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60_000);
    return local.toISOString().slice(0, 16);
}

function fromInputDateTime(value: string) {
    return value ? new Date(value).toISOString() : null;
}

export function formatShortDate(value: string | null) {
    if (!value) return "No due date";

    return formatTimelineTick(parseBackendDate(value));
}

export function formatTimelineTick(date: Date) {
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "short",
    }).format(date);
}

export function formatFullDate(value: string | null) {
    if (!value) return "Chưa có hạn";

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(parseBackendDate(value));
}

export function getPriorityTone(priority: TodoPriority) {
    if (priority === "High") return "todo-priority todo-priority--high";
    if (priority === "Low") return "todo-priority todo-priority--low";
    return "todo-priority";
}

export function getNextStatusAction(status: TodoStatus): {
    label: string;
    nextStatus: TodoStatus;
} {
    if (status === "Todo") {
        return { label: "Start", nextStatus: "InProgress" };
    }

    if (status === "InProgress") {
        return { label: "Done", nextStatus: "Done" };
    }

    return { label: "Reopen", nextStatus: "InProgress" };
}

export function toPayload(form: TodoFormState): CreateTodoPayload {
    return {
        title: form.title,
        description: form.description,
        priority: form.priority,
        dueDate: fromInputDateTime(form.dueDate),
        categoryId: form.categoryId ? Number(form.categoryId) : null,
    };
}

export function buildTimelineDates(todos: TodoDto[]) {
    const dates = todos.flatMap((todo) => [
        parseBackendDate(todo.createdAt).getTime(),
        todo.dueDate ? parseBackendDate(todo.dueDate).getTime() : NaN,
    ]).filter((value) => !Number.isNaN(value));

    const now = Date.now();
    const min = dates.length ? Math.min(...dates) : now;
    const max = dates.length ? Math.max(...dates) : now + 3 * DAY_MS;
    const start = new Date(min);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 1);

    const end = new Date(max);
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 2);

    if (end.getTime() - start.getTime() < 3 * DAY_MS) {
        end.setTime(start.getTime() + 3 * DAY_MS);
    }

    const ticks: Date[] = [];
    const cursor = new Date(start);
    while (cursor < end) {
        ticks.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    return { start, end, ticks };
}

export function getTimelineStyle(todo: TodoDto, start: Date, end: Date) {
    const startMs = start.getTime();
    const range = Math.max(end.getTime() - startMs, 1);
    const taskStart = parseBackendDate(todo.createdAt).getTime();
    const taskEnd = todo.dueDate
        ? parseBackendDate(todo.dueDate).getTime()
        : taskStart + 12 * 60 * 60 * 1000;
    const left = Math.max(0, ((taskStart - startMs) / range) * 100);
    const right = Math.min(100, ((Math.max(taskEnd, taskStart + 3_600_000) - startMs) / range) * 100);
    const width = Math.max(8, right - left);

    return {
        left: `${left}%`,
        width: `${Math.min(width, 100 - left)}%`,
    };
}

export function getCategoryFilterId(categoryId: number): CategoryFilter {
    return `category-${categoryId}`;
}

export function getCategoryIdFromFilter(filter: CategoryFilter) {
    if (!filter.startsWith("category-")) return null;
    return Number(filter.replace("category-", ""));
}

export function countTodos(todos: TodoDto[]): TodoCounts {
    return {
        all: todos.length,
        todo: todos.filter((todo) => todo.status === "Todo").length,
        progress: todos.filter((todo) => todo.status === "InProgress").length,
        done: todos.filter((todo) => todo.status === "Done").length,
        overdue: todos.filter((todo) => todo.isOverdue).length,
    };
}
