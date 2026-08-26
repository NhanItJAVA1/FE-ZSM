import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import TodoCategoryRail from "../../features/todo/components/TodoCategoryRail.js";
import TodoDetailPanel from "../../features/todo/components/TodoDetailPanel.js";
import TodoDialog from "../../features/todo/components/TodoDialog.js";
import TodoLeftPanel from "../../features/todo/components/TodoLeftPanel.js";
import TodoTimelinePanel from "../../features/todo/components/TodoTimelinePanel.js";
import type { TodoCategoryDto, TodoDto, TodoStatus } from "../../features/todo/types.js";
import {
    ACTIVITY_PAGE_SIZE,
    LEFT_TASK_PAGE_SIZE,
    STATUS_LABELS,
    buildTimelineDates,
    countTodos,
    emptyForm,
    getCategoryFilterId,
    getCategoryIdFromFilter,
    toInputDateTime,
    toPayload,
    type CategoryFilter,
    type TodoDialogState,
    type TodoFormState,
} from "../../features/todo/todoPageUtils.js";
import { useTodoCategoriesQuery } from "../../hooks/useTodoCategoriesQuery.js";
import { useTodoActivitiesQuery, useTodosQuery } from "../../hooks/useTodosQuery.js";
import { useTodoMutations } from "../../hooks/useTodoMutations.js";
import AppLayout from "../../layouts/AppLayout.js";

