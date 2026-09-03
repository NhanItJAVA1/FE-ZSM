import type { RefObject } from "react";
import type { TodoCategoryDto, TodoDto, TodoPriority, TodoStatus } from "../types.js";
import type {
    TodoCounts,
    TodoFormState,
    TodoInlineDraft,
    TodoOverdueFilter,
} from "../todoPageUtils.js";

export interface TodoPanelData {
    categories: TodoCategoryDto[];
    counts: TodoCounts;
    loading: boolean;
    paginatedTodos: TodoDto[];
    visibleTodosLength: number;
}

export interface TodoPanelFilters {
    search: string;
    filterActive: boolean;
    filterOpen: boolean;
    overdueFilter: TodoOverdueFilter;
    priorityFilter: TodoPriority | "All";
    statusFilter: TodoStatus | "All";
}

export interface TodoPanelSelection {
    selectedTodoId: number | null;
    bulkDeleteMode: boolean;
    selectedDeleteIds: number[];
}

export interface TodoPanelEditing {
    editedTodoRows: Record<number, TodoFormState>;
    formError: string | null;
    inlineDrafts: TodoInlineDraft[];
    savingTodo: boolean;
}

export interface TodoPanelPagination {
    taskPage: number;
    totalTaskPages: number;
}

export interface TodoPanelActions {
    onClearAdvancedFilters: () => void;
    onClearFilters: () => void;
    onDeleteTodo: (todo: TodoDto) => void;
    onDeleteSelectedTodos: () => void;
    onOpenNewTodoEditor: () => void;
    onResetForm: () => void;
    onSearchChange: (value: string) => void;
    onSelectTodo: (todoId: number) => void;
    onRemoveInlineDraft: (id: string) => void;
    onSetInlineDraft: (id: string, patch: Partial<TodoFormState>) => void;
    onSetTodoRow: (todo: TodoDto, patch: Partial<TodoFormState>) => void;
    onSetOverdueFilter: (filter: TodoOverdueFilter) => void;
    onSetPriorityFilter: (priority: TodoPriority | "All") => void;
    onSetStatusFilter: (status: TodoStatus | "All") => void;
    onSetTaskPage: (updater: (current: number) => number) => void;
    onToggleBulkDeleteMode: () => void;
    onToggleFilter: () => void;
    onToggleDeleteSelection: (todoId: number) => void;
    onSaveTodo: () => void;
}

export interface TodoPanelProps {
    actions: TodoPanelActions;
    data: TodoPanelData;
    editing: TodoPanelEditing;
    filters: TodoPanelFilters;
    leftPanelRef: RefObject<HTMLElement | null>;
    pagination: TodoPanelPagination;
    selection: TodoPanelSelection;
}
