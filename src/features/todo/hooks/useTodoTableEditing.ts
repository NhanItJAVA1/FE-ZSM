import { useEffect, useMemo, useState } from "react";
import { ApiError } from "../../../services/api/apiError.js";
import type { SaveTodosPayload, TodoDto } from "../types.js";
import {
    createTodoInlineDraft,
    toDeletedPayload,
    toInputDateTime,
    toPayload,
    type CategoryFilter,
    type TodoFormState,
    type TodoInlineDraft,
} from "../todoPageUtils.js";

interface UseTodoTableEditingOptions {
    canWriteTodos: boolean;
    refetchTodos: () => Promise<unknown>;
    saveTodos: (payloads: SaveTodosPayload) => Promise<unknown>;
    selectedCategoryFilter: CategoryFilter;
    userId?: number;
    notifyActionError: (message: string) => void;
}

interface TodoEditingDraftStorage {
    drafts: TodoInlineDraft[];
    editedRows: Record<number, TodoFormState>;
    editedRowVersions: Record<number, string>;
}

const TODO_EDITING_DRAFT_STORAGE_VERSION = 1;
const TODO_EDITING_DRAFT_STORAGE_PREFIX = "todo:editing-draft";

export function useTodoTableEditing({
    canWriteTodos,
    refetchTodos,
    saveTodos,
    selectedCategoryFilter,
    userId,
    notifyActionError,
}: UseTodoTableEditingOptions) {
    const storageKey = useMemo(
        () => userId ? `${TODO_EDITING_DRAFT_STORAGE_PREFIX}:${userId}` : null,
        [userId]
    );
    const restoredDraft = useMemo(
        () => canWriteTodos ? loadEditingDraft(storageKey) : getEmptyEditingDraft(),
        [canWriteTodos, storageKey]
    );
    const [editedRows, setEditedRows] = useState<Record<number, TodoFormState>>(
        () => restoredDraft.editedRows
    );
    const [editedRowVersions, setEditedRowVersions] = useState<Record<number, string>>(
        () => restoredDraft.editedRowVersions
    );
    const [drafts, setDrafts] = useState<TodoInlineDraft[]>(
        () => restoredDraft.drafts
    );
    const [formError, setFormError] = useState<string | null>(null);
    const meaningfulDrafts = useMemo(
        () => drafts.filter(hasDraftContent),
        [drafts]
    );
    const hasUnsavedChanges = canWriteTodos &&
        (meaningfulDrafts.length > 0 || Object.keys(editedRows).length > 0);

    useEffect(() => {
        if (!canWriteTodos) {
            const emptyDraft = getEmptyEditingDraft();
            setDrafts(emptyDraft.drafts);
            setEditedRows(emptyDraft.editedRows);
            setEditedRowVersions(emptyDraft.editedRowVersions);
            setFormError(null);
            persistEditingDraft(storageKey, emptyDraft);
            return;
        }

        const nextDraft = loadEditingDraft(storageKey);

        setDrafts(nextDraft.drafts);
        setEditedRows(nextDraft.editedRows);
        setEditedRowVersions(nextDraft.editedRowVersions);
        setFormError(null);
    }, [canWriteTodos, storageKey]);

    useEffect(() => {
        if (!canWriteTodos) {
            persistEditingDraft(storageKey, getEmptyEditingDraft());
            return;
        }

        persistEditingDraft(storageKey, {
            drafts: meaningfulDrafts,
            editedRows,
            editedRowVersions,
        });
    }, [canWriteTodos, editedRows, editedRowVersions, meaningfulDrafts, storageKey]);

    function resetEditing() {
        setEditedRows({});
        setEditedRowVersions({});
        setDrafts([]);
        setFormError(null);
    }

    function getDraftCategoryId() {
        return selectedCategoryFilter.startsWith("category-")
            ? selectedCategoryFilter.replace("category-", "")
            : "";
    }

    function openNewTodoEditor() {
        if (!canWriteTodos) return;
        setDrafts((prev) => [
            ...prev,
            createTodoInlineDraft(getDraftCategoryId()),
        ]);
        setFormError(null);
    }

    function updateInlineDraft(id: string, patch: Partial<TodoFormState>) {
        if (!canWriteTodos) return;
        setDrafts((prev) =>
            prev.map((draft) =>
                draft.id === id ? { ...draft, ...patch } : draft
            )
        );
        setFormError(null);
    }

    function updateTodoRow(todo: TodoDto, patch: Partial<TodoFormState>) {
        if (!canWriteTodos) return;
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
        setEditedRowVersions((prev) => {
            const wasEdited = editedRows[todo.id];
            const nextDraft = {
                title: wasEdited?.title ?? todo.title,
                description: wasEdited?.description ?? todo.description ?? "",
                priority: wasEdited?.priority ?? todo.priority,
                dueDate: wasEdited?.dueDate ?? toInputDateTime(todo.dueDate),
                categoryId: wasEdited?.categoryId ?? (todo.categoryId ? String(todo.categoryId) : ""),
                ...patch,
            };
            const unchanged =
                nextDraft.title === todo.title &&
                nextDraft.description === (todo.description ?? "") &&
                nextDraft.priority === todo.priority &&
                nextDraft.dueDate === toInputDateTime(todo.dueDate) &&
                nextDraft.categoryId === (todo.categoryId ? String(todo.categoryId) : "");

            if (!unchanged) {
                return { ...prev, [todo.id]: todo.rowVersion };
            }

            const { [todo.id]: _removed, ...rest } = prev;
            return rest;
        });
        setFormError(null);
    }

    function removeInlineDraft(id: string) {
        if (!canWriteTodos) return;
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
        setEditedRowVersions((prev) => {
            const next = { ...prev };
            todoIds.forEach((id) => {
                delete next[id];
            });
            return next;
        });
    }

    async function saveInlineTodo(deletedTodos: TodoDto[] = []) {
        if (!canWriteTodos) return false;
        setFormError(null);
        const deletedTodoIds = new Set(deletedTodos.map((todo) => todo.id));

        const invalidEditedTodo = Object.entries(editedRows).find(
            ([id, row]) => !deletedTodoIds.has(Number(id)) && !row.title.trim()
        );

        if (invalidEditedTodo) {
            setFormError("Todo đã sửa cần có tiêu đề task.");
            return;
        }

        const invalidDraftIndex = meaningfulDrafts.findIndex(
            (draft) => !draft.title.trim()
        );

        if (invalidDraftIndex >= 0) {
            setFormError(`Dòng ${invalidDraftIndex + 1} cần có tiêu đề task.`);
            return;
        }

        const changedRows = Object.entries(editedRows).filter(
            ([id]) => !deletedTodoIds.has(Number(id))
        );

        if (
            meaningfulDrafts.length === 0 &&
            changedRows.length === 0 &&
            deletedTodos.length === 0
        ) {
            return false;
        }

        try {
            const payloads: SaveTodosPayload = [
                ...meaningfulDrafts.map((draft) => ({
                    ...toPayload(draft),
                    id: null,
                    isDeleted: false,
                    rowVersion: null,
                })),
                ...changedRows.map(([id, row]) => ({
                    ...toPayload(row),
                    id: Number(id),
                    isDeleted: false,
                    rowVersion: editedRowVersions[Number(id)] ?? null,
                })),
                ...deletedTodos.map(toDeletedPayload),
            ];

            await saveTodos(payloads);
            await refetchTodos();
            resetEditing();
            return true;
        } catch (error) {
            const message =
                error instanceof ApiError && error.status === 403
                    ? "Bạn không có quyền tạo, chỉnh sửa hoặc xóa task."
                    : error instanceof Error
                        ? error.message
                        : "Không thể lưu todo.";
            setFormError(message);
            notifyActionError(message);
            return false;
        }
    }

    return {
        editing: {
            canWriteTodos,
            editedRows,
            formError,
            drafts,
            hasUnsavedChanges,
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
        editedRowVersions: {},
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
            editedRowVersions?: unknown;
        };

        if (parsed.version !== TODO_EDITING_DRAFT_STORAGE_VERSION) {
            return getEmptyEditingDraft();
        }

        const drafts = Array.isArray(parsed.drafts)
            ? parsed.drafts.filter(isTodoInlineDraft)
            : [];
        const editedRows: Record<number, TodoFormState> = {};
        const editedRowVersions: Record<number, string> = {};

        if (typeof parsed.editedRows === "object" && parsed.editedRows !== null) {
            Object.entries(parsed.editedRows).forEach(([id, value]) => {
                if (Number.isInteger(Number(id)) && isTodoFormState(value)) {
                    editedRows[Number(id)] = value;
                }
            });
        }

        if (
            typeof parsed.editedRowVersions === "object" &&
            parsed.editedRowVersions !== null
        ) {
            Object.entries(parsed.editedRowVersions).forEach(([id, value]) => {
                if (Number.isInteger(Number(id)) && typeof value === "string") {
                    editedRowVersions[Number(id)] = value;
                }
            });
        }

        return {
            drafts,
            editedRows,
            editedRowVersions,
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

    if (
        draft.drafts.length === 0 &&
        Object.keys(draft.editedRows).length === 0 &&
        Object.keys(draft.editedRowVersions).length === 0
    ) {
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
