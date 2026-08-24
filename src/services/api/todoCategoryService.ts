import api from "./axios.js";
import type { TodoCategoryDto } from "../../features/todo/types.js";

export const todoCategoryService = {
    async getAll(): Promise<TodoCategoryDto[]> {
        const response = await api.get<TodoCategoryDto[]>("/todo-categories");

        return response.data;
    },

    async create(name: string): Promise<void> {
        await api.post("/todo-categories", { name: name.trim() });
    },

    async update(id: number, name: string): Promise<void> {
        await api.put(`/todo-categories/${id}`, { name: name.trim() });
    },

    async delete(id: number, deleteTodos = false): Promise<void> {
        await api.delete(`/todo-categories/${id}`, {
            params: { deleteTodos },
        });
    },
};
