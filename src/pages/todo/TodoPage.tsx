import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import TodoCategoryRail from "../../features/todo/components/TodoCategoryRail.js";
import TodoBulkCreateModal, {
    createTodoBulkDraft,
    type TodoBulkDraft,
} from "../../features/todo/components/TodoBulkCreateModal.js";
import TodoDetailPanel from "../../features/todo/components/TodoDetailPanel.js";
import TodoDialog from "../../features/todo/components/TodoDialog.js";
import TodoLeftPanel from "../../features/todo/components/TodoLeftPanel.js";
import TodoTimelinePanel from "../../features/todo/components/TodoTimelinePanel.js";
import type { TodoCategoryDto, TodoDto, TodoPriority, TodoQuery, TodoStatus } from "../../features/todo/types.js";
import {
    ACTIVITY_PAGE_SIZE,
    LEFT_TASK_PAGE_SIZE,
    OVERDUE_FILTER_LABELS,
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
    type TodoOverdueFilter,
} from "../../features/todo/todoPageUtils.js";
import { useTodoCategoriesQuery } from "../../hooks/useTodoCategoriesQuery.js";
import { useTodoActivitiesQuery, useTodosQuery } from "../../hooks/useTodosQuery.js";
import { useTodoMutations } from "../../hooks/useTodoMutations.js";
import AppLayout from "../../layouts/AppLayout.js";

type ActiveTodoFilterMenu = "left" | "detail" | null;

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
    const [priorityFilter, setPriorityFilter] = useState<TodoPriority | "All">("All");
    const [overdueFilter, setOverdueFilter] = useState<TodoOverdueFilter>("All");
    const [taskPage, setTaskPage] = useState(1);
    const [activityPage, setActivityPage] = useState(1);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [activeFilterMenu, setActiveFilterMenu] = useState<ActiveTodoFilterMenu>(null);
    const [selectedTodoId, setSelectedTodoId] = useState<number | null>(null);
    const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isBulkCreateOpen, setIsBulkCreateOpen] = useState(false);
    const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
    const [form, setForm] = useState<TodoFormState>(emptyForm);
    const [bulkDrafts, setBulkDrafts] = useState<TodoBulkDraft[]>(() => [
        createTodoBulkDraft(),
    ]);
    const [bulkCreateError, setBulkCreateError] = useState<string | null>(null);
    const [categoryName, setCategoryName] = useState("");
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<CategoryFilter>("all");
    const [isRailDragging, setIsRailDragging] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
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
        if (keyword) {
            query.search = keyword;
        }

        if (statusFilter !== "All") {
            query.status = statusFilter;
        }

        if (priorityFilter !== "All") {
            query.priority = priorityFilter;
        }

        if (overdueFilter !== "All") {
            query.isOverdue = overdueFilter === "Overdue";
        }

        if (selectedCategoryId !== null) {
            query.categoryId = selectedCategoryId;
        }

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
        return todos.filter((todo) => {
            if (selectedCategoryFilter === "uncategorized" && todo.categoryId !== null) {
                return false;
            }

            return true;
        });
    }, [todos, selectedCategoryFilter]);

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
    const totalTaskPages = Math.max(1, todosQuery.data?.totalPages ?? 1);
    const paginatedTodos = visibleTodos;

    const counts = useMemo(() => countTodos(allTodos), [allTodos]);
    const visibleCounts = useMemo(() => countTodos(visibleTodos), [visibleTodos]);
    const advancedFiltersActive =
        statusFilter !== "All" ||
        priorityFilter !== "All" ||
        overdueFilter !== "All";
    const visibleTodoCount =
        selectedCategoryFilter === "uncategorized"
            ? visibleTodos.length
            : todosQuery.data?.totalItems ?? visibleTodos.length;
    const clearFiltersVisible = Boolean(search || advancedFiltersActive);
    const statusFilterLabel = [
        statusFilter === "All" ? null : STATUS_LABELS[statusFilter],
        priorityFilter === "All" ? null : priorityFilter,
        overdueFilter === "All" ? null : OVERDUE_FILTER_LABELS[overdueFilter],
    ].filter(Boolean).join(" · ") || "All";

    const selectedCategoryName = useMemo(() => {
        if (selectedCategoryFilter === "all") return "All tracks";
        if (selectedCategoryFilter === "uncategorized") return "others";

        const id = getCategoryIdFromFilter(selectedCategoryFilter);
        return categories.find((category) => category.id === id)?.name ?? "Category";
    }, [categories, selectedCategoryFilter]);

    useEffect(() => {
        setTaskPage(1);
    }, [search, statusFilter, priorityFilter, overdueFilter, selectedCategoryFilter]);

    useEffect(() => {
        setTaskPage((current) => Math.min(current, totalTaskPages));
    }, [totalTaskPages]);

    useEffect(() => {
        if (visibleTodos.length === 0) {
            setSelectedTodoId(null);
            setHistoryOpen(false);
            setActiveFilterMenu(null);
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
        setActiveFilterMenu(null);
    }

    function clearTodoFilters() {
        setSearch("");
        clearAdvancedFilters();
    }

    function clearAdvancedFilters() {
        setStatusFilter("All");
        setPriorityFilter("All");
        setOverdueFilter("All");
        setActiveFilterMenu(null);
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
        setFormError(null);
        setBulkCreateError(null);
        setBulkDrafts([createTodoBulkDraft()]);
        setActiveFilterMenu(null);
        setIsEditorOpen(false);
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

    function editTodo(todo: TodoDto) {
        setIsLeftCollapsed(false);
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

        const invalidRowIndex = bulkDrafts.findIndex(
            (draft) => !draft.title.trim()
        );

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
        clearAdvancedFilters();
        setSelectedTodoId(null);
        setHistoryOpen(false);
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
                    todos={allTodos}
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
                    isBulkCreateOpen={isBulkCreateOpen}
                    isLeftCollapsed={isLeftCollapsed}
                    leftPanelRef={leftPanelRef}
                    loading={loading}
                    paginatedTodos={paginatedTodos}
                    search={search}
                    filterActive={advancedFiltersActive}
                    filterOpen={activeFilterMenu === "left"}
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
                        setActiveFilterMenu((current) => current === "left" ? null : "left")
                    }
                    onSetForm={setForm}
                    onSetIsLeftCollapsed={setIsLeftCollapsed}
                    onSetOverdueFilter={setOverdueFilter}
                    onSetPriorityFilter={setPriorityFilter}
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
                        filterActive={advancedFiltersActive}
                        historyOpen={historyOpen}
                        overdueFilter={overdueFilter}
                        paginatedActivities={paginatedActivities}
                        priorityFilter={priorityFilter}
                        selectedTodo={selectedTodo}
                        statusFilter={statusFilter}
                        statusFilterLabel={statusFilterLabel}
                        statusFilterOpen={activeFilterMenu === "detail"}
                        totalActivityPages={totalActivityPages}
                        onClearFilters={clearTodoFilters}
                        onClearAdvancedFilters={clearAdvancedFilters}
                        onSetActivityPage={setActivityPage}
                        onSetHistoryOpen={setHistoryOpen}
                        onSetOverdueFilter={setOverdueFilter}
                        onSetPriorityFilter={setPriorityFilter}
                        onSetStatusFilter={setStatusFilter}
                        onToggleFilter={() =>
                            setActiveFilterMenu((current) => current === "detail" ? null : "detail")
                        }
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
