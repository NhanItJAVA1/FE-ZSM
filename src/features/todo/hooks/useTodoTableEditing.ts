import { useState } from "react";
import type { SaveTodosPayload, TodoDto } from "../types.js";
import {
    createTodoInlineDraft,
    toInputDateTime,
    toPayload,
    type CategoryFilter,
    type TodoFormState,
    type TodoInlineDraft,
} from "../todoPageUtils.js";

interface UseTodoTableEditingOptions {
    refetchTodos: () => Promise<unknown>;
    saveTodos: (payloads: SaveTodosPayload) => Promise<unknown>;
    selectedCategoryFilter: CategoryFilter;
}

export function useTodoTableEditing({
    refetchTodos,
    saveTodos,
    selectedCategoryFilter,
}: UseTodoTableEditingOptions) {
    const [editedTodoRows, setEditedTodoRows] = useState<Record<number, TodoFormState>>({});
    const [inlineDrafts, setInlineDrafts] = useState<TodoInlineDraft[]>([]);
    const [formError, setFormError] = useState<string | null>(null);

    function resetEditing() {
        setEditedTodoRows({});
        setInlineDrafts([]);
        setFormError(null);
    }

    function getDraftCategoryId() {
        return selectedCategoryFilter.startsWith("category-")
            ? selectedCategoryFilter.replace("category-", "")
            : "";
    }

    function openNewTodoEditor() {
        setInlineDrafts((current) => [
            ...current,
            createTodoInlineDraft(getDraftCategoryId()),
        ]);
        setFormError(null);
    }

    function updateInlineDraft(id: string, patch: Partial<TodoFormState>) {
        setInlineDrafts((current) =>
            current.map((draft) =>
                draft.id === id ? { ...draft, ...patch } : draft
            )
        );
        setFormError(null);
    }

    function updateTodoRow(todo: TodoDto, patch: Partial<TodoFormState>) {
        setEditedTodoRows((current) => {
            const draft = current[todo.id] ?? {
                title: todo.title,
                description: todo.description ?? "",
                priority: todo.priority,
                dueDate: toInputDateTime(todo.dueDate),
                categoryId: todo.categoryId ? String(todo.categoryId) : "",
            };

            const nextDraft = { ...draft, ...patch };
            const unchanged =
                nextDraft.title === todo.title &&
                nextDraft.description === (todo.description ?? "") &&
                nextDraft.priority === todo.priority &&
                nextDraft.dueDate === toInputDateTime(todo.dueDate) &&
                nextDraft.categoryId === (todo.categoryId ? String(todo.categoryId) : "");

            if (!unchanged) {
                return { ...current, [todo.id]: nextDraft };
            }

            const { [todo.id]: _removed, ...rest } = current;
            return rest;
        });
        setFormError(null);
    }

    function removeInlineDraft(id: string) {
        setInlineDrafts((current) => current.filter((draft) => draft.id !== id));
        setFormError(null);
    }

    function removeEditedTodo(todoId: number) {
        setEditedTodoRows((current) => {
            const { [todoId]: _removed, ...rest } = current;
            return rest;
        });
    }

    function removeEditedTodos(todoIds: number[]) {
        setEditedTodoRows((current) => {
            const next = { ...current };
            todoIds.forEach((id) => {
                delete next[id];
            });
            return next;
        });
    }

    async function saveInlineTodo() {
        setFormError(null);

        const invalidEditedTodo = Object.entries(editedTodoRows).find(
            ([_id, row]) => !row.title.trim()
        );

        if (invalidEditedTodo) {
            setFormError("Todo đã sửa cần có tiêu đề task.");
            return;
        }

        const invalidDraftIndex = inlineDrafts.findIndex(
            (draft) => !draft.title.trim()
        );

        if (invalidDraftIndex >= 0) {
            setFormError(`Dòng ${invalidDraftIndex + 1} cần có tiêu đề task.`);
            return;
        }

        const changedRows = Object.entries(editedTodoRows);

        if (inlineDrafts.length === 0 && changedRows.length === 0) {
            return;
        }

        try {
            const payloads: SaveTodosPayload = [
                ...inlineDrafts.map((draft) => ({
                    ...toPayload(draft),
                    id: null,
                    isDeleted: false,
                })),
                ...changedRows.map(([id, row]) => ({
                    ...toPayload(row),
                    id: Number(id),
                    isDeleted: false,
                })),
            ];

            await saveTodos(payloads);
            await refetchTodos();
            resetEditing();
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Không thể lưu todo.");
        }
    }

    return {
        editing: {
            editedTodoRows,
            formError,
            inlineDrafts,
        },
        actions: {
            openNewTodoEditor,
            removeEditedTodo,
            removeEditedTodos,
            removeInlineDraft,
            resetEditing,
            saveInlineTodo,
            updateInlineDraft,
            updateTodoRow,
        },
    };
}
