import { useEffect, useMemo, useState } from "react";
import type { TodoDto } from "../types.js";

export function useTodoSelection(visibleTodos: TodoDto[]) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const selectedRows = useMemo(
        () => visibleTodos.filter((todo) => selectedIds.includes(todo.id)),
        [selectedIds, visibleTodos]
    );

    useEffect(() => {
        if (visibleTodos.length === 0) {
            setSelectedIds([]);
            return;
        }

        setSelectedIds((prev) =>
            prev.filter((id) => visibleTodos.some((todo) => todo.id === id))
        );
    }, [visibleTodos]);

    function resetSelection() {
        setSelectedIds([]);
    }

    function resetDeleteSelection() {
        setSelectedIds([]);
    }

    function clearDeleteSelection() {
        setSelectedIds([]);
    }

    function selectPage() {
        setSelectedIds(visibleTodos.map((todo) => todo.id));
    }

    function toggleSelection(id: number) {
        setSelectedIds((prev) =>
            prev.includes(id)
                ? prev.filter((selectedId) => selectedId !== id)
                : [...prev, id]
        );
    }

    function removeDeletedTodos() {
        setSelectedIds([]);
    }

    return {
        selectedRows,
        selection: {
            selectedIds,
        },
        actions: {
            clearDeleteSelection,
            removeDeletedTodos,
            resetDeleteSelection,
            resetSelection,
            selectPage,
            toggleSelection,
        },
    };
}
