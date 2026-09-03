import { useEffect, useMemo, useState } from "react";
import type { TodoDto } from "../types.js";

export function useTodoSelection(visibleTodos: TodoDto[]) {
    const [activeId, setActiveId] = useState<number | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const activeRow = useMemo(
        () => visibleTodos.find((todo) => todo.id === activeId) ?? null,
        [activeId, visibleTodos]
    );
    const selectedRows = useMemo(
        () => visibleTodos.filter((todo) => selectedIds.includes(todo.id)),
        [selectedIds, visibleTodos]
    );

    useEffect(() => {
        if (visibleTodos.length === 0) {
            setActiveId(null);
            setSelectedIds([]);
            return;
        }

        setActiveId((prev) => {
            if (prev !== null && visibleTodos.some((todo) => todo.id === prev)) {
                return prev;
            }

            return visibleTodos[0]?.id ?? null;
        });
        setSelectedIds((prev) =>
            prev.filter((id) => visibleTodos.some((todo) => todo.id === id))
        );
    }, [visibleTodos]);

    function clearActiveRow() {
        setActiveId(null);
    }

    function resetSelection() {
        setActiveId(null);
        setSelectedIds([]);
    }

    function resetDeleteSelection() {
        setSelectedIds([]);
    }

    function selectRow(id: number) {
        setActiveId(id);
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

    function removeDeletedTodos(todoIds: number[]) {
        setSelectedIds([]);
        setActiveId((prev) =>
            prev !== null && todoIds.includes(prev) ? null : prev
        );
    }

    return {
        selectedRows,
        activeRow,
        selection: {
            activeId: activeRow?.id ?? null,
            selectedIds,
        },
        actions: {
            clearActiveRow,
            clearDeleteSelection,
            removeDeletedTodos,
            resetDeleteSelection,
            resetSelection,
            selectPage,
            selectRow,
            toggleSelection,
        },
    };
}
