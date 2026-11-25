import api from "./axios.js";
import type {
    PagedResult,
    SaveTodoRowPayload,
    SaveTodosPayload,
    TodoDto,
    TodoNoteDto,
    TodoQuery,
    TodoShareDto,
    TodoStatus,
    TodoUserSummaryDto,
} from "../../features/todo/types.js";

function cleanTodoBatchPayload(payload: SaveTodoRowPayload): SaveTodoRowPayload {
    return {
        id: payload.id,
        title: payload.isDeleted ? payload.title : payload.title.trim(),
        description: payload.description?.trim() || null,
        priority: payload.priority,
        dueDate: payload.dueDate || null,
        categoryId: payload.categoryId || null,
        isDeleted: payload.isDeleted,
        rowVersion: payload.rowVersion,
    };
}

async function requestSaveBatch(payloads: SaveTodosPayload): Promise<void> {
    await api.put("/todos/batch", payloads.map(cleanTodoBatchPayload));
}

export const todoService = {
    async getMine(
        query?: TodoQuery,
        signal?: AbortSignal
    ): Promise<PagedResult<TodoDto>> {
        const response = await api.get<PagedResult<TodoDto>>("/todos/me", {
            params: query,
            ...(signal ? { signal } : {}),
        });

        return response.data;
    },

    async getShared(query?: TodoQuery, signal?: AbortSignal): Promise<PagedResult<TodoDto>> {
        const response = await api.get<PagedResult<TodoDto>>("/todos/shared", {
            params: query,
            ...(signal ? { signal } : {}),
        });
        return response.data;
    },

    async getShares(todoId: number): Promise<TodoShareDto[]> {
        const response = await api.get<TodoShareDto[]>(`/todos/${todoId}/shares`);
        return response.data;
    },

    async replaceShares(todoId: number, userIds: number[]): Promise<void> {
        await api.put(`/todos/${todoId}/shares`, { userIds });
    },

    async getNotes(todoId: number): Promise<TodoNoteDto[]> {
        const response = await api.get<TodoNoteDto[]>(`/todos/${todoId}/notes`);
        return response.data;
    },

    async createNote(todoId: number, content: string): Promise<TodoNoteDto> {
        const response = await api.post<TodoNoteDto>(`/todos/${todoId}/notes`, { content });
        return response.data;
    },

    async getAll(
        query?: TodoQuery,
        signal?: AbortSignal
    ): Promise<PagedResult<TodoDto>> {
        const response = await api.get<PagedResult<TodoDto>>("/todos", {
            params: query,
            ...(signal ? { signal } : {}),
        });

        return response.data;
    },

    async getForUser(
        userId: number,
        query?: TodoQuery,
        signal?: AbortSignal
    ): Promise<PagedResult<TodoDto>> {
        const response = await api.get<PagedResult<TodoDto>>(`/todos/users/${userId}`, {
            params: query,
            ...(signal ? { signal } : {}),
        });

        return response.data;
    },

    async getUsersSummary(
        query: { search: string; page: number; pageSize: number },
        signal?: AbortSignal
    ): Promise<PagedResult<TodoUserSummaryDto>> {
        const response = await api.get<PagedResult<TodoUserSummaryDto>>("/todos/users/summary", {
            params: query,
            ...(signal ? { signal } : {}),
        });

        return response.data;
    },

    async updateStatus(id: number, status: TodoStatus): Promise<void> {
        await api.patch(`/todos/${id}/status`, { status });
    },

    async saveBatch(payloads: SaveTodosPayload): Promise<void> {
        await requestSaveBatch(payloads);
    },
};
