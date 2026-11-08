import { type FormEvent, useState } from "react";
import { ApiError } from "../../../services/api/apiError.js";
import type { SaveTodosPayload, TodoCategoryDto, TodoDto } from "../types.js";
import {
    getCategoryFilterId,
    toDeletedPayload,
    type CategoryFilter,
    type TodoDialogState,
} from "../todoPageUtils.js";

interface UseTodoDialogActionsOptions {
    createCategory: (name: string) => Promise<unknown>;
    deleteCategory: (payload: { id: number; deleteTodos: boolean }) => Promise<unknown>;
    refetchTodos: () => Promise<unknown>;
    removeDeletedTodos: (todoIds: number[]) => void;
    removeEditedTodos: (todoIds: number[]) => void;
    resetEditing: () => void;
    resetSelection: () => void;
    saveTodos: (payloads: SaveTodosPayload) => Promise<unknown>;
    selectCategory: (filter: CategoryFilter) => void;
    selectedCategoryFilter: CategoryFilter;
    selectedRows: TodoDto[];
    updateCategory: (payload: { id: number; name: string }) => Promise<unknown>;
    notifyActionError: (message: string) => void;
}

export function useTodoDialogActions({
    createCategory,
    deleteCategory,
    refetchTodos,
    removeDeletedTodos,
    removeEditedTodos,
    resetEditing,
    resetSelection,
    saveTodos,
    selectCategory,
    selectedCategoryFilter,
    selectedRows,
    updateCategory,
    notifyActionError,
}: UseTodoDialogActionsOptions) {
    const [categoryName, setCategoryName] = useState("");
    const [todoDialog, setTodoDialog] = useState<TodoDialogState>(null);
    const [renameCategoryName, setRenameCategoryName] = useState("");
    const [categoryFormError, setCategoryFormError] = useState<string | null>(null);
    const [categoryDialogError, setCategoryDialogError] = useState<string | null>(null);
    function selectTodoCategory(filter: CategoryFilter) {
        selectCategory(filter);
        resetSelection();
        resetEditing();
    }

    function openDeleteSelectedDialog() {
        if (selectedRows.length === 0) return;
        setTodoDialog({ type: "deleteSelected", todos: selectedRows });
    }

    function openDeleteCategoryDialog(category: TodoCategoryDto, taskCount: number) {
        setCategoryDialogError(null);
        setTodoDialog({ type: "deleteCategory", category, taskCount });
    }

    function openRenameCategoryDialog(category: TodoCategoryDto) {
        setCategoryDialogError(null);
        setRenameCategoryName(category.name);
        setTodoDialog({ type: "renameCategory", category });
    }

    function openDiscardChangesDialog(onConfirm: () => void) {
        setTodoDialog({ type: "discardChanges", onConfirm });
    }

    async function submitCategory(event: FormEvent<HTMLFormElement>): Promise<boolean> {
        event.preventDefault();
        const name = categoryName.trim();
        if (!name) return false;

        setCategoryFormError(null);
        try {
            await createCategory(name);
            setCategoryName("");
            return true;
        } catch (error) {
            const message = getCategoryActionError(error, "tạo");
            setCategoryFormError(message);
            notifyActionError(message);
            return false;
        }
    }

    async function confirmDeleteSelected(todos: TodoDto[]) {
        try {
            await saveTodos(todos.map(toDeletedPayload));
            await refetchTodos();

            const todoIds = todos.map((todo) => todo.id);
            removeEditedTodos(todoIds);
            removeDeletedTodos(todoIds);
            setTodoDialog(null);
        } catch (error) {
            notifyActionError(getTodoActionError(error, "xóa task"));
        }
    }

    async function confirmDeleteCategory(
        category: TodoCategoryDto,
        deleteTodos: boolean
    ) {
        setCategoryDialogError(null);
        try {
            await deleteCategory({ id: category.id, deleteTodos });
        } catch (error) {
            const message = getCategoryActionError(error, "xóa");
            setCategoryDialogError(message);
            notifyActionError(message);
            return;
        }

        if (selectedCategoryFilter === getCategoryFilterId(category.id)) {
            selectCategory("all");
        }

        setTodoDialog(null);
    }

    async function confirmRenameCategory(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (todoDialog?.type !== "renameCategory") return;
        const name = renameCategoryName.trim();
        if (!name || name === todoDialog.category.name) return;

        setCategoryDialogError(null);
        try {
            await updateCategory({
                id: todoDialog.category.id,
                name,
            });
        } catch (error) {
            const message = getCategoryActionError(error, "đổi tên");
            setCategoryDialogError(message);
            notifyActionError(message);
            return;
        }
        setTodoDialog(null);
        setRenameCategoryName("");
    }

    function confirmDiscardChanges() {
        if (todoDialog?.type !== "discardChanges") return;

        todoDialog.onConfirm();
        setTodoDialog(null);
    }

    return {
        categoryName,
        categoryFormError,
        categoryDialogError,
        renameCategoryName,
        todoDialog,
        actions: {
            closeDialog: () => {
                setTodoDialog(null);
                setCategoryDialogError(null);
            },
            confirmDeleteCategory,
            confirmDeleteSelected,
            confirmDiscardChanges,
            confirmRenameCategory,
            openDiscardChangesDialog,
            openDeleteCategoryDialog,
            openDeleteSelectedDialog,
            openRenameCategoryDialog,
            selectTodoCategory,
            setCategoryName,
            setRenameCategoryName,
            submitCategory,
        },
    };
}

function getCategoryActionError(error: unknown, action: string): string {
    if (error instanceof ApiError && error.status === 403) {
        return `Bạn không có quyền ${action} category này.`;
    }

    return error instanceof Error
        ? error.message
        : `Không thể ${action} category. Vui lòng thử lại.`;
}

function getTodoActionError(error: unknown, action: string): string {
    if (error instanceof ApiError && error.status === 403) {
        return `Bạn không có quyền ${action}.`;
    }

    return error instanceof Error
        ? error.message
        : `Không thể ${action}. Vui lòng thử lại.`;
}
