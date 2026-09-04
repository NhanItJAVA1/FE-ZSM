import { useEffect, useMemo, useState } from "react";
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
    userId?: number;
}

interface TodoEditingDraftStorage {
    drafts: TodoInlineDraft[];
    editedRows: Record<number, TodoFormState>;
}

const TODO_EDITING_DRAFT_STORAGE_VERSION = 1;
const TODO_EDITING_DRAFT_STORAGE_PREFIX = "todo:editing-draft";

export function useTodoTableEditing({
    refetchTodos,
    saveTodos,
    selectedCategoryFilter,
    userId,
}: UseTodoTableEditingOptions) {
    const storageKey = useMemo(
        () => userId ? `${TODO_EDITING_DRAFT_STORAGE_PREFIX}:${userId}` : null,
        [userId]
    );
    const restoredDraft = useMemo(
        () => loadEditingDraft(storageKey),
        [storageKey]
    );
    const [editedRows, setEditedRows] = useState<Record<number, TodoFormState>>(
        () => restoredDraft.editedRows
    );
    const [drafts, setDrafts] = useState<TodoInlineDraft[]>(
        () => restoredDraft.drafts
    );
    const [formError, setFormError] = useState<string | null>(null);
    const meaningfulDrafts = useMemo(
        () => drafts.filter(hasDraftContent),
        [drafts]
    );

    useEffect(() => {
        const nextDraft = loadEditingDraft(storageKey);

        setDrafts(nextDraft.drafts);
        setEditedRows(nextDraft.editedRows);
        setFormError(null);
    }, [storageKey]);

    useEffect(() => {
        persistEditingDraft(storageKey, {
            drafts: meaningfulDrafts,
            editedRows,
        });
    }, [editedRows, meaningfulDrafts, storageKey]);

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

function hasDraftContent(draft: TodoInlineDraft) {
    return Boolean(
        draft.title.trim() ||
            draft.description.trim() ||
            draft.dueDate
    );
}

function isTodoFormState(value: unknown): value is TodoFormState {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    const form = value as Partial<TodoFormState>;

    return (
        typeof form.title === "string" &&
        typeof form.description === "string" &&
        typeof form.priority === "string" &&
        typeof form.dueDate === "string" &&
        typeof form.categoryId === "string"
    );
}

function isTodoInlineDraft(value: unknown): value is TodoInlineDraft {
    return (
        isTodoFormState(value) &&
        typeof (value as Partial<TodoInlineDraft>).id === "string"
    );
}

function getEmptyEditingDraft(): TodoEditingDraftStorage {
    return {
        drafts: [],
        editedRows: {},
    };
}

function loadEditingDraft(storageKey: string | null): TodoEditingDraftStorage {
    if (!storageKey) {
        return getEmptyEditingDraft();
    }

    const raw = localStorage.getItem(storageKey);

    if (!raw) {
        return getEmptyEditingDraft();
    }

    try {
        const parsed = JSON.parse(raw) as {
            version?: number;
            drafts?: unknown;
            editedRows?: unknown;
        };

        if (parsed.version !== TODO_EDITING_DRAFT_STORAGE_VERSION) {
            return getEmptyEditingDraft();
        }

        const drafts = Array.isArray(parsed.drafts)
            ? parsed.drafts.filter(isTodoInlineDraft)
            : [];
        const editedRows: Record<number, TodoFormState> = {};

        if (typeof parsed.editedRows === "object" && parsed.editedRows !== null) {
            Object.entries(parsed.editedRows).forEach(([id, value]) => {
                if (Number.isInteger(Number(id)) && isTodoFormState(value)) {
                    editedRows[Number(id)] = value;
                }
            });
        }

        return {
            drafts,
            editedRows,
        };
    } catch {
        localStorage.removeItem(storageKey);
        return getEmptyEditingDraft();
    }
}

function persistEditingDraft(
    storageKey: string | null,
    draft: TodoEditingDraftStorage
) {
    if (!storageKey) {
        return;
    }

    if (draft.drafts.length === 0 && Object.keys(draft.editedRows).length === 0) {
        localStorage.removeItem(storageKey);
        return;
    }

    localStorage.setItem(
        storageKey,
        JSON.stringify({
            version: TODO_EDITING_DRAFT_STORAGE_VERSION,
            ...draft,
        })
    );
}
