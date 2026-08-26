import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import AppLayout from "../../layouts/AppLayout.js";
import { useTodoCategoriesQuery } from "../../hooks/useTodoCategoriesQuery.js";
import { useTodoActivitiesQuery, useTodosQuery } from "../../hooks/useTodosQuery.js";
import { useTodoMutations } from "../../hooks/useTodoMutations.js";
import type {
    CreateTodoPayload,
    TodoCategoryDto,
    TodoDto,
    TodoPriority,
    TodoStatus,
} from "../../features/todo/types.js";

const STATUS_LABELS: Record<TodoStatus, string> = {
    Todo: "Todo",
    InProgress: "In progress",
    Done: "Done",
};

const PRIORITIES: TodoPriority[] = ["Low", "Medium", "High"];
const STATUSES: TodoStatus[] = ["Todo", "InProgress", "Done"];
const LEFT_TASK_PAGE_SIZE = 10;
const ACTIVITY_PAGE_SIZE = 5;
const DAY_MS = 86_400_000;
type CategoryFilter = "all" | "uncategorized" | `category-${number}`;

interface TodoFormState {
    title: string;
    description: string;
    priority: TodoPriority;
    dueDate: string;
    categoryId: string;
}

type TodoDialogState =
    | { type: "deleteTodo"; todo: TodoDto }
    | { type: "deleteCategory"; category: TodoCategoryDto }
    | { type: "renameCategory"; category: TodoCategoryDto }
    | null;

const emptyForm: TodoFormState = {
    title: "",
    description: "",
    priority: "Medium",
    dueDate: "",
    categoryId: "",
};

function parseBackendDate(value: string) {
    const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
    return new Date(hasTimezone ? value : `${value}Z`);
}

function toInputDateTime(value: string | null) {
    if (!value) return "";
    const date = parseBackendDate(value);
    if (Number.isNaN(date.getTime())) return "";

    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60_000);
    return local.toISOString().slice(0, 16);
}

function fromInputDateTime(value: string) {
    return value ? new Date(value).toISOString() : null;
}

function formatShortDate(value: string | null) {
    if (!value) return "No due date";

    return formatTimelineTick(parseBackendDate(value));
}

function formatTimelineTick(date: Date) {
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "short",
    }).format(date);
}

function formatFullDate(value: string | null) {
    if (!value) return "Chưa có hạn";

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(parseBackendDate(value));
}

function getPriorityTone(priority: TodoPriority) {
    if (priority === "High") return "todo-priority todo-priority--high";
    if (priority === "Low") return "todo-priority todo-priority--low";
    return "todo-priority";
}

function getNextStatusAction(status: TodoStatus): {
    label: string;
    nextStatus: TodoStatus;
} {
    if (status === "Todo") {
        return { label: "Start", nextStatus: "InProgress" };
    }

    if (status === "InProgress") {
        return { label: "Done", nextStatus: "Done" };
    }

    return { label: "Reopen", nextStatus: "InProgress" };
}

function toPayload(form: TodoFormState): CreateTodoPayload {
    return {
        title: form.title,
        description: form.description,
        priority: form.priority,
        dueDate: fromInputDateTime(form.dueDate),
        categoryId: form.categoryId ? Number(form.categoryId) : null,
    };
}

function buildTimelineDates(todos: TodoDto[]) {
    const dates = todos.flatMap((todo) => [
        parseBackendDate(todo.createdAt).getTime(),
        todo.dueDate ? parseBackendDate(todo.dueDate).getTime() : NaN,
    ]).filter((value) => !Number.isNaN(value));

    const now = Date.now();
    const min = dates.length ? Math.min(...dates) : now;
    const max = dates.length ? Math.max(...dates) : now + 3 * DAY_MS;
    const start = new Date(min);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 1);

    const end = new Date(max);
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 2);

    if (end.getTime() - start.getTime() < 3 * DAY_MS) {
        end.setTime(start.getTime() + 3 * DAY_MS);
    }

    const ticks: Date[] = [];
    const cursor = new Date(start);
    while (cursor < end) {
        ticks.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    return { start, end, ticks };
}

