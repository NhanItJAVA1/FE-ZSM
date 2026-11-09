import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TodoCategoryDto, TodoDto } from "../types.js";
import { countTodos, type CategoryFilter } from "../todoPageUtils.js";
import { useTodoCategoriesQuery } from "../../../hooks/useTodoCategoriesQuery.js";
import { useTodoMutations } from "../../../hooks/useTodoMutations.js";
import { useTodosQuery } from "../../../hooks/useTodosQuery.js";
import { useTodoDialogActions } from "./useTodoDialogActions.js";
import { useTodoFilters } from "./useTodoFilters.js";
import { useTodoPageSize } from "./useTodoPageSize.js";
import { useTodoSelection } from "./useTodoSelection.js";
import { useTodoTableEditing } from "./useTodoTableEditing.js";
import { useAppSelector } from "../../../stores/hook.js";
import { RBAC_PERMISSIONS } from "../../../constants/rbacPermissions.js";

const EMPTY_TODOS: TodoDto[] = [];

export function useTodoListPageModel() {
    const [actionNotice, setActionNotice] = useState<{ id: number; message: string } | null>(null);
    const noticeId = useRef(0);
    const notifyActionError = useCallback((message: string) => {
        noticeId.current += 1;
        setActionNotice({ id: noticeId.current, message });
    }, []);
    const authUser = useAppSelector((state) => state.auth.user);
    const userId = authUser?.id;
    const canWriteTodos = Boolean(authUser?.isSystemOwner || authUser?.permissions.includes(RBAC_PERMISSIONS.todoWrite));
    const canCreateCategory = Boolean(authUser?.isSystemOwner || authUser?.permissions.includes(RBAC_PERMISSIONS.todoCategoryCreate));
    const canUpdateCategory = Boolean(authUser?.isSystemOwner || authUser?.permissions.includes(RBAC_PERMISSIONS.todoCategoryUpdate));
    const canDeleteCategory = Boolean(authUser?.isSystemOwner || authUser?.permissions.includes(RBAC_PERMISSIONS.todoCategoryDelete));
    const leftPanelRef = useRef<HTMLElement | null>(null);
    const pageSize = useTodoPageSize(leftPanelRef);
    const todoFilters = useTodoFilters(pageSize);
    const allTodosQuery = useTodosQuery({
        page: 1,
        pageSize: 100,
        sortBy: "createdat",
        isDescending: true,
    });
    const todosQuery = useTodosQuery(todoFilters.todoQuery);
    const categoriesQuery = useTodoCategoriesQuery();
    const mutations = useTodoMutations();

    const todos = todosQuery.data?.items ?? EMPTY_TODOS;
    const allTodos = allTodosQuery.data?.items ?? EMPTY_TODOS;
    const categories = categoriesQuery.data ?? [];
    const loading = todosQuery.isLoading || allTodosQuery.isLoading || categoriesQuery.isLoading;
    const counts = useMemo(() => countTodos(allTodos), [allTodos]);
    const totalPages = Math.max(1, todosQuery.data?.totalPages ?? 1);
    const visibleTodos = useMemo(
        () => getVisibleTodos(todos, todoFilters.selectedCategoryFilter),
        [todoFilters.selectedCategoryFilter, todos]
    );
    const visibleTodoCount =
        todoFilters.selectedCategoryFilter === "uncategorized"
            ? visibleTodos.length
            : todosQuery.data?.totalItems ?? visibleTodos.length;
    const todoSelection = useTodoSelection(visibleTodos, canWriteTodos);
    const todoEditing = useTodoTableEditing({
        canWriteTodos,
        selectedCategoryFilter: todoFilters.selectedCategoryFilter,
        saveTodos: mutations.saveTodos.mutateAsync,
        notifyActionError,
        refetchTodos,
        userId: userId!,
    });
    const todoDialogActions = useTodoDialogActions({
        createCategory: mutations.createCategory.mutateAsync,
        deleteCategory: mutations.deleteCategory.mutateAsync,
        refetchTodos,
        removeDeletedTodos: todoSelection.actions.removeDeletedTodos,
        removeEditedTodos: todoEditing.actions.removeEditedTodos,
        resetEditing: todoEditing.actions.resetEditing,
        resetSelection: todoSelection.actions.resetSelection,
        saveTodos: mutations.saveTodos.mutateAsync,
        selectCategory: todoFilters.actions.selectCategory,
        selectedCategoryFilter: todoFilters.selectedCategoryFilter,
        selectedRows: todoSelection.selectedRows,
        updateCategory: mutations.updateCategory.mutateAsync,
        notifyActionError,
    });
    const { setPage } = todoFilters.actions;

    useEffect(() => {
        setPage((prev) => Math.min(prev, totalPages));
    }, [setPage, totalPages]);

    async function refetchTodos() {
        await Promise.all([todosQuery.refetch(), allTodosQuery.refetch()]);
    }

    function resetTodoPanel() {
        if (todoEditing.editing.hasUnsavedChanges) {
            todoDialogActions.actions.openDiscardChangesDialog(() => {
                todoEditing.actions.resetEditing();
                todoSelection.actions.resetDeleteSelection();
            });
            return;
        }

        todoEditing.actions.resetEditing();
        todoSelection.actions.resetDeleteSelection();
    }

    function selectTodoCategory(filter: CategoryFilter) {
        if (todoEditing.editing.hasUnsavedChanges) {
            todoDialogActions.actions.openDiscardChangesDialog(() => {
                todoDialogActions.actions.selectTodoCategory(filter);
            });
            return;
        }

        todoDialogActions.actions.selectTodoCategory(filter);
    }

    function openNewTodoEditor() {
        if (!canWriteTodos) return;
        todoEditing.actions.openNewTodoEditor();
        todoFilters.actions.closeFilter();
    }

    async function saveTodoPanel() {
        if (!canWriteTodos) return;
        const saved = await todoEditing.actions.saveInlineTodo(
            todoSelection.selectedRows
        );

        if (saved) {
            todoSelection.actions.resetDeleteSelection();
        }
    }

    return {
        categoryPanelProps: {
            allTodos,
            categories,
            categoryFormError: todoDialogActions.categoryFormError,
            categoryName: todoDialogActions.categoryName,
            counts,
            createCategoryPending: mutations.createCategory.isPending,
            canCreateCategory,
            canUpdateCategory,
            canDeleteCategory,
            selectedCategoryFilter: todoFilters.selectedCategoryFilter,
            onCategoryNameChange: todoDialogActions.actions.setCategoryName,
            onDeleteCategory: canDeleteCategory ? todoDialogActions.actions.openDeleteCategoryDialog : () => undefined,
            onRenameCategory: canUpdateCategory ? todoDialogActions.actions.openRenameCategoryDialog : () => undefined,
            onSelectCategory: selectTodoCategory,
            onSubmitCategory: canCreateCategory ? todoDialogActions.actions.submitCategory : async () => false,
        },
        dialogProps: {
            deleteCategoryPending: mutations.deleteCategory.isPending,
            categoryDialogError: todoDialogActions.categoryDialogError,
            deletePending: mutations.saveTodos.isPending,
            dialog: shouldHideTodoDialog(
                todoDialogActions.todoDialog,
                canWriteTodos,
                canUpdateCategory,
                canDeleteCategory
            ) ? null : todoDialogActions.todoDialog,
            renameCategoryName: todoDialogActions.renameCategoryName,
            updateCategoryPending: mutations.updateCategory.isPending,
            onCancel: todoDialogActions.actions.closeDialog,
            onConfirmDeleteCategory: todoDialogActions.actions.confirmDeleteCategory,
            onConfirmDeleteSelected: todoDialogActions.actions.confirmDeleteSelected,
            onConfirmRenameCategory: todoDialogActions.actions.confirmRenameCategory,
            onRenameCategoryNameChange: todoDialogActions.actions.setRenameCategoryName,
            onConfirmDiscardChanges: todoDialogActions.actions.confirmDiscardChanges,
        },
        notificationProps: {
            notice: actionNotice,
            onDismiss: () => setActionNotice(null),
        },
        panelProps: {
            leftPanelRef,
            data: {
                categories,
                counts,
                loading,
                rows: visibleTodos,
                totalRows: visibleTodoCount,
            },
            editing: {
                canWriteTodos,
                editedRows: todoEditing.editing.editedRows,
                formError: todoEditing.editing.formError,
                drafts: todoEditing.editing.drafts,
                hasUnsavedChanges: todoEditing.editing.hasUnsavedChanges,
                saving: mutations.saveTodos.isPending,
            },
            filters: todoFilters.filters,
            selection: todoSelection.selection,
            pagination: {
                page: todoFilters.pagination.page,
                totalPages,
            },
            actions: {
                onClearFilters: todoFilters.actions.clearTodoFilters,
                onClearAdvancedFilters: todoFilters.actions.clearAdvancedFilters,
                onDeleteSelected: canWriteTodos ? todoDialogActions.actions.openDeleteSelectedDialog : () => undefined,
                onAddDraft: openNewTodoEditor,
                onResetForm: resetTodoPanel,
                onSearchChange: todoFilters.actions.setSearch,
                onRemoveDraft: todoEditing.actions.removeInlineDraft,
                onToggleFilter: todoFilters.actions.toggleFilter,
                onClearDeleteSelection: todoSelection.actions.clearDeleteSelection,
                onSelectPage: todoSelection.actions.selectPage,
                onToggleSelection: todoSelection.actions.toggleSelection,
                onUpdateDraft: todoEditing.actions.updateInlineDraft,
                onUpdateRow: todoEditing.actions.updateTodoRow,
                onSetOverdueFilter: todoFilters.actions.setOverdueFilter,
                onSetPriorityFilter: todoFilters.actions.setPriorityFilter,
                onSetStatusFilter: todoFilters.actions.setStatusFilter,
                onSetPage: todoFilters.actions.setPage,
                onSave: () => void saveTodoPanel(),
            },
        },
    };
}

function shouldHideTodoDialog(
    dialog: ReturnType<typeof useTodoDialogActions>["todoDialog"],
    canWriteTodos: boolean,
    canUpdateCategory: boolean,
    canDeleteCategory: boolean
) {
    if (!dialog) return false;
    if ((dialog.type === "deleteSelected" || dialog.type === "discardChanges") && !canWriteTodos) return true;
    if (dialog.type === "renameCategory" && !canUpdateCategory) return true;
    return dialog.type === "deleteCategory" && !canDeleteCategory;
}

function getVisibleTodos(todos: TodoDto[], selectedCategoryFilter: CategoryFilter) {
    if (selectedCategoryFilter === "uncategorized") {
        return todos.filter((todo) => todo.categoryId === null);
    }

    return todos;
}
