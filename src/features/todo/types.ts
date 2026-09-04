export type TodoStatus = "Todo" | "InProgress" | "Done";
export type TodoPriority = "Low" | "Medium" | "High";

export interface TodoDto {
    id: number;
    title: string;
    description: string | null;
    status: TodoStatus;
    priority: TodoPriority;
    dueDate: string | null;
    createdAt: string;
    updatedAt: string | null;
    isOverdue: boolean;
    completedAt: string | null;
    isCompletedLate: boolean;
    categoryId: number | null;
    categoryName: string | null;
    rowVersion: string;
}

export interface TodoCategoryDto {
    id: number;
    name: string;
}

export interface PagedResult<T> {
    items: T[];
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

export interface TodoQuery {
    search?: string;
    status?: TodoStatus;
    priority?: TodoPriority;
    page?: number;
    pageSize?: number;
    sortBy?: "title" | "priority" | "status" | "duedate" | "createdat";
    isDescending?: boolean;
    isOverdue?: boolean;
    categoryId?: number;
}

export interface SaveTodoRowPayload {
    id: number | null;
    title: string;
    description: string | null;
    priority: TodoPriority | null;
    dueDate: string | null;
    categoryId: number | null;
    isDeleted: boolean;
    rowVersion: string | null;
}

export type SaveTodosPayload = SaveTodoRowPayload[];