export default function TodoPage() {
    const railRef = useRef<HTMLDivElement | null>(null);
    const leftPanelRef = useRef<HTMLElement | null>(null);
    const editorDoorRef = useRef<HTMLFormElement | null>(null);
    const dragStateRef = useRef({
        active: false,
        didDrag: false,
        startX: 0,
        scrollLeft: 0,
    });
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<TodoStatus | "All">("All");
    const [taskPage, setTaskPage] = useState(1);
    const [activityPage, setActivityPage] = useState(1);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [statusFilterOpen, setStatusFilterOpen] = useState(false);
    const [selectedTodoId, setSelectedTodoId] = useState<number | null>(null);
    const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
    const [form, setForm] = useState<TodoFormState>(emptyForm);
    const [categoryName, setCategoryName] = useState("");
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<CategoryFilter>("all");
    const [isRailDragging, setIsRailDragging] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [todoDialog, setTodoDialog] = useState<TodoDialogState>(null);
    const [renameCategoryName, setRenameCategoryName] = useState("");

    const todosQuery = useTodosQuery({
        page: 1,
        pageSize: 100,
        sortBy: "createdat",
        isDescending: true,
    });
    const categoriesQuery = useTodoCategoriesQuery();
    const mutations = useTodoMutations();

    const todos = todosQuery.data?.items ?? [];
    const categories = categoriesQuery.data ?? [];
    const loading = todosQuery.isLoading || categoriesQuery.isLoading;

    const visibleTodos = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        const selectedCategoryId = getCategoryIdFromFilter(selectedCategoryFilter);

        return todos.filter((todo) => {
            if (selectedCategoryFilter === "uncategorized" && todo.categoryId !== null) {
                return false;
            }

            if (
                selectedCategoryId !== null &&
                todo.categoryId !== selectedCategoryId
            ) {
                return false;
            }

            if (statusFilter !== "All" && todo.status !== statusFilter) {
                return false;
            }

            if (!normalizedSearch) return true;

            return [todo.title, todo.description, todo.categoryName]
                .filter(Boolean)
                .some((value) => value!.toLowerCase().includes(normalizedSearch));
        });
    }, [todos, search, statusFilter, selectedCategoryFilter]);

    const selectedTodo =
        visibleTodos.find((todo) => todo.id === selectedTodoId) ??
        visibleTodos[0] ??
        null;
    const activitiesQuery = useTodoActivitiesQuery(selectedTodo?.id ?? null);
    const activities = activitiesQuery.data ?? [];
    const totalActivityPages = Math.max(
        1,
        Math.ceil(activities.length / ACTIVITY_PAGE_SIZE)
    );
    const paginatedActivities = useMemo(() => {
        const start = (activityPage - 1) * ACTIVITY_PAGE_SIZE;

        return activities.slice(start, start + ACTIVITY_PAGE_SIZE);
    }, [activities, activityPage]);
    const timeline = useMemo(() => buildTimelineDates(visibleTodos), [visibleTodos]);
    const timelineGridStyle = {
        "--timeline-days": timeline.ticks.length,
        "--timeline-track-min": `${230 + timeline.ticks.length * 88}px`,
    } as CSSProperties;
    const totalTaskPages = Math.max(
        1,
        Math.ceil(visibleTodos.length / LEFT_TASK_PAGE_SIZE)
    );
    const paginatedTodos = useMemo(() => {
        const start = (taskPage - 1) * LEFT_TASK_PAGE_SIZE;

        return visibleTodos.slice(start, start + LEFT_TASK_PAGE_SIZE);
    }, [visibleTodos, taskPage]);

    const counts = useMemo(() => countTodos(todos), [todos]);
    const visibleCounts = useMemo(() => countTodos(visibleTodos), [visibleTodos]);
    const clearFiltersVisible = Boolean(search || statusFilter !== "All");
    const statusFilterLabel =
        statusFilter === "All" ? "All" : STATUS_LABELS[statusFilter];

    const selectedCategoryName = useMemo(() => {
        if (selectedCategoryFilter === "all") return "All tracks";
        if (selectedCategoryFilter === "uncategorized") return "others";

        const id = getCategoryIdFromFilter(selectedCategoryFilter);
        return categories.find((category) => category.id === id)?.name ?? "Category";
    }, [categories, selectedCategoryFilter]);

    useEffect(() => {
        setTaskPage(1);
    }, [search, statusFilter, selectedCategoryFilter]);

    useEffect(() => {
        setTaskPage((current) => Math.min(current, totalTaskPages));
    }, [totalTaskPages]);

    useEffect(() => {
        if (visibleTodos.length === 0) {
            setSelectedTodoId(null);
            setHistoryOpen(false);
            setStatusFilterOpen(false);
            return;
        }

        setSelectedTodoId((current) => {
            if (current !== null && visibleTodos.some((todo) => todo.id === current)) {
                return current;
            }

            const [firstTodo] = visibleTodos;
            return firstTodo?.id ?? null;
        });
    }, [visibleTodos]);

    useEffect(() => {
        setActivityPage(1);
    }, [selectedTodo?.id]);

    useEffect(() => {
        setActivityPage((current) => Math.min(current, totalActivityPages));
    }, [totalActivityPages]);

    function resetForm() {
        setEditingTodoId(null);
        setForm(emptyForm);
        setFormError(null);
        setIsEditorOpen(false);
    }

    function selectTodo(todoId: number) {
        setSelectedTodoId(todoId);
        setHistoryOpen(false);
        setStatusFilterOpen(false);
    }

    function clearTodoFilters() {
        setSearch("");
        setStatusFilter("All");
        setStatusFilterOpen(false);
    }

    function scrollEditorDoorIntoView() {
        const editor = editorDoorRef.current;

        if (!editor) {
            leftPanelRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
            return;
        }

        const margin = 18;
        const rect = editor.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const availableHeight = viewportHeight - margin * 2;
        let scrollTop = 0;

        if (rect.height >= availableHeight) {
            scrollTop = rect.top - margin;
        } else if (rect.top < margin) {
            scrollTop = rect.top - margin;
        } else if (rect.bottom > viewportHeight - margin) {
            scrollTop = rect.bottom - viewportHeight + margin;
        }

        if (Math.abs(scrollTop) > 1) {
            window.scrollBy({
                top: scrollTop,
                behavior: "smooth",
            });
        }
    }

    function scheduleEditorDoorScroll() {
        window.requestAnimationFrame(() => {
            leftPanelRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
            window.setTimeout(scrollEditorDoorIntoView, 260);
            window.setTimeout(scrollEditorDoorIntoView, 760);
        });
    }

    function openNewTodoEditor() {
        setIsLeftCollapsed(false);
        setEditingTodoId(null);
        setForm(emptyForm);
        setFormError(null);
        setIsEditorOpen(true);
        scheduleEditorDoorScroll();
    }

    function editTodo(todo: TodoDto) {
        setIsLeftCollapsed(false);
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
        scheduleEditorDoorScroll();
    }

    async function submitTodo(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError(null);

        if (!form.title.trim()) {
            setFormError("Tiêu đề task là bắt buộc.");
            return;
        }

        try {
            if (editingTodoId) {
                await mutations.updateTodo.mutateAsync({
                    id: editingTodoId,
                    payload: toPayload(form),
                });
            } else {
                await mutations.createTodo.mutateAsync(toPayload(form));
            }

            resetForm();
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Không thể lưu todo.");
        }
    }

    async function submitCategory(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!categoryName.trim()) return;

        await mutations.createCategory.mutateAsync(categoryName);
        setCategoryName("");
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

    function deleteCategory(category: TodoCategoryDto) {
        setTodoDialog({ type: "deleteCategory", category });
    }

    async function confirmDeleteCategory(
        category: TodoCategoryDto,
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

    function renameCategory(category: TodoCategoryDto) {
        setRenameCategoryName(category.name);
        setTodoDialog({ type: "renameCategory", category });
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

    function scrollRail(direction: "left" | "right") {
        railRef.current?.scrollBy({
            left: direction === "left" ? -320 : 320,
            behavior: "smooth",
        });
    }

    function selectCategory(filter: CategoryFilter) {
        setSearch("");
        setStatusFilter("All");
        setSelectedTodoId(null);
        setHistoryOpen(false);
        setStatusFilterOpen(false);
        setSelectedCategoryFilter(filter);
    }

    function handleRailPointerDown(event: React.PointerEvent<HTMLDivElement>) {
        if ((event.target as HTMLElement).closest("button")) {
            return;
        }

        dragStateRef.current = {
            active: true,
            didDrag: false,
            startX: event.clientX,
            scrollLeft: event.currentTarget.scrollLeft,
        };
        setIsRailDragging(true);
    }

    function handleRailPointerMove(event: React.PointerEvent<HTMLDivElement>) {
        if (!dragStateRef.current.active) return;

        const distance = event.clientX - dragStateRef.current.startX;
        if (Math.abs(distance) > 5) {
            dragStateRef.current.didDrag = true;
        }
        event.currentTarget.scrollLeft = dragStateRef.current.scrollLeft - distance;
    }

    function handleRailPointerEnd() {
        if (!dragStateRef.current.active) return;

        dragStateRef.current.active = false;
        setIsRailDragging(false);

        if (dragStateRef.current.didDrag) {
            window.setTimeout(() => {
                dragStateRef.current.didDrag = false;
            }, 0);
        }
    }

    return (
        <AppLayout>
            <main className={`todo-workspace ${isLeftCollapsed ? "todo-workspace--left-collapsed" : ""}`}>
                <TodoCategoryRail
                    categories={categories}
                    categoryName={categoryName}
                    isRailDragging={isRailDragging}
                    railRef={railRef}
                    selectedCategoryFilter={selectedCategoryFilter}
                    selectedCategoryName={selectedCategoryName}
                    todos={todos}
                    onCategoryNameChange={setCategoryName}
                    onDeleteCategory={deleteCategory}
                    onPointerDown={handleRailPointerDown}
                    onPointerEnd={handleRailPointerEnd}
                    onPointerMove={handleRailPointerMove}
                    onRenameCategory={renameCategory}
                    onScrollRail={scrollRail}
                    onSelectCategory={selectCategory}
                    onSubmitCategory={submitCategory}
                />

                <TodoLeftPanel
                    categories={categories}
                    counts={counts}
                    editingTodoId={editingTodoId}
                    editorDoorRef={editorDoorRef}
                    form={form}
                    formError={formError}
                    isEditorOpen={isEditorOpen}
                    isLeftCollapsed={isLeftCollapsed}
                    leftPanelRef={leftPanelRef}
                    loading={loading}
                    paginatedTodos={paginatedTodos}
                    search={search}
                    selectedTodoId={selectedTodo?.id ?? null}
                    statusFilter={statusFilter}
                    taskPage={taskPage}
                    totalTaskPages={totalTaskPages}
                    visibleTodosLength={visibleTodos.length}
                    onClearFilters={clearTodoFilters}
                    onDeleteTodo={deleteTodo}
                    onEditTodo={editTodo}
                    onOpenNewTodoEditor={openNewTodoEditor}
                    onResetForm={resetForm}
                    onSearchChange={setSearch}
                    onSelectTodo={selectTodo}
                    onSetForm={setForm}
                    onSetIsLeftCollapsed={setIsLeftCollapsed}
                    onSetStatusFilter={setStatusFilter}
                    onSetTaskPage={setTaskPage}
                    onSubmitTodo={submitTodo}
                    onUpdateStatus={(id, status) =>
                        mutations.updateStatus.mutate({ id, status })
                    }
                    savingTodo={mutations.createTodo.isPending || mutations.updateTodo.isPending}
                />

                <TodoTimelinePanel
                    clearFiltersVisible={clearFiltersVisible}
                    loading={loading}
                    selectedTodoId={selectedTodo?.id ?? null}
                    timeline={timeline}
                    timelineGridStyle={timelineGridStyle}
                    todos={visibleTodos}
                    visibleCounts={visibleCounts}
                    onClearFilters={clearTodoFilters}
                    onSelectTodo={selectTodo}
                >
                    <TodoDetailPanel
                        activities={activities}
                        activityPage={activityPage}
                        activitiesLoading={activitiesQuery.isLoading}
                        clearFiltersVisible={clearFiltersVisible}
                        counts={counts}
                        historyOpen={historyOpen}
                        paginatedActivities={paginatedActivities}
                        selectedTodo={selectedTodo}
                        statusFilter={statusFilter}
                        statusFilterLabel={statusFilterLabel}
                        statusFilterOpen={statusFilterOpen}
                        totalActivityPages={totalActivityPages}
                        onClearFilters={clearTodoFilters}
                        onSetActivityPage={setActivityPage}
                        onSetHistoryOpen={setHistoryOpen}
                        onSetStatusFilter={setStatusFilter}
                        onSetStatusFilterOpen={setStatusFilterOpen}
                    />
                </TodoTimelinePanel>
            </main>

            <TodoDialog
                deleteCategoryPending={mutations.deleteCategory.isPending}
                deleteTodoPending={mutations.deleteTodo.isPending}
                dialog={todoDialog}
                renameCategoryName={renameCategoryName}
                updateCategoryPending={mutations.updateCategory.isPending}
                onCancel={() => setTodoDialog(null)}
                onConfirmDeleteCategory={(category, deleteTodos) =>
                    void confirmDeleteCategory(category, deleteTodos)
                }
                onConfirmDeleteTodo={(todo) => void confirmDeleteTodo(todo)}
                onConfirmRenameCategory={confirmRenameCategory}
                onRenameCategoryNameChange={setRenameCategoryName}
            />
        </AppLayout>
    );
}
