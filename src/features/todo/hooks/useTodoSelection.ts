import { useEffect, useMemo, useState } from "react";
import type { TodoDto } from "../types.js";

export function useTodoSelection(visibleTodos: TodoDto[], enabled = true) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const selectedRows = useMemo(
        () => visibleTodos.filter((todo) => selectedIds.includes(todo.id)),
        [selectedIds, visibleTodos]
    );

    useEffect(() => {
        setSelectedIds((previous) => {
            if (!enabled) {
                return [];
            }

            const next = previous.filter((id) =>
                visibleTodos.some((todo) => todo.id === id)
            );

            if (
                next.length === previous.length &&
                next.every((id, index) => id === previous[index])
            ) {
                return previous;
            }

            return next;
        });
    }, [enabled, visibleTodos]);

    function clearSelection() {
        setSelectedIds([]);
    }

    function selectPage() {
        if (!enabled) return;
        setSelectedIds(visibleTodos.map((todo) => todo.id));
    }

    function toggleSelection(id: number) {
        if (!enabled) return;
        setSelectedIds((prev) =>
            prev.includes(id)
                ? prev.filter((selectedId) => selectedId !== id)
                : [...prev, id]
        );
    }

    return {
        selectedRows,
        selection: {
            selectedIds,
        },
        actions: {
            clearDeleteSelection: clearSelection,
            removeDeletedTodos: clearSelection,
            resetDeleteSelection: clearSelection,
            resetSelection: clearSelection,
            selectPage,
            toggleSelection,
        },
    };
}
