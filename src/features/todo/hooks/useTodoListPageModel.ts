import { useEffect, useMemo, useRef } from "react";
import type { TodoCategoryDto, TodoDto } from "../types.js";
import { countTodos, type CategoryFilter } from "../todoPageUtils.js";
import { useTodoCategoriesQuery } from "../../../hooks/useTodoCategoriesQuery.js";
import { useTodoMutations } from "../../../hooks/useTodoMutations.js";
import { useTodosQuery } from "../../../hooks/useTodosQuery.js";
import { useTodoDialogActions } from "./useTodoDialogActions.js";
import { useTodoFilters } from "./useTodoFilters.js";
import { useTodoSelection } from "./useTodoSelection.js";
import { useTodoTableEditing } from "./useTodoTableEditing.js";

export function useTodoListPageModel() {
    const leftPanelRef = useRef<HTMLElement | null>(null);
    const todoFilters = useTodoFilters();
    const allTodosQuery = useTodosQuery({
        page: 1,
        pageSize: 100,
        sortBy: "createdat",
        isDescending: true,
    });
    const todosQuery = useTodosQuery(todoFilters.todoQuery);
    const categoriesQuery = useTodoCategoriesQuery();
    const mutations = useTodoMutations();

    const todos = todosQuery.data?.items ?? [];
    const allTodos = allTodosQuery.data?.items ?? [];
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
    const todoSelection = useTodoSelection(visibleTodos);
    const todoEditing = useTodoTableEditing({
        selectedCategoryFilter: todoFilters.selectedCategoryFilter,
        saveTodos: mutations.saveTodos.mutateAsync,
        refetchTodos,
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
    });
    const { setPage } = todoFilters.actions;

    useEffect(() => {
        setPage((prev) => Math.min(prev, totalPages));
    }, [setPage, totalPages]);

    async function refetchTodos() {
        await Promise.all([todosQuery.refetch(), allTodosQuery.refetch()]);
    }

    function resetTodoPanel() {
        todoEditing.actions.resetEditing();
        todoSelection.actions.resetDeleteSelection();
    }

    function openNewTodoEditor() {
        todoEditing.actions.openNewTodoEditor();
        todoFilters.actions.closeFilter();
    }

    function selectTodo(todoId: number) {
        todoSelection.actions.selectRow(todoId);
        todoFilters.actions.closeFilter();
    }

    return {
        categoryPanelProps: {
            allTodos,
            categories,
            categoryName: todoDialogActions.categoryName,
            counts,
            createCategoryPending: mutations.createCategory.isPending,
            selectedCategoryFilter: todoFilters.selectedCategoryFilter,
            onCategoryNameChange: todoDialogActions.actions.setCategoryName,
            onDeleteCategory: todoDialogActions.actions.openDeleteCategoryDialog,
            onRenameCategory: todoDialogActions.actions.openRenameCategoryDialog,
            onSelectCategory: todoDialogActions.actions.selectTodoCategory,
            onSubmitCategory: todoDialogActions.actions.submitCategory,
        },
        dialogProps: {
            deleteCategoryPending: mutations.deleteCategory.isPending,
            deletePending: mutations.saveTodos.isPending,
            dialog: todoDialogActions.todoDialog,
            renameCategoryName: todoDialogActions.renameCategoryName,
            updateCategoryPending: mutations.updateCategory.isPending,
            onCancel: todoDialogActions.actions.closeDialog,
            onConfirmDeleteCategory: todoDialogActions.actions.confirmDeleteCategory,
            onConfirmDeleteSelected: todoDialogActions.actions.confirmDeleteSelected,
            onConfirmRenameCategory: todoDialogActions.actions.confirmRenameCategory,
            onRenameCategoryNameChange: todoDialogActions.actions.setRenameCategoryName,
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
                editedRows: todoEditing.editing.editedRows,
                formError: todoEditing.editing.formError,
                drafts: todoEditing.editing.drafts,
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
                onDeleteSelected: todoDialogActions.actions.openDeleteSelectedDialog,
                onAddDraft: openNewTodoEditor,
                onResetForm: resetTodoPanel,
                onSearchChange: todoFilters.actions.setSearch,
                onSelectRow: selectTodo,
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
                onSave: () => void todoEditing.actions.saveInlineTodo(),
            },
        },
    };
}

function getVisibleTodos(todos: TodoDto[], selectedCategoryFilter: CategoryFilter) {
    if (selectedCategoryFilter === "uncategorized") {
        return todos.filter((todo) => todo.categoryId === null);
    }

    return todos;
}
