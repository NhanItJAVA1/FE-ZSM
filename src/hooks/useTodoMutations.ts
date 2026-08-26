import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../constants/queryKeys.js";
import { todoCategoryService } from "../services/api/todoCategoryService.js";
import { todoService } from "../services/api/todoService.js";
import { useAppSelector } from "../stores/hook.js";
import type {
    CreateTodosPayload,
    TodoStatus,
    UpdateTodoPayload,
} from "../features/todo/types.js";

export function useTodoMutations() {
    const queryClient = useQueryClient();
    const userId = useAppSelector((state) => state.auth.user?.id);

    function invalidateTodos() {
        if (!userId) return;

        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todos(userId) });
        void queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.todoCategories(userId),
        });
    }

    const createTodo = useMutation({
        mutationFn: (payloads: CreateTodosPayload) => todoService.create(payloads),
        onSuccess: invalidateTodos,
    });

    const updateTodo = useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: number;
            payload: UpdateTodoPayload;
        }) => todoService.update(id, payload),
        onSuccess: invalidateTodos,
    });

    const updateStatus = useMutation({
        mutationFn: ({ id, status }: { id: number; status: TodoStatus }) =>
            todoService.updateStatus(id, status),
        onSuccess: (_data, variables) => {
            invalidateTodos();
            if (userId) {
                void queryClient.invalidateQueries({
                    queryKey: QUERY_KEYS.todoActivities(userId, variables.id),
                });
            }
        },
    });

    const deleteTodo = useMutation({
        mutationFn: (id: number) => todoService.delete(id),
        onSuccess: invalidateTodos,
    });

    const createCategory = useMutation({
        mutationFn: (name: string) => todoCategoryService.create(name),
        onSuccess: invalidateTodos,
    });

    const updateCategory = useMutation({
        mutationFn: ({ id, name }: { id: number; name: string }) =>
            todoCategoryService.update(id, name),
        onSuccess: invalidateTodos,
    });

    const deleteCategory = useMutation({
        mutationFn: ({
            id,
            deleteTodos,
        }: {
            id: number;
            deleteTodos: boolean;
        }) => todoCategoryService.delete(id, deleteTodos),
        onSuccess: invalidateTodos,
    });

    return {
        createTodo,
        updateTodo,
        updateStatus,
        deleteTodo,
        createCategory,
        updateCategory,
        deleteCategory,
    };
}
