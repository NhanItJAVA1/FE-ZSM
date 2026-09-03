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
    rows: TodoDto[];
    totalRows: number;
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
    selectedIds: number[];
}

export interface TodoPanelEditing {
    editedRows: Record<number, TodoFormState>;
    formError: string | null;
    drafts: TodoInlineDraft[];
    saving: boolean;
}

export interface TodoPanelPagination {
    page: number;
    totalPages: number;
}

export interface TodoPanelActions {
    onClearAdvancedFilters: () => void;
    onClearFilters: () => void;
    onDeleteSelected: () => void;
    onAddDraft: () => void;
    onResetForm: () => void;
    onSearchChange: (value: string) => void;
    onRemoveDraft: (id: string) => void;
    onUpdateDraft: (id: string, patch: Partial<TodoFormState>) => void;
    onUpdateRow: (todo: TodoDto, patch: Partial<TodoFormState>) => void;
    onSetOverdueFilter: (filter: TodoOverdueFilter) => void;
    onSetPriorityFilter: (priority: TodoPriority | "All") => void;
    onSetStatusFilter: (status: TodoStatus | "All") => void;
    onSetPage: (updater: (prev: number) => number) => void;
    onClearDeleteSelection: () => void;
    onSelectPage: () => void;
    onToggleFilter: () => void;
    onToggleSelection: (id: number) => void;
    onSave: () => void;
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
