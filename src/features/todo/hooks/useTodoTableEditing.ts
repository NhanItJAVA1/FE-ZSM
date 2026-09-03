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
    const [editedRows, setEditedRows] = useState<Record<number, TodoFormState>>({});
    const [drafts, setDrafts] = useState<TodoInlineDraft[]>([]);
    const [formError, setFormError] = useState<string | null>(null);

    function resetEditing() {
        setEditedRows({});
        setDrafts([]);
        setFormError(null);
    }

    function getDraftCategoryId() {
        return selectedCategoryFilter.startsWith("category-")
            ? selectedCategoryFilter.replace("category-", "")
            : "";
    }

    function openNewTodoEditor() {
        setDrafts((prev) => [
            ...prev,
            createTodoInlineDraft(getDraftCategoryId()),
        ]);
        setFormError(null);
    }

    function updateInlineDraft(id: string, patch: Partial<TodoFormState>) {
        setDrafts((prev) =>
            prev.map((draft) =>
                draft.id === id ? { ...draft, ...patch } : draft
            )
        );
        setFormError(null);
    }

    function updateTodoRow(todo: TodoDto, patch: Partial<TodoFormState>) {
        setEditedRows((prev) => {
            const draft = prev[todo.id] ?? {
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
                return { ...prev, [todo.id]: nextDraft };
            }

            const { [todo.id]: _removed, ...rest } = prev;
            return rest;
        });
        setFormError(null);
    }

    function removeInlineDraft(id: string) {
        setDrafts((prev) => prev.filter((draft) => draft.id !== id));
        setFormError(null);
    }

    function removeEditedTodos(todoIds: number[]) {
        setEditedRows((prev) => {
            const next = { ...prev };
            todoIds.forEach((id) => {
                delete next[id];
            });
            return next;
        });
    }

    async function saveInlineTodo() {
        setFormError(null);

        const invalidEditedTodo = Object.entries(editedRows).find(
            ([_id, row]) => !row.title.trim()
        );

        if (invalidEditedTodo) {
            setFormError("Todo đã sửa cần có tiêu đề task.");
            return;
        }

        const invalidDraftIndex = drafts.findIndex(
            (draft) => !draft.title.trim()
        );

        if (invalidDraftIndex >= 0) {
            setFormError(`Dòng ${invalidDraftIndex + 1} cần có tiêu đề task.`);
            return;
        }

        const changedRows = Object.entries(editedRows);

        if (drafts.length === 0 && changedRows.length === 0) {
            return;
        }

        try {
            const payloads: SaveTodosPayload = [
                ...drafts.map((draft) => ({
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
            editedRows,
            formError,
            drafts,
        },
        actions: {
            openNewTodoEditor,
            removeEditedTodos,
            removeInlineDraft,
            resetEditing,
            saveInlineTodo,
            updateInlineDraft,
            updateTodoRow,
        },
    };
}
