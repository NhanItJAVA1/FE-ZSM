import api from "./axios.js";
import type {
    CreateTodoPayload,
    PagedResult,
    TodoActivityDto,
    TodoDto,
    TodoQuery,
    TodoStatus,
    UpdateTodoPayload,
} from "../../features/todo/types.js";

function cleanTodoPayload<T extends CreateTodoPayload>(payload: T) {
    return {
        title: payload.title.trim(),
        description: payload.description?.trim() || null,
        priority: payload.priority ?? "Medium",
        dueDate: payload.dueDate || null,
        categoryId: payload.categoryId || null,
    };
}

export const todoService = {
    async getAll(query?: TodoQuery): Promise<PagedResult<TodoDto>> {
        const response = await api.get<PagedResult<TodoDto>>("/todos", {
            params: query,
        });

        return response.data;
    },

    async create(payload: CreateTodoPayload): Promise<void> {
        await api.post("/todos", cleanTodoPayload(payload));
    },

    async update(id: number, payload: UpdateTodoPayload): Promise<void> {
        await api.put(`/todos/${id}`, cleanTodoPayload(payload));
    },

    async updateStatus(id: number, status: TodoStatus): Promise<void> {
        await api.patch(`/todos/${id}/status`, { status });
    },

    async delete(id: number): Promise<void> {
        await api.delete(`/todos/${id}`);
    },

    async getActivities(id: number): Promise<TodoActivityDto[]> {
        const response = await api.get<TodoActivityDto[]>(
            `/todos/${id}/activities`
        );

        return response.data;
    },
};
