import { useEffect, useMemo, useState } from "react";
import type { TodoDto } from "../types.js";

export function useTodoSelection(visibleTodos: TodoDto[]) {
    const [selectedTodoId, setSelectedTodoId] = useState<number | null>(null);
    const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
    const [selectedDeleteIds, setSelectedDeleteIds] = useState<number[]>([]);

    const selectedTodo = useMemo(
        () => visibleTodos.find((todo) => todo.id === selectedTodoId) ?? null,
        [selectedTodoId, visibleTodos]
    );
    const selectedDeleteTodos = useMemo(
        () => visibleTodos.filter((todo) => selectedDeleteIds.includes(todo.id)),
        [selectedDeleteIds, visibleTodos]
    );

    useEffect(() => {
        if (visibleTodos.length === 0) {
            setSelectedTodoId(null);
            setSelectedDeleteIds([]);
            return;
        }

        setSelectedTodoId((current) => {
            if (current !== null && visibleTodos.some((todo) => todo.id === current)) {
                return current;
            }

            return visibleTodos[0]?.id ?? null;
        });
        setSelectedDeleteIds((current) =>
            current.filter((id) => visibleTodos.some((todo) => todo.id === id))
        );
    }, [visibleTodos]);

    function clearSelectedTodo() {
        setSelectedTodoId(null);
    }

    function resetSelection() {
        setSelectedTodoId(null);
        setSelectedDeleteIds([]);
        setBulkDeleteMode(false);
    }

    function resetDeleteSelection() {
        setSelectedDeleteIds([]);
        setBulkDeleteMode(false);
    }

    function selectTodo(todoId: number) {
        setSelectedTodoId(todoId);
    }

    function toggleBulkDeleteMode() {
        setBulkDeleteMode((current) => !current);
        setSelectedDeleteIds([]);
    }

    function toggleDeleteSelection(todoId: number) {
        setSelectedDeleteIds((current) =>
            current.includes(todoId)
                ? current.filter((id) => id !== todoId)
                : [...current, todoId]
        );
    }

    function removeDeletedTodo(todoId: number) {
        setSelectedDeleteIds((current) => current.filter((id) => id !== todoId));
        setSelectedTodoId((current) => (current === todoId ? null : current));
    }

    function removeDeletedTodos(todoIds: number[]) {
        setSelectedDeleteIds([]);
        setBulkDeleteMode(false);
        setSelectedTodoId((current) =>
            current !== null && todoIds.includes(current) ? null : current
        );
    }

    return {
        selectedDeleteTodos,
        selectedTodo,
        selection: {
            selectedTodoId: selectedTodo?.id ?? null,
            bulkDeleteMode,
            selectedDeleteIds,
        },
        actions: {
            clearSelectedTodo,
            removeDeletedTodo,
            removeDeletedTodos,
            resetDeleteSelection,
            resetSelection,
            selectTodo,
            toggleBulkDeleteMode,
            toggleDeleteSelection,
        },
    };
}
