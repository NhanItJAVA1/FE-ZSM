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
    const totalTaskPages = Math.max(1, todosQuery.data?.totalPages ?? 1);
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
        removeDeletedTodo: todoSelection.actions.removeDeletedTodo,
        removeDeletedTodos: todoSelection.actions.removeDeletedTodos,
        removeEditedTodo: todoEditing.actions.removeEditedTodo,
        removeEditedTodos: todoEditing.actions.removeEditedTodos,
        resetEditing: todoEditing.actions.resetEditing,
        resetSelection: todoSelection.actions.resetSelection,
        saveTodos: mutations.saveTodos.mutateAsync,
        selectCategory: todoFilters.actions.selectCategory,
        selectedCategoryFilter: todoFilters.selectedCategoryFilter,
        selectedDeleteTodos: todoSelection.selectedDeleteTodos,
        updateCategory: mutations.updateCategory.mutateAsync,
    });
    const { setTaskPage } = todoFilters.actions;

    useEffect(() => {
        setTaskPage((current) => Math.min(current, totalTaskPages));
    }, [setTaskPage, totalTaskPages]);

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
        todoSelection.actions.selectTodo(todoId);
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
            deleteTodoPending: mutations.saveTodos.isPending,
            dialog: todoDialogActions.todoDialog,
            renameCategoryName: todoDialogActions.renameCategoryName,
            updateCategoryPending: mutations.updateCategory.isPending,
            onCancel: todoDialogActions.actions.closeDialog,
            onConfirmDeleteCategory: todoDialogActions.actions.confirmDeleteCategory,
            onConfirmDeleteTodo: todoDialogActions.actions.confirmDeleteTodo,
            onConfirmDeleteTodos: todoDialogActions.actions.confirmDeleteTodos,
            onConfirmRenameCategory: todoDialogActions.actions.confirmRenameCategory,
            onRenameCategoryNameChange: todoDialogActions.actions.setRenameCategoryName,
        },
        panelProps: {
            leftPanelRef,
            data: {
                categories,
                counts,
                loading,
                paginatedTodos: visibleTodos,
                visibleTodosLength: visibleTodoCount,
            },
            editing: {
                ...todoEditing.editing,
                savingTodo: mutations.saveTodos.isPending,
            },
            filters: todoFilters.filters,
            selection: todoSelection.selection,
            pagination: {
                taskPage: todoFilters.pagination.taskPage,
                totalTaskPages,
            },
            actions: {
                onClearFilters: todoFilters.actions.clearTodoFilters,
                onClearAdvancedFilters: todoFilters.actions.clearAdvancedFilters,
                onDeleteTodo: todoDialogActions.actions.openDeleteTodoDialog,
                onDeleteSelectedTodos: todoDialogActions.actions.openDeleteSelectedTodosDialog,
                onOpenNewTodoEditor: openNewTodoEditor,
                onResetForm: resetTodoPanel,
                onSearchChange: todoFilters.actions.setSearch,
                onSelectTodo: selectTodo,
                onRemoveInlineDraft: todoEditing.actions.removeInlineDraft,
                onToggleFilter: todoFilters.actions.toggleFilter,
                onToggleBulkDeleteMode: todoSelection.actions.toggleBulkDeleteMode,
                onToggleDeleteSelection: todoSelection.actions.toggleDeleteSelection,
                onSetInlineDraft: todoEditing.actions.updateInlineDraft,
                onSetTodoRow: todoEditing.actions.updateTodoRow,
                onSetOverdueFilter: todoFilters.actions.setOverdueFilter,
                onSetPriorityFilter: todoFilters.actions.setPriorityFilter,
                onSetStatusFilter: todoFilters.actions.setStatusFilter,
                onSetTaskPage: todoFilters.actions.setTaskPage,
                onSaveTodo: () => void todoEditing.actions.saveInlineTodo(),
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
