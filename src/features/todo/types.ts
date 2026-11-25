export type TodoStatus = "Todo" | "InProgress" | "Done";
export type TodoPriority = "Low" | "Medium" | "High";

export interface TodoDto {
    id: number;
    ownerDisplayName: string;
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

export type TodoView =
    | { type: "mine" }
    | { type: "shared" }
    | { type: "user"; userId: number };

export interface TodoShareDto {
    sharedWithUserId: number;
    createdAt: string;
}

export interface TodoNoteDto {
    id: number;
    todoId: number;
    userId: number;
    displayName: string;
    content: string;
    createdAt: string;
}

export interface TodoUserSummaryDto {
    userId: number;
    displayName: string;
    email: string;
    todoCount: number;
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
