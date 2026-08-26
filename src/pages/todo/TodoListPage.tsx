import { useEffect, useMemo, useRef, useState } from "react";
import TodoBulkCreateModal, {
    createTodoBulkDraft,
    type TodoBulkDraft,
} from "../../features/todo/components/TodoBulkCreateModal.js";
import TodoDialog from "../../features/todo/components/TodoDialog.js";
import TodoLeftPanel from "../../features/todo/components/TodoLeftPanel.js";
import type { TodoDto, TodoPriority, TodoQuery, TodoStatus } from "../../features/todo/types.js";
import {
    LEFT_TASK_PAGE_SIZE,
    countTodos,
    emptyForm,
    getCategoryFilterId,
    getCategoryIdFromFilter,
    toInputDateTime,
    toPayload,
    type CategoryFilter,
    type TodoDialogState,
    type TodoFormState,
    type TodoOverdueFilter,
} from "../../features/todo/todoPageUtils.js";
import { useTodoCategoriesQuery } from "../../hooks/useTodoCategoriesQuery.js";
import { useTodosQuery } from "../../hooks/useTodosQuery.js";
import { useTodoMutations } from "../../hooks/useTodoMutations.js";
import AppLayout from "../../layouts/AppLayout.js";

export default function TodoListPage() {
    const leftPanelRef = useRef<HTMLElement | null>(null);
    const editorDoorRef = useRef<HTMLFormElement | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<TodoStatus | "All">("All");
    const [priorityFilter, setPriorityFilter] = useState<TodoPriority | "All">("All");
    const [overdueFilter, setOverdueFilter] = useState<TodoOverdueFilter>("All");
    const [taskPage, setTaskPage] = useState(1);
    const [filterOpen, setFilterOpen] = useState(false);
    const [selectedTodoId, setSelectedTodoId] = useState<number | null>(null);
    const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isBulkCreateOpen, setIsBulkCreateOpen] = useState(false);
    const [form, setForm] = useState<TodoFormState>(emptyForm);
    const [formError, setFormError] = useState<string | null>(null);
    const [bulkDrafts, setBulkDrafts] = useState<TodoBulkDraft[]>(() => [
        createTodoBulkDraft(),
    ]);
    const [bulkCreateError, setBulkCreateError] = useState<string | null>(null);
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

    useEffect(() => {
        setTaskPage(1);
    }, [search, statusFilter, priorityFilter, overdueFilter, selectedCategoryFilter]);

    useEffect(() => {
        setTaskPage((current) => Math.min(current, totalTaskPages));
    }, [totalTaskPages]);

    useEffect(() => {
        if (visibleTodos.length === 0) {
            setSelectedTodoId(null);
            return;
        }

        setSelectedTodoId((current) => {
            if (current !== null && visibleTodos.some((todo) => todo.id === current)) {
                return current;
            }

            return visibleTodos[0]?.id ?? null;
        });
    }, [visibleTodos]);

    function resetForm() {
        setEditingTodoId(null);
        setForm(emptyForm);
        setFormError(null);
        setIsEditorOpen(false);
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

    function openNewTodoEditor() {
        resetForm();
        setBulkCreateError(null);
        setBulkDrafts([createTodoBulkDraft()]);
        setIsBulkCreateOpen(true);
    }

    function closeBulkCreateModal() {
        setIsBulkCreateOpen(false);
        setBulkCreateError(null);
        setBulkDrafts([createTodoBulkDraft()]);
    }

    function addBulkDraftRow() {
        setBulkDrafts((current) => [...current, createTodoBulkDraft()]);
    }

    function removeBulkDraftRow(id: string) {
        setBulkDrafts((current) => {
            if (current.length === 1) return current;

            return current.filter((draft) => draft.id !== id);
        });
    }

    function selectTodo(todoId: number) {
        setSelectedTodoId(todoId);
        setFilterOpen(false);
    }

    function editTodo(todo: TodoDto) {
        setIsBulkCreateOpen(false);
        selectTodo(todo.id);
        setEditingTodoId(todo.id);
        setForm({
            title: todo.title,
            description: todo.description ?? "",
            priority: todo.priority,
            dueDate: toInputDateTime(todo.dueDate),
            categoryId: todo.categoryId ? String(todo.categoryId) : "",
        });
        setFormError(null);
        setIsEditorOpen(true);
    }

    async function submitTodo(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError(null);

        if (!form.title.trim()) {
            setFormError("Tiêu đề task là bắt buộc.");
            return;
        }

        try {
            if (!editingTodoId) return;

            await mutations.updateTodo.mutateAsync({
                id: editingTodoId,
                payload: toPayload(form),
            });

            resetForm();
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Không thể lưu todo.");
        }
    }

    async function submitBulkTodos(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setBulkCreateError(null);

        const invalidRowIndex = bulkDrafts.findIndex((draft) => !draft.title.trim());

        if (invalidRowIndex !== -1) {
            setBulkCreateError(`Dòng ${invalidRowIndex + 1} cần có title.`);
            return;
        }

        try {
            await mutations.createTodo.mutateAsync(bulkDrafts.map(toPayload));
            closeBulkCreateModal();
        } catch (error) {
            setBulkCreateError(
                error instanceof Error ? error.message : "Không thể tạo todo."
            );
        }
    }

    async function submitCategory(event: React.FormEvent<HTMLFormElement>) {
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
        setSelectedCategoryFilter(filter);
    }

    function deleteTodo(todo: TodoDto) {
        setTodoDialog({ type: "deleteTodo", todo });
    }

    async function confirmDeleteTodo(todo: TodoDto) {
        await mutations.deleteTodo.mutateAsync(todo.id);
        if (selectedTodoId === todo.id) setSelectedTodoId(null);
        if (editingTodoId === todo.id) resetForm();
        setTodoDialog(null);
    }

    async function confirmRenameCategory(event: React.FormEvent<HTMLFormElement>) {
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
                    <div className="todo-panel-heading">
                        <div>
                            <p className="eyebrow">Category</p>
                        </div>
                    </div>

                    <form className="todo-simple-category-form" onSubmit={submitCategory}>
                        <input
                            value={categoryName}
                            placeholder="Tạo category mới"
                            aria-label="Tạo category mới"
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
                                <button
                                    key={category.id}
                                    type="button"
                                    className={`todo-simple-category-item ${selectedCategoryFilter === filterId ? "active" : ""}`}
                                    onClick={() => selectCategory(filterId)}
                                >
                                    <span>{category.name}</span>
                                    <small>{taskCount}</small>
                                </button>
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
                    <TodoLeftPanel
                        categories={categories}
                        counts={counts}
                        editingTodoId={editingTodoId}
                        editorDoorRef={editorDoorRef}
                        form={form}
                        formError={formError}
                        isEditorOpen={isEditorOpen}
                        isBulkCreateOpen={isBulkCreateOpen}
                        isLeftCollapsed={false}
                        leftPanelRef={leftPanelRef}
                        loading={loading}
                        paginatedTodos={visibleTodos}
                        search={search}
                        filterActive={advancedFiltersActive}
                        filterOpen={filterOpen}
                        overdueFilter={overdueFilter}
                        priorityFilter={priorityFilter}
                        selectedTodoId={selectedTodo?.id ?? null}
                        statusFilter={statusFilter}
                        taskPage={taskPage}
                        totalTaskPages={totalTaskPages}
                        visibleTodosLength={visibleTodoCount}
                        onClearFilters={clearTodoFilters}
                        onClearAdvancedFilters={clearAdvancedFilters}
                        onDeleteTodo={deleteTodo}
                        onEditTodo={editTodo}
                        onOpenNewTodoEditor={openNewTodoEditor}
                        onResetForm={resetForm}
                        onSearchChange={setSearch}
                        onSelectTodo={selectTodo}
                        onToggleFilter={() =>
                            setFilterOpen((current) => !current)
                        }
                        onSetForm={setForm}
                        onSetIsLeftCollapsed={() => undefined}
                        onSetOverdueFilter={setOverdueFilter}
                        onSetPriorityFilter={setPriorityFilter}
                        onSetStatusFilter={setStatusFilter}
                        onSetTaskPage={setTaskPage}
                        onSubmitTodo={submitTodo}
                        onUpdateStatus={(id, status) =>
                            mutations.updateStatus.mutate({ id, status })
                        }
                        savingTodo={mutations.createTodo.isPending || mutations.updateTodo.isPending}
                        allowCollapse={false}
                    />
                </div>
            </main>

            <TodoDialog
                deleteCategoryPending={mutations.deleteCategory.isPending}
                deleteTodoPending={mutations.deleteTodo.isPending}
                dialog={todoDialog}
                renameCategoryName={renameCategoryName}
                updateCategoryPending={mutations.updateCategory.isPending}
                onCancel={() => setTodoDialog(null)}
                onConfirmDeleteCategory={(category, deleteTodos) =>
                    void mutations.deleteCategory.mutateAsync({
                        id: category.id,
                        deleteTodos,
                    }).then(() => setTodoDialog(null))
                }
                onConfirmDeleteTodo={(todo) => void confirmDeleteTodo(todo)}
                onConfirmRenameCategory={confirmRenameCategory}
                onRenameCategoryNameChange={setRenameCategoryName}
            />

            {isBulkCreateOpen && (
                <TodoBulkCreateModal
                    categories={categories}
                    drafts={bulkDrafts}
                    error={bulkCreateError}
                    saving={mutations.createTodo.isPending}
                    onAddRow={addBulkDraftRow}
                    onCancel={closeBulkCreateModal}
                    onRemoveRow={removeBulkDraftRow}
                    onSetDrafts={setBulkDrafts}
                    onSubmit={submitBulkTodos}
                />
            )}
        </AppLayout>
    );
}
