import type {
    SaveTodoRowPayload,
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
export const TODO_PAGE_SIZE_DEFAULT = 6;
export const TODO_PAGE_SIZE_MIN = 4;
export const TODO_PAGE_SIZE_MAX = 10;
export const TODO_ROW_ESTIMATED_HEIGHT = 66;
export const TODO_PANEL_STATIC_HEIGHT = 128;

export type CategoryFilter = "all" | "uncategorized" | `category-${number}`;
export type TodoOverdueFilter = "All" | "Overdue" | "NotOverdue";

export const OVERDUE_FILTER_LABELS: Record<TodoOverdueFilter, string> = {
    All: "All due",
    Overdue: "Overdue",
    NotOverdue: "Not overdue",
};

export interface TodoFormState {
    title: string;
    description: string;
    priority: TodoPriority;
    dueDate: string;
    categoryId: string;
}

export interface TodoInlineDraft extends TodoFormState {
    id: string;
}

export type TodoDialogState =
    | { type: "deleteSelected"; todos: TodoDto[] }
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

let todoInlineDraftId = 0;

export function createTodoInlineDraft(categoryId = ""): TodoInlineDraft {
    todoInlineDraftId += 1;

    return {
        ...emptyForm,
        id: `todo-draft-${Date.now()}-${todoInlineDraftId}`,
        categoryId,
    };
}

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

    return formatDateTick(parseBackendDate(value));
}

function formatDateTick(date: Date) {
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "short",
    }).format(date);
}

export function getPriorityTone(priority: TodoPriority) {
    if (priority === "High") return "todo-priority todo-priority--high";
    if (priority === "Low") return "todo-priority todo-priority--low";
    return "todo-priority";
}

export function toPayload(
    form: TodoFormState
): Omit<SaveTodoRowPayload, "id" | "isDeleted"> {
    return {
        title: form.title,
        description: form.description,
        priority: form.priority,
        dueDate: fromInputDateTime(form.dueDate),
        categoryId: form.categoryId ? Number(form.categoryId) : null,
    };
}

export function toDeletedPayload(todo: TodoDto): SaveTodoRowPayload {
    return {
        id: todo.id,
        title: "",
        description: null,
        priority: null,
        dueDate: null,
        categoryId: null,
        isDeleted: true,
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
