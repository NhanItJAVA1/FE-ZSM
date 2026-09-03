import { type FormEvent, useState } from "react";
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
}: UseTodoDialogActionsOptions) {
    const [categoryName, setCategoryName] = useState("");
    const [todoDialog, setTodoDialog] = useState<TodoDialogState>(null);
    const [renameCategoryName, setRenameCategoryName] = useState("");

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
        setTodoDialog({ type: "deleteCategory", category, taskCount });
    }

    function openRenameCategoryDialog(category: TodoCategoryDto) {
        setRenameCategoryName(category.name);
        setTodoDialog({ type: "renameCategory", category });
    }

    async function submitCategory(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const name = categoryName.trim();
        if (!name) return;

        await createCategory(name);
        setCategoryName("");
    }

    async function confirmDeleteSelected(todos: TodoDto[]) {
        await saveTodos(todos.map(toDeletedPayload));
        await refetchTodos();

        const todoIds = todos.map((todo) => todo.id);
        removeEditedTodos(todoIds);
        removeDeletedTodos(todoIds);
        setTodoDialog(null);
    }

    async function confirmDeleteCategory(
        category: TodoCategoryDto,
        deleteTodos: boolean
    ) {
        await deleteCategory({ id: category.id, deleteTodos });

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

        await updateCategory({
            id: todoDialog.category.id,
            name,
        });
        setTodoDialog(null);
        setRenameCategoryName("");
    }

    return {
        categoryName,
        renameCategoryName,
        todoDialog,
        actions: {
            closeDialog: () => setTodoDialog(null),
            confirmDeleteCategory,
            confirmDeleteSelected,
            confirmRenameCategory,
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
