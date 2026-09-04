import api from "./axios.js";
import type {
    PagedResult,
    SaveTodoRowPayload,
    SaveTodosPayload,
    TodoDto,
    TodoQuery,
    TodoStatus,
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

    async updateStatus(id: number, status: TodoStatus): Promise<void> {
        await api.patch(`/todos/${id}/status`, { status });
    },

    async saveBatch(payloads: SaveTodosPayload): Promise<void> {
        await requestSaveBatch(payloads);
    },
};
