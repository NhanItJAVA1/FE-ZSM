import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../constants/queryKeys.js";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue.js";
import { todoService } from "../../../services/api/todoService.js";
import { ApiError } from "../../../services/api/apiError.js";
import type { TodoCategoryDto, TodoDto, TodoUserSummaryDto, TodoView } from "../types.js";
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
    const permissions = authUser?.permissions ?? [];
    const canReadMine = permissions.includes(RBAC_PERMISSIONS.todosRead);
    const canReadAll = permissions.includes(RBAC_PERMISSIONS.todosReadAll);
    const [activeTab, setActiveTab] = useState<"todos" | "users">(() => canReadMine ? "todos" : "users");
    const [todoView, setTodoView] = useState<TodoView>({ type: "mine" });
    const [viewingUser, setViewingUser] = useState<TodoUserSummaryDto | null>(null);
    const [usersSearch, setUsersSearch] = useState("");
    const debouncedUsersSearch = useDebouncedValue(usersSearch, 500);
    const [usersPage, setUsersPage] = useState(1);
    const usersPageSize = 10;
    const canReadCurrentView = todoView.type === "mine" ? canReadMine : canReadAll;
    const canWriteTodos = Boolean(authUser?.isSystemOwner || authUser?.permissions.includes(RBAC_PERMISSIONS.todoWrite));
    const canWriteCurrentTodos = todoView.type === "mine" && canWriteTodos;
    const canCreateCategory = Boolean(authUser?.isSystemOwner || authUser?.permissions.includes(RBAC_PERMISSIONS.todoCategoryCreate));
    const canUpdateCategory = Boolean(authUser?.isSystemOwner || authUser?.permissions.includes(RBAC_PERMISSIONS.todoCategoryUpdate));
    const canDeleteCategory = Boolean(authUser?.isSystemOwner || authUser?.permissions.includes(RBAC_PERMISSIONS.todoCategoryDelete));
    const leftPanelRef = useRef<HTMLElement | null>(null);
    const pageSize = useTodoPageSize(leftPanelRef, activeTab === "todos" && canReadCurrentView);
    const todoFilters = useTodoFilters(pageSize);
    const allTodosQuery = useTodosQuery({
        page: 1,
        pageSize: 100,
        sortBy: "createdat",
        isDescending: true,
    }, { type: "mine" }, canReadMine && activeTab === "todos" && todoView.type === "mine");
    const todosQuery = useTodosQuery(todoFilters.todoQuery, todoView, canReadCurrentView);
    const categoriesQuery = useTodoCategoriesQuery(todoView.type === "mine" && canReadMine && activeTab === "todos");
    const usersSummaryQuery = useQuery({
        queryKey: [
            ...QUERY_KEYS.todoUsersSummary(debouncedUsersSearch, usersPage, usersPageSize),
            userId ?? null,
        ],
        queryFn: ({ signal }) => todoService.getUsersSummary({
            search: debouncedUsersSearch,
            page: usersPage,
            pageSize: usersPageSize,
        }, signal),
        enabled: canReadAll && activeTab === "users",
        retry: false,
    });
    const mutations = useTodoMutations();

    const todos = todosQuery.data?.items ?? EMPTY_TODOS;
    const allTodos = todoView.type === "mine"
        ? allTodosQuery.data?.items ?? EMPTY_TODOS
        : todos;
    const categories = categoriesQuery.data ?? [];
    const loading = todosQuery.isLoading || (todoView.type === "mine" && (
        allTodosQuery.isLoading || categoriesQuery.isLoading
    ));
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
    const todoSelection = useTodoSelection(visibleTodos, canWriteCurrentTodos);
    const todoEditing = useTodoTableEditing({
        canWriteTodos,
        canEditCurrentView: canWriteCurrentTodos,
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
    const usersSearchIsDebouncing = usersSearch.trim() !== debouncedUsersSearch.trim();

    useEffect(() => {
        setPage((prev) => Math.min(prev, totalPages));
    }, [setPage, totalPages]);

    useEffect(() => {
        if (activeTab === "users" && !canReadAll && (canReadMine || todoView.type === "user")) {
            setActiveTab("todos");
        } else if (activeTab === "todos" && !canReadMine && todoView.type === "mine" && canReadAll) {
            setActiveTab("users");
        }
    }, [activeTab, canReadAll, canReadMine, todoView]);

    async function refetchTodos() {
        await todosQuery.refetch();
        if (todoView.type === "mine") await allTodosQuery.refetch();
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

    function switchTodoView(nextView: TodoView, targetUser: TodoUserSummaryDto | null, tab: "todos" | "users") {
        const isSameView = nextView.type === todoView.type &&
            (nextView.type === "mine" || (todoView.type === "user" && nextView.userId === todoView.userId));
        if (isSameView) {
            setActiveTab(tab);
            return;
        }

        const applyViewChange = () => {
            todoEditing.actions.resetEditing();
            todoSelection.actions.resetDeleteSelection();
            todoFilters.actions.selectCategory("all");
            todoFilters.actions.setPage(() => 1);
            setTodoView(nextView);
            setViewingUser(targetUser);
            setActiveTab(tab);
        };

        if (todoView.type === "mine" && todoEditing.editing.hasUnsavedChanges) {
            todoDialogActions.actions.openDiscardChangesDialog(applyViewChange);
            return;
        }

        applyViewChange();
    }

    function selectSummaryUser(user: TodoUserSummaryDto) {
        if (!canReadAll) return;
        switchTodoView({ type: "user", userId: user.userId }, user, "todos");
    }

    function returnToMyTodos() {
        if (!canReadMine) return;
        switchTodoView({ type: "mine" }, null, "todos");
    }

    function selectManagementTab(tab: "todos" | "users") {
        if (tab === "users" && !canReadAll) return;
        if (tab === "todos" && !canReadMine && todoView.type !== "user") return;
        setActiveTab(tab);
    }

    function openNewTodoEditor() {
        if (!canWriteCurrentTodos) return;
        todoEditing.actions.openNewTodoEditor();
        todoFilters.actions.closeFilter();
    }

    async function saveTodoPanel() {
        if (!canWriteCurrentTodos) return;
        const saved = await todoEditing.actions.saveInlineTodo(
            todoSelection.selectedRows
        );

        if (saved) {
            todoSelection.actions.resetDeleteSelection();
        }
    }

    const todoQueryError = todosQuery.isError ? getTodoReadError(todosQuery.error) : null;

    return {
        managementProps: {
            activeTab,
            canReadMine,
            canReadAll,
            canShowTodosTab: canReadMine || todoView.type === "user",
            canReadCurrentView,
            todoView,
            viewingUser,
            users: usersSummaryQuery.data?.items ?? [],
            usersLoading: usersSearchIsDebouncing || usersSummaryQuery.isLoading,
            usersFetching: usersSummaryQuery.isFetching,
            usersError: usersSearchIsDebouncing ? null : usersSummaryQuery.error,
            usersPage,
            usersTotalPages: Math.max(1, usersSummaryQuery.data?.totalPages ?? 1),
            usersSearch,
            onSelectTab: selectManagementTab,
            onUsersSearchChange: (value: string) => {
                setUsersSearch(value);
                setUsersPage(1);
            },
            onUsersPage: setUsersPage,
            onSelectUser: selectSummaryUser,
            onRetryUsers: () => void usersSummaryQuery.refetch(),
            onReturnToMyTodos: returnToMyTodos,
        },
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
                canWriteCurrentTodos,
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
                error: todoQueryError,
                rows: visibleTodos,
                totalRows: visibleTodoCount,
            },
            editing: {
                canWriteTodos: canWriteCurrentTodos,
                readOnlyMessage: todoView.type === "user"
                    ? "Viewing another User's Todos is read-only."
                    : "You can only view Todo because you don't have todo.write.",
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
                onDeleteSelected: canWriteCurrentTodos ? todoDialogActions.actions.openDeleteSelectedDialog : () => undefined,
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
                onRetry: () => void refetchTodos(),
            },
        },
    };
}

function getTodoReadError(error: unknown) {
    if (error instanceof ApiError) {
        if (error.status === 401) return "Your session has expired. Please sign in again.";
        if (error.status === 403) return "You do not have permission to view these todos.";
        return error.message || "Could not load todos. Please try again.";
    }

    return error instanceof Error ? error.message : "Could not load todos. Please try again.";
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