function getTimelineStyle(todo: TodoDto, start: Date, end: Date) {
    const startMs = start.getTime();
    const range = Math.max(end.getTime() - startMs, 1);
    const taskStart = parseBackendDate(todo.createdAt).getTime();
    const taskEnd = todo.dueDate
        ? parseBackendDate(todo.dueDate).getTime()
        : taskStart + 12 * 60 * 60 * 1000;
    const left = Math.max(0, ((taskStart - startMs) / range) * 100);
    const right = Math.min(100, ((Math.max(taskEnd, taskStart + 3_600_000) - startMs) / range) * 100);
    const width = Math.max(8, right - left);

    return {
        left: `${left}%`,
        width: `${Math.min(width, 100 - left)}%`,
    };
}

function getCategoryFilterId(categoryId: number): CategoryFilter {
    return `category-${categoryId}`;
}

function getCategoryIdFromFilter(filter: CategoryFilter) {
    if (!filter.startsWith("category-")) return null;
    return Number(filter.replace("category-", ""));
}

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
    const [selectedCategoryFilter, setSelectedCategoryFilter] =
        useState<CategoryFilter>("all");
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

    const counts = useMemo(() => ({
        all: todos.length,
        todo: todos.filter((todo) => todo.status === "Todo").length,
        progress: todos.filter((todo) => todo.status === "InProgress").length,
        done: todos.filter((todo) => todo.status === "Done").length,
        overdue: todos.filter((todo) => todo.isOverdue).length,
    }), [todos]);

    const visibleCounts = useMemo(() => ({
        all: visibleTodos.length,
        todo: visibleTodos.filter((todo) => todo.status === "Todo").length,
        progress: visibleTodos.filter((todo) => todo.status === "InProgress").length,
        done: visibleTodos.filter((todo) => todo.status === "Done").length,
        overdue: visibleTodos.filter((todo) => todo.isOverdue).length,
    }), [visibleTodos]);

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

    function handleRailPointerEnd(event: React.PointerEvent<HTMLDivElement>) {
        if (!dragStateRef.current.active) return;

        dragStateRef.current.active = false;
        setIsRailDragging(false);

        if (dragStateRef.current.didDrag) {
            window.setTimeout(() => {
                dragStateRef.current.didDrag = false;
            }, 0);
        }
    }

    const loading = todosQuery.isLoading || categoriesQuery.isLoading;

    return (
        <AppLayout>
            <main className={`todo-workspace ${isLeftCollapsed ? "todo-workspace--left-collapsed" : ""}`}>
                <section className="todo-category-rail" aria-label="Category rail">
                    <div className="todo-rail-heading">
                        <div className="todo-rail-breadcrumb">
                            <strong>Category rail</strong>
                            <span>&gt;</span>
                            <b>{selectedCategoryName}</b>
                        </div>
                        <form className="todo-rail-form" onSubmit={submitCategory}>
                            <input
                                value={categoryName}
                                placeholder="Tạo category mới"
                                aria-label="Tạo category mới"
                                onChange={(event) => setCategoryName(event.target.value)}
                            />
                        </form>
                    </div>

                    <div className="todo-train-viewport">
                        <button
                            type="button"
                            className="todo-rail-arrow todo-rail-arrow--left"
                            onClick={() => scrollRail("left")}
                            aria-label="Lùi category rail"
                        >
                            ‹
                        </button>

                        <div
                            ref={railRef}
                            className={`todo-train-track ${isRailDragging ? "is-dragging" : ""}`}
                            onPointerDown={handleRailPointerDown}
                            onPointerMove={handleRailPointerMove}
                            onPointerUp={handleRailPointerEnd}
                            onPointerCancel={handleRailPointerEnd}
                            role="listbox"
                            aria-label="Chọn category"
                        >
                            <button
                                type="button"
                                className={`todo-train-car todo-train-car--engine ${selectedCategoryFilter === "all" ? "active" : ""}`}
                                onClick={() => selectCategory("all")}
                            >
                                <span>All tracks</span>
                                <small>{todos.length} tasks</small>
                            </button>

                            {categories.map((category) => {
                                const filterId = getCategoryFilterId(category.id);
                                const taskCount = todos.filter(
                                    (todo) => todo.categoryId === category.id
                                ).length;

                                return (
                                    <article
                                        key={category.id}
                                        className={`todo-train-car ${selectedCategoryFilter === filterId ? "active" : ""}`}
                                    >
                                        <button
                                            type="button"
                                            className="todo-train-car-main"
                                            onClick={() => selectCategory(filterId)}
                                        >
                                            <span>{category.name}</span>
                                            <small>{taskCount} tasks</small>
                                        </button>
                                        <div className="todo-train-car-actions">
                                            <button type="button" onClick={() => renameCategory(category)}>
                                                Rename
                                            </button>
                                            <button type="button" onClick={() => deleteCategory(category)}>
                                                Delete
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}

                            <button
                                type="button"
                                className={`todo-train-car todo-train-car--tail ${selectedCategoryFilter === "uncategorized" ? "active" : ""}`}
                                onClick={() => selectCategory("uncategorized")}
                            >
                                <span>Others</span>
                                <strong>others</strong>
                                <small>{todos.filter((todo) => todo.categoryId === null).length} tasks</small>
                            </button>
                        </div>

                        <button
                            type="button"
                            className="todo-rail-arrow todo-rail-arrow--right"
                            onClick={() => scrollRail("right")}
                            aria-label="Tiến category rail"
                        >
                            ›
                        </button>
                    </div>
                </section>

                <section
                    className={`todo-left-panel ${isLeftCollapsed ? "todo-left-panel--collapsed" : ""}`}
                    ref={leftPanelRef}
                >
                    <div className="todo-panel-heading">
                        <div>
                            <p className="eyebrow">Todo</p>
                            <strong className="todo-left-collapsed-label">{visibleTodos.length}</strong>
                        </div>
                        <div className="todo-panel-actions">
                            <button
                                type="button"
                                className="todo-collapse-trigger"
                                onClick={() => {
                                    if (!isLeftCollapsed && isEditorOpen) {
                                        resetForm();
                                    }
                                    setIsLeftCollapsed((current) => !current);
                                }}
                                title={isLeftCollapsed ? "Mở rộng danh sách task" : "Thu gọn danh sách task"}
                                aria-label={isLeftCollapsed ? "Mở rộng danh sách task" : "Thu gọn danh sách task"}
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.9"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    {isLeftCollapsed ? (
                                        <>
                                            <path d="m9 6 6 6-6 6" />
                                            <path d="M4 4v16" />
                                        </>
                                    ) : (
                                        <>
                                            <path d="m15 6-6 6 6 6" />
                                            <path d="M20 4v16" />
                                        </>
                                    )}
                                </svg>
                            </button>
                            <button
                                type="button"
                                className={`todo-door-trigger ${isEditorOpen ? "active" : ""}`}
                                onClick={() => {
                                    if (isEditorOpen) {
                                        resetForm();
                                        return;
                                    }

                                    openNewTodoEditor();
                                }}
                                title={isEditorOpen ? "Đóng form" : "Tạo task mới"}
                            >
                                <span>{isEditorOpen ? "×" : "+"}</span>
                                <span className="sr-only">
                                    {isEditorOpen ? "Đóng form" : "Tạo task mới"}
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="todo-stat-row">
                        <span><b>{counts.all}</b> Total</span>
                        <span><b>{counts.progress}</b> Running</span>
                        <span><b>{counts.overdue}</b> Overdue</span>
                    </div>

                    <div className="todo-left-stage">
                        <div className="todo-list-layer">
                            <div className="todo-filter-row">
                                <input
                                    value={search}
                                    placeholder="Search task/category"
                                    onChange={(event) => setSearch(event.target.value)}
                                />
                                <select
                                    value={statusFilter}
                                    onChange={(event) =>
                                        setStatusFilter(event.target.value as TodoStatus | "All")
                                    }
                                >
                                    <option value="All">All status</option>
                                    {STATUSES.map((status) => (
                                        <option key={status} value={status}>
                                            {STATUS_LABELS[status]}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="todo-category-list">
                                {loading && <div className="empty-state">Đang tải todo...</div>}

                                {!loading && visibleTodos.length === 0 && (
                                    <div className="empty-state empty-state--composed">
                                        <p className="empty-state-desc">Hãy tạo task đầu tiên!</p>
                                        {(search || statusFilter !== "All") && (
                                            <button
                                                type="button"
                                                className="ghost-btn"
                                                onClick={clearTodoFilters}
                                            >
                                                Bỏ filter
                                            </button>
                                        )}
                                    </div>
                                )}

                                {!loading && visibleTodos.length > 0 && (
                                    <div className="todo-task-list">
                                        {paginatedTodos.map((todo) => {
                                            const nextStatusAction = getNextStatusAction(todo.status);

                                            return (
                                                <article
                                                    key={todo.id}
                                                    className={`todo-card ${selectedTodo?.id === todo.id ? "active" : ""}`}
                                                    onClick={() => selectTodo(todo.id)}
                                                >
                                                    <div className="todo-card-body">
                                                        <div className="todo-card-topline">
                                                            <span className={getPriorityTone(todo.priority)}>
                                                                {todo.priority}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                className="todo-card-trash-btn"
                                                                title="Xóa task"
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    void deleteTodo(todo);
                                                                }}
                                                            >
                                                                <svg
                                                                    width="15"
                                                                    height="15"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="1.8"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    aria-hidden="true"
                                                                >
                                                                    <path d="M4 7h16" />
                                                                    <path d="M10 11v6" />
                                                                    <path d="M14 11v6" />
                                                                    <path d="M6 7l1 14h10l1-14" />
                                                                    <path d="M9 7V4h6v3" />
                                                                </svg>
                                                                <span className="sr-only">Xóa task</span>
                                                            </button>
                                                        </div>
                                                        <h3>{todo.title}</h3>
                                                        <p>{todo.description || "Không có mô tả"}</p>
                                                        <div className="todo-card-meta">
                                                            <span className={`todo-status-dot todo-status-dot--${todo.status}`} />
                                                            <span>{STATUS_LABELS[todo.status]}</span>
                                                            <span>{todo.categoryName || "others"}</span>
                                                            <span>{formatShortDate(todo.dueDate)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="todo-card-actions">
                                                        <button
                                                            type="button"
                                                            className="todo-card-side-btn"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                editTodo(todo);
                                                            }}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="todo-card-side-btn todo-card-side-btn--status"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                mutations.updateStatus.mutate({
                                                                    id: todo.id,
                                                                    status: nextStatusAction.nextStatus,
                                                                });
                                                            }}
                                                        >
                                                            {nextStatusAction.label}
                                                        </button>
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>
                                )}

                                {!loading && visibleTodos.length > LEFT_TASK_PAGE_SIZE && (
                                    <div className="todo-list-pagination">
                                        <button
                                            type="button"
                                            className="ghost-btn"
                                            disabled={taskPage === 1}
                                            onClick={() =>
                                                setTaskPage((current) =>
                                                    Math.max(1, current - 1)
                                                )
                                            }
                                        >
                                            Prev
                                        </button>
                                        <span>
                                            {taskPage} / {totalTaskPages}
                                        </span>
                                        <button
                                            type="button"
                                            className="ghost-btn"
                                            disabled={taskPage === totalTaskPages}
                                            onClick={() =>
                                                setTaskPage((current) =>
                                                    Math.min(totalTaskPages, current + 1)
                                                )
                                            }
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <form
                            ref={editorDoorRef}
                            className={`todo-editor-door ${isEditorOpen ? "open" : ""}`}
                            onSubmit={submitTodo}
                            aria-hidden={!isEditorOpen}
                        >
                            <div className="todo-editor-door-handle">
                                <span />
                            </div>
                            <div className="todo-editor-door-header">
                                <div>
                                    <p className="eyebrow">{editingTodoId ? "Edit task" : "New task"}</p>
                                </div>
                                <button type="button" className="ghost-btn" onClick={resetForm}>
                                    Close
                                </button>
                            </div>

                            <label>
                                Title
                                <input
                                    value={form.title}
                                    placeholder="VD: Chuẩn bị tài liệu sprint"
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            title: event.target.value,
                                        }))
                                    }
                                />
                            </label>

                            <label>
                                Description
                                <textarea
                                    value={form.description}
                                    rows={3}
                                    placeholder="Ghi chú ngắn về task"
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            description: event.target.value,
                                        }))
                                    }
                                />
                            </label>

                            <div className="todo-form-grid">
                                <label>
                                    Priority
                                    <select
                                        value={form.priority}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                priority: event.target.value as TodoPriority,
                                            }))
                                        }
                                    >
                                        {PRIORITIES.map((priority) => (
                                            <option key={priority} value={priority}>
                                                {priority}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Due date
                                    <input
                                        type="datetime-local"
                                        value={form.dueDate}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                dueDate: event.target.value,
                                            }))
                                        }
                                    />
                                </label>
                            </div>

                            <label>
                                Category
                                <select
                                    value={form.categoryId}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            categoryId: event.target.value,
                                        }))
                                    }
                                >
                                    <option value="">others</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {formError && <p className="form-error">{formError}</p>}

                            <div className="todo-editor-actions">
                                <button type="button" className="ghost-btn" onClick={resetForm}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={mutations.createTodo.isPending || mutations.updateTodo.isPending}>
                                    {editingTodoId ? "Save task" : "Create task"}
                                </button>
                            </div>
                        </form>
                    </div>
                </section>

                <section className="todo-timeline-panel">
                    <div className="todo-timeline-header">
                        <div>
                            <p className="eyebrow">Schedule</p>
                            {/* <h2>Schedule map</h2> */}
                        </div>
                        <div className="todo-timeline-legend">
                            <span><i className="todo-status-dot todo-status-dot--Todo" />Todo</span>
                            <span><i className="todo-status-dot todo-status-dot--InProgress" />In progress</span>
                            <span><i className="todo-status-dot todo-status-dot--Done" />Done</span>
                        </div>
                    </div>

                    <div className="todo-board-summary">
                        <span><b>{visibleCounts.todo}</b> Todo</span>
                        <span><b>{visibleCounts.progress}</b> In progress</span>
                        <span><b>{visibleCounts.done}</b> Done</span>
                    </div>

                    <div className="todo-timeline" style={timelineGridStyle}>
                        <div className="todo-timeline-axis">
                            <span>Task</span>
                            {timeline.ticks.map((tick) => (
                                <span key={tick.toISOString()}>{formatTimelineTick(tick)}</span>
                            ))}
                        </div>

                        <div className="todo-timeline-rows">
                            {visibleTodos.map((todo) => (
                                <button
                                    type="button"
                                    key={todo.id}
                                    className={`todo-timeline-row ${selectedTodo?.id === todo.id ? "active" : ""}`}
                                    onClick={() => selectTodo(todo.id)}
                                >
                                    <span className="todo-timeline-title">
                                        <b>{todo.title}</b>
                                        <small>{todo.categoryName || "others"}</small>
                                    </span>
                                    <span className="todo-timeline-track">
                                        {timeline.ticks.map((tick) => (
                                            <i key={tick.toISOString()} />
                                        ))}
                                        <span
                                            className={`todo-timeline-bar todo-timeline-bar--${todo.status}`}
                                            style={getTimelineStyle(todo, timeline.start, timeline.end)}
                                        >
                                            {STATUS_LABELS[todo.status]}
                                        </span>
                                    </span>
                                </button>
                            ))}
                            {!loading && visibleTodos.length === 0 && (
                                <div className="todo-timeline-empty">
                                    <p>no data</p>
                                    {(search || statusFilter !== "All") && (
                                        <button
                                            type="button"
                                            className="ghost-btn"
                                            onClick={clearTodoFilters}
                                        >
                                            Bỏ filter
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedTodo ? (
                        <aside className="todo-detail-panel">
                            <div className="todo-detail-overview">
                                <div className="todo-detail-summary">
                                    <span className={getPriorityTone(selectedTodo.priority)}>
                                        {selectedTodo.priority}
                                    </span>
                                    <h3>{selectedTodo.title}</h3>
                                    <p>{selectedTodo.description || "Task này chưa có mô tả."}</p>
                                </div>

                                <dl className="todo-detail-grid">
                                    <div>
                                        <dt>Start</dt>
                                        <dd>{formatFullDate(selectedTodo.createdAt)}</dd>
                                    </div>
                                    <div>
                                        <dt>Due</dt>
                                        <dd>{formatFullDate(selectedTodo.dueDate)}</dd>
                                    </div>
                                    <div>
                                        <dt>Category</dt>
                                        <dd>{selectedTodo.categoryName || "others"}</dd>
                                    </div>
                                    <div>
                                        <dt>Status</dt>
                                        <dd>{STATUS_LABELS[selectedTodo.status]}</dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="todo-status-actions">
                                <div className="todo-filter-menu">
                                    <button
                                        type="button"
                                        className={`todo-filter-trigger ${statusFilterOpen ? "active" : ""}`}
                                        onClick={() => setStatusFilterOpen((current) => !current)}
                                        aria-expanded={statusFilterOpen}
                                        aria-label="Chọn filter trạng thái"
                                    >
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            aria-hidden="true"
                                        >
                                            <path d="M4 5h16l-6.4 7.3v4.9l-3.2 1.8v-6.7L4 5Z" />
                                        </svg>
                                    </button>
                                    {statusFilterOpen && (
                                        <div className="todo-filter-drawer">
                                            <button
                                                type="button"
                                                className={`todo-filter-option ${statusFilter === "All" ? "active" : ""}`}
                                                onClick={() => {
                                                    setStatusFilter("All");
                                                    setStatusFilterOpen(false);
                                                }}
                                            >
                                                <span>All</span>
                                                <small>{counts.all}</small>
                                            </button>
                                            {STATUSES.map((status) => (
                                                <button
                                                    key={status}
                                                    type="button"
                                                    className={`todo-filter-option ${statusFilter === status ? "active" : ""}`}
                                                    onClick={() => {
                                                        setStatusFilter(status);
                                                        setStatusFilterOpen(false);
                                                    }}
                                                >
                                                    <span>
                                                        <i className={`todo-status-dot todo-status-dot--${status}`} />
                                                        {STATUS_LABELS[status]}
                                                    </span>
                                                    <small>
                                                        {status === "Todo" && counts.todo}
                                                        {status === "InProgress" && counts.progress}
                                                        {status === "Done" && counts.done}
                                                    </small>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <span className="todo-status-filter-tab">
                                    Filter: {statusFilterLabel}
                                </span>
                                <button
                                    type="button"
                                    className={`todo-history-eye-btn ${historyOpen ? "active" : ""}`}
                                    onClick={() => setHistoryOpen((current) => !current)}
                                    title={historyOpen ? "Ẩn lịch sử" : "Xem lịch sử"}
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
                                        <circle cx="12" cy="12" r="2.5" />
                                    </svg>
                                    <span className="sr-only">
                                        {historyOpen ? "Ẩn lịch sử" : "Xem lịch sử"}
                                    </span>
                                </button>
                            </div>

                            {historyOpen && (
                                <div className="todo-activity-log">
                                    <div className="todo-activity-heading">
                                        <h4>Activity</h4>
                                        <button
                                            type="button"
                                            className="ghost-btn"
                                            onClick={() => setHistoryOpen(false)}
                                        >
                                            Ẩn
                                        </button>
                                    </div>
                                    {activitiesQuery.isLoading && <p>Đang tải activity...</p>}
                                    {paginatedActivities.map((activity) => (
                                        <div key={activity.id}>
                                            <span>{activity.type}</span>
                                            <p>{activity.description}</p>
                                            <small>{formatFullDate(activity.createdAt)}</small>
                                        </div>
                                    ))}
                                    {!activitiesQuery.isLoading && activities.length === 0 && (
                                        <p>Chưa có activity.</p>
                                    )}
                                    {!activitiesQuery.isLoading && activities.length > ACTIVITY_PAGE_SIZE && (
                                        <div className="todo-activity-pagination">
                                            <button
                                                type="button"
                                                className="ghost-btn"
                                                disabled={activityPage === 1}
                                                onClick={() =>
                                                    setActivityPage((current) =>
                                                        Math.max(1, current - 1)
                                                    )
                                                }
                                            >
                                                Prev
                                            </button>
                                            <span>
                                                {activityPage} / {totalActivityPages}
                                            </span>
                                            <button
                                                type="button"
                                                className="ghost-btn"
                                                disabled={activityPage === totalActivityPages}
                                                onClick={() =>
                                                    setActivityPage((current) =>
                                                        Math.min(totalActivityPages, current + 1)
                                                    )
                                                }
                                            >
                                                Next
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </aside>
                    ) : (
                        <aside className="todo-detail-panel todo-detail-panel--empty">
                            <div>
                                <p className="eyebrow">No task selected</p>
                                <p>
                                    no data
                                </p>
                            </div>
                            {(search || statusFilter !== "All") && (
                                <button
                                    type="button"
                                    className="ghost-btn"
                                    onClick={clearTodoFilters}
                                >
                                    Bỏ filter
                                </button>
                            )}
                        </aside>
                    )}
                </section>
            </main>

            {todoDialog && (
                <div
                    className="modal-backdrop todo-dialog-backdrop"
                    role="presentation"
                    onClick={() => setTodoDialog(null)}
                >
                    <section
                        className="modal-panel todo-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="todo-dialog-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        {todoDialog.type === "deleteTodo" && (
                            <>
                                <div className="todo-dialog-mark todo-dialog-mark--danger">
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M4 7h16" />
                                        <path d="M10 11v6" />
                                        <path d="M14 11v6" />
                                        <path d="M6 7l1 14h10l1-14" />
                                        <path d="M9 7V4h6v3" />
                                    </svg>
                                </div>
                                <div className="todo-dialog-copy">
                                    {/* <p className="eyebrow">Delete task</p> */}
                                    <p>
                                        Task "{todoDialog.todo.title}" sẽ bị xóa khỏi danh sách và timeline.
                                    </p>
                                </div>
                                <div className="todo-dialog-actions">
                                    <button
                                        type="button"
                                        className="ghost-btn"
                                        onClick={() => setTodoDialog(null)}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="button"
                                        className="todo-danger-btn"
                                        disabled={mutations.deleteTodo.isPending}
                                        onClick={() => void confirmDeleteTodo(todoDialog.todo)}
                                    >
                                        Xóa task
                                    </button>
                                </div>
                            </>
                        )}

                        {todoDialog.type === "deleteCategory" && (
                            <>
                                <div className="todo-dialog-mark todo-dialog-mark--danger">
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M4 7h16" />
                                        <path d="M10 11v6" />
                                        <path d="M14 11v6" />
                                        <path d="M6 7l1 14h10l1-14" />
                                        <path d="M9 7V4h6v3" />
                                    </svg>
                                </div>
                                <div className="todo-dialog-copy">
                                    <p className="eyebrow">Delete category</p>
                                    {/* <h2 id="todo-dialog-title">Xóa category "{todoDialog.category.name}"?</h2> */}
                                    <p>
                                        Bạn có thể giữ lại các task và bỏ category, hoặc xóa luôn các task trong category này.
                                    </p>
                                </div>
                                <div className="todo-dialog-actions todo-dialog-actions--stacked">
                                    <button
                                        type="button"
                                        className="ghost-btn"
                                        onClick={() => setTodoDialog(null)}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="button"
                                        className="ghost-btn"
                                        disabled={mutations.deleteCategory.isPending}
                                        onClick={() =>
                                            void confirmDeleteCategory(todoDialog.category, false)
                                        }
                                    >
                                        Giữ task
                                    </button>
                                    <button
                                        type="button"
                                        className="todo-danger-btn"
                                        disabled={mutations.deleteCategory.isPending}
                                        onClick={() =>
                                            void confirmDeleteCategory(todoDialog.category, true)
                                        }
                                    >
                                        Xóa cả task
                                    </button>
                                </div>
                            </>
                        )}

                        {todoDialog.type === "renameCategory" && (
                            <form className="todo-dialog-form" onSubmit={confirmRenameCategory}>
                                <div className="todo-dialog-mark">
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M12 20h9" />
                                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                    </svg>
                                </div>
                                <div className="todo-dialog-copy">
                                    <p className="eyebrow">Rename category</p>
                                    <h2 id="todo-dialog-title">Đổi tên category</h2>
                                    <label>
                                        Tên mới
                                        <input
                                            value={renameCategoryName}
                                            autoFocus
                                            onChange={(event) =>
                                                setRenameCategoryName(event.target.value)
                                            }
                                        />
                                    </label>
                                </div>
                                <div className="todo-dialog-actions">
                                    <button
                                        type="button"
                                        className="ghost-btn"
                                        onClick={() => setTodoDialog(null)}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={
                                            mutations.updateCategory.isPending ||
                                            !renameCategoryName.trim() ||
                                            renameCategoryName.trim() === todoDialog.category.name
                                        }
                                    >
                                        Lưu tên
                                    </button>
                                </div>
                            </form>
                        )}
                    </section>
                </div>
            )}
        </AppLayout>
    );
}
