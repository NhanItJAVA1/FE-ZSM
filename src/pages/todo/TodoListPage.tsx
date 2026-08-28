import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import TodoDialog from "../../features/todo/components/TodoDialog.js";
import TodoPanel from "../../features/todo/components/TodoPanel.js";
import type {
    SaveTodosPayload,
    TodoDto,
    TodoPriority,
    TodoQuery,
    TodoStatus,
} from "../../features/todo/types.js";
import {
    LEFT_TASK_PAGE_SIZE,
    countTodos,
    createTodoInlineDraft,
    getCategoryFilterId,
    getCategoryIdFromFilter,
    toInputDateTime,
    toPayload,
    type CategoryFilter,
    type TodoDialogState,
    type TodoFormState,
    type TodoInlineDraft,
    type TodoOverdueFilter,
} from "../../features/todo/todoPageUtils.js";
import { useTodoCategoriesQuery } from "../../hooks/useTodoCategoriesQuery.js";
import { useTodosQuery } from "../../hooks/useTodosQuery.js";
import { useTodoMutations } from "../../hooks/useTodoMutations.js";
import AppLayout from "../../layouts/AppLayout.js";

export default function TodoListPage() {
    const leftPanelRef = useRef<HTMLElement | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<TodoStatus | "All">("All");
    const [priorityFilter, setPriorityFilter] = useState<TodoPriority | "All">("All");
    const [overdueFilter, setOverdueFilter] = useState<TodoOverdueFilter>("All");
    const [taskPage, setTaskPage] = useState(1);
    const [filterOpen, setFilterOpen] = useState(false);
    const [selectedTodoId, setSelectedTodoId] = useState<number | null>(null);
    const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
    const [selectedDeleteIds, setSelectedDeleteIds] = useState<number[]>([]);
    const [editedTodoRows, setEditedTodoRows] = useState<Record<number, TodoFormState>>({});
    const [inlineDrafts, setInlineDrafts] = useState<TodoInlineDraft[]>([]);
    const [formError, setFormError] = useState<string | null>(null);
    const [categoryName, setCategoryName] = useState("");
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<CategoryFilter>("all");
    const [todoDialog, setTodoDialog] = useState<TodoDialogState>(null);
    const [renameCategoryName, setRenameCategoryName] = useState("");

    const selectedCategoryId = getCategoryIdFromFilter(selectedCategoryFilter);
    const todoQuery = useMemo<TodoQuery>(() => {
        const query: TodoQuery = {
            page: taskPage,
            pageSize: LEFT_TASK_PAGE_SIZE,
            sortBy: "createdat",
            isDescending: true,
        };

        const keyword = search.trim();
        if (keyword) query.search = keyword;
        if (statusFilter !== "All") query.status = statusFilter;
        if (priorityFilter !== "All") query.priority = priorityFilter;
        if (overdueFilter !== "All") query.isOverdue = overdueFilter === "Overdue";
        if (selectedCategoryId !== null) query.categoryId = selectedCategoryId;

        return query;
    }, [overdueFilter, priorityFilter, search, selectedCategoryId, statusFilter, taskPage]);

    const allTodosQuery = useTodosQuery({
        page: 1,
        pageSize: 100,
        sortBy: "createdat",
        isDescending: true,
    });
    const todosQuery = useTodosQuery(todoQuery);
    const categoriesQuery = useTodoCategoriesQuery();
    const mutations = useTodoMutations();

    const todos = todosQuery.data?.items ?? [];
    const allTodos = allTodosQuery.data?.items ?? [];
    const categories = categoriesQuery.data ?? [];
    const loading = todosQuery.isLoading || allTodosQuery.isLoading || categoriesQuery.isLoading;
    const visibleTodos = useMemo(() => {
        if (selectedCategoryFilter === "uncategorized") {
            return todos.filter((todo) => todo.categoryId === null);
        }

        return todos;
    }, [selectedCategoryFilter, todos]);
    const counts = useMemo(() => countTodos(allTodos), [allTodos]);
    const advancedFiltersActive =
        statusFilter !== "All" ||
        priorityFilter !== "All" ||
        overdueFilter !== "All";
    const visibleTodoCount =
        selectedCategoryFilter === "uncategorized"
            ? visibleTodos.length
            : todosQuery.data?.totalItems ?? visibleTodos.length;
    const totalTaskPages = Math.max(1, todosQuery.data?.totalPages ?? 1);
    const selectedTodo = visibleTodos.find((todo) => todo.id === selectedTodoId) ?? null;
    const selectedDeleteTodos = visibleTodos.filter((todo) =>
        selectedDeleteIds.includes(todo.id)
    );

    useEffect(() => {
        setTaskPage(1);
    }, [search, statusFilter, priorityFilter, overdueFilter, selectedCategoryFilter]);

    useEffect(() => {
        setTaskPage((current) => Math.min(current, totalTaskPages));
    }, [totalTaskPages]);

    useEffect(() => {
        if (visibleTodos.length === 0) {
            setSelectedTodoId(null);
            setSelectedDeleteIds([]);
            return;
        }

        setSelectedTodoId((current) => {
            if (current !== null && visibleTodos.some((todo) => todo.id === current)) {
                return current;
            }

            return visibleTodos[0]?.id ?? null;
        });
        setSelectedDeleteIds((current) =>
            current.filter((id) => visibleTodos.some((todo) => todo.id === id))
        );
    }, [visibleTodos]);

    function resetForm() {
        setEditedTodoRows({});
        setSelectedDeleteIds([]);
        setBulkDeleteMode(false);
        setInlineDrafts([]);
        setFormError(null);
    }

    function clearAdvancedFilters() {
        setStatusFilter("All");
        setPriorityFilter("All");
        setOverdueFilter("All");
        setFilterOpen(false);
    }

    function clearTodoFilters() {
        setSearch("");
        clearAdvancedFilters();
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
        setFilterOpen(false);
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

    function selectTodo(todoId: number) {
        setSelectedTodoId(todoId);
        setFilterOpen(false);
    }

    function toggleBulkDeleteMode() {
        setBulkDeleteMode((current) => !current);
        setSelectedDeleteIds([]);
    }

    function deleteSelectedTodos() {
        if (selectedDeleteTodos.length === 0) return;
        setTodoDialog({ type: "deleteTodos", todos: selectedDeleteTodos });
    }

    function toggleDeleteSelection(todoId: number) {
        setSelectedDeleteIds((current) =>
            current.includes(todoId)
                ? current.filter((id) => id !== todoId)
                : [...current, todoId]
        );
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

        if (
            inlineDrafts.length === 0 &&
            changedRows.length === 0
        ) {
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

            await mutations.saveTodos.mutateAsync(payloads);
            await Promise.all([todosQuery.refetch(), allTodosQuery.refetch()]);

            resetForm();
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Không thể lưu todo.");
        }
    }

    async function submitCategory(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const name = categoryName.trim();
        if (!name) return;

        await mutations.createCategory.mutateAsync(name);
        setCategoryName("");
    }

    function selectCategory(filter: CategoryFilter) {
        setSearch("");
        clearAdvancedFilters();
        setSelectedTodoId(null);
        resetForm();
        setSelectedCategoryFilter(filter);
    }

    function deleteTodo(todo: TodoDto) {
        setTodoDialog({ type: "deleteTodo", todo });
    }

    function deleteCategory(category: { id: number; name: string }) {
        setTodoDialog({ type: "deleteCategory", category });
    }

    function renameCategory(category: { id: number; name: string }) {
        setRenameCategoryName(category.name);
        setTodoDialog({ type: "renameCategory", category });
    }

    function toDeletedPayload(todo: TodoDto): SaveTodosPayload[number] {
        return {
            id: todo.id,
            title: "",
            description: null,
            priority: null,
            dueDate: null,
            categoryId: null,
            isDeleted: true,
        };
    }

    async function confirmDeleteTodo(todo: TodoDto) {
        await mutations.saveTodos.mutateAsync([toDeletedPayload(todo)]);
        await Promise.all([todosQuery.refetch(), allTodosQuery.refetch()]);

        setEditedTodoRows((current) => {
            const { [todo.id]: _removed, ...rest } = current;
            return rest;
        });
        setSelectedDeleteIds((current) => current.filter((id) => id !== todo.id));

        if (selectedTodoId === todo.id) setSelectedTodoId(null);
        setTodoDialog(null);
    }

    async function confirmDeleteTodos(todos: TodoDto[]) {
        const payloads: SaveTodosPayload = todos.map(toDeletedPayload);

        await mutations.saveTodos.mutateAsync(payloads);
        await Promise.all([todosQuery.refetch(), allTodosQuery.refetch()]);

        const ids = todos.map((todo) => todo.id);
        setEditedTodoRows((current) => {
            const next = { ...current };
            ids.forEach((id) => {
                delete next[id];
            });
            return next;
        });

        if (todos.some((todo) => todo.id === selectedTodoId)) {
            setSelectedTodoId(null);
        }

        setSelectedDeleteIds([]);
        setBulkDeleteMode(false);
        setTodoDialog(null);
    }

    async function confirmDeleteCategory(
        category: { id: number; name: string },
        deleteTodos: boolean
    ) {
        await mutations.deleteCategory.mutateAsync({
            id: category.id,
            deleteTodos,
        });

        if (selectedCategoryFilter === getCategoryFilterId(category.id)) {
            setSelectedCategoryFilter("all");
        }

        setTodoDialog(null);
    }

    async function confirmRenameCategory(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (todoDialog?.type !== "renameCategory") return;
        const name = renameCategoryName.trim();
        if (!name || name === todoDialog.category.name) return;

        await mutations.updateCategory.mutateAsync({
            id: todoDialog.category.id,
            name,
        });
        setTodoDialog(null);
        setRenameCategoryName("");
    }

    return (
        <AppLayout>
            <main className="todo-list-page">
                <aside className="todo-simple-category-panel" aria-label="Todo categories">
                    <div className="todo-panel-heading todo-simple-category-heading">
                        <div className="todo-simple-category-title">
                            <p className="eyebrow">Category</p>
                            <div className="todo-stat-row todo-simple-category-stats">
                                <span><b>{counts.all}</b> Total</span>
                                <span><b>{counts.progress}</b> Running</span>
                                <span><b>{counts.overdue}</b> Overdue</span>
                            </div>
                        </div>

                        <form className="todo-simple-category-form" onSubmit={submitCategory}>
                            <input
                                value={categoryName}
                                placeholder="Enter for new category"
                                aria-label="Enter for new category"
                                onChange={(event) => setCategoryName(event.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={mutations.createCategory.isPending}
                                aria-label="Thêm category"
                                title="Thêm category"
                            >
                                +
                            </button>
                        </form>
                    </div>

                    <div className="todo-simple-category-list">
                        <button
                            type="button"
                            className={`todo-simple-category-item ${selectedCategoryFilter === "all" ? "active" : ""}`}
                            onClick={() => selectCategory("all")}
                        >
                            <span>All</span>
                            <small>{allTodos.length}</small>
                        </button>

                        {categories.map((category) => {
                            const filterId = getCategoryFilterId(category.id);
                            const taskCount = allTodos.filter(
                                (todo) => todo.categoryId === category.id
                            ).length;

                            return (
                                <article
                                    key={category.id}
                                    className={`todo-simple-category-row ${selectedCategoryFilter === filterId ? "active" : ""}`}
                                >
                                    <button
                                        type="button"
                                        className="todo-simple-category-item todo-simple-category-item--main"
                                        onClick={() => selectCategory(filterId)}
                                    >
                                        <span>{category.name}</span>
                                        <small>{taskCount}</small>
                                    </button>
                                    <div className="todo-simple-category-actions">
                                        <button
                                            type="button"
                                            aria-label={`Đổi tên category ${category.name}`}
                                            title="Đổi tên category"
                                            onClick={() => renameCategory(category)}
                                        >
                                            <Pencil size={13} strokeWidth={2.3} />
                                        </button>
                                        <button
                                            type="button"
                                            aria-label={`Xóa category ${category.name}`}
                                            title="Xóa category"
                                            onClick={() => deleteCategory(category)}
                                        >
                                            <Trash2 size={13} strokeWidth={2.3} />
                                        </button>
                                    </div>
                                </article>
                            );
                        })}

                        <button
                            type="button"
                            className={`todo-simple-category-item ${selectedCategoryFilter === "uncategorized" ? "active" : ""}`}
                            onClick={() => selectCategory("uncategorized")}
                        >
                            <span>others</span>
                            <small>{allTodos.filter((todo) => todo.categoryId === null).length}</small>
                        </button>
                    </div>
                </aside>

                <div className="todo-list-page-panel">
                    <TodoPanel
                        categories={categories}
                        counts={counts}
                        editedTodoRows={editedTodoRows}
                        formError={formError}
                        inlineDrafts={inlineDrafts}
                        leftPanelRef={leftPanelRef}
                        loading={loading}
                        paginatedTodos={visibleTodos}
                        search={search}
                        filterActive={advancedFiltersActive}
                        filterOpen={filterOpen}
                        overdueFilter={overdueFilter}
                        priorityFilter={priorityFilter}
                        selectedTodoId={selectedTodo?.id ?? null}
                        bulkDeleteMode={bulkDeleteMode}
                        selectedDeleteIds={selectedDeleteIds}
                        statusFilter={statusFilter}
                        taskPage={taskPage}
                        totalTaskPages={totalTaskPages}
                        visibleTodosLength={visibleTodoCount}
                        onClearFilters={clearTodoFilters}
                        onClearAdvancedFilters={clearAdvancedFilters}
                        onDeleteTodo={deleteTodo}
                        onDeleteSelectedTodos={deleteSelectedTodos}
                        onOpenNewTodoEditor={openNewTodoEditor}
                        onResetForm={resetForm}
                        onSearchChange={setSearch}
                        onSelectTodo={selectTodo}
                        onRemoveInlineDraft={removeInlineDraft}
                        onToggleFilter={() =>
                            setFilterOpen((current) => !current)
                        }
                        onToggleBulkDeleteMode={toggleBulkDeleteMode}
                        onToggleDeleteSelection={toggleDeleteSelection}
                        onSetInlineDraft={updateInlineDraft}
                        onSetTodoRow={updateTodoRow}
                        onSetOverdueFilter={setOverdueFilter}
                        onSetPriorityFilter={setPriorityFilter}
                        onSetStatusFilter={setStatusFilter}
                        onSetTaskPage={setTaskPage}
                        onSaveTodo={() => void saveInlineTodo()}
                        savingTodo={mutations.saveTodos.isPending}
                    />
                </div>
            </main>

            <TodoDialog
                deleteCategoryPending={mutations.deleteCategory.isPending}
                deleteTodoPending={mutations.saveTodos.isPending}
                dialog={todoDialog}
                renameCategoryName={renameCategoryName}
                updateCategoryPending={mutations.updateCategory.isPending}
                onCancel={() => setTodoDialog(null)}
                onConfirmDeleteCategory={(category, deleteTodos) =>
                    void confirmDeleteCategory(category, deleteTodos)
                }
                onConfirmDeleteTodo={(todo) => void confirmDeleteTodo(todo)}
                onConfirmDeleteTodos={(todos) => void confirmDeleteTodos(todos)}
                onConfirmRenameCategory={confirmRenameCategory}
                onRenameCategoryNameChange={setRenameCategoryName}
            />

        </AppLayout>
    );
}
