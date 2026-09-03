import { useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue.js";
import type { TodoPriority, TodoQuery, TodoStatus } from "../types.js";
import {
    LEFT_TASK_PAGE_SIZE,
    getCategoryIdFromFilter,
    type CategoryFilter,
    type TodoOverdueFilter,
} from "../todoPageUtils.js";

export function useTodoFilters() {
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search, 350);
    const [statusFilter, setStatusFilter] = useState<TodoStatus | "All">("All");
    const [priorityFilter, setPriorityFilter] = useState<TodoPriority | "All">("All");
    const [overdueFilter, setOverdueFilter] = useState<TodoOverdueFilter>("All");
    const [taskPage, setTaskPage] = useState(1);
    const [filterOpen, setFilterOpen] = useState(false);
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<CategoryFilter>("all");
    const selectedCategoryId = getCategoryIdFromFilter(selectedCategoryFilter);

    const todoQuery = useMemo<TodoQuery>(() => {
        const query: TodoQuery = {
            page: taskPage,
            pageSize: LEFT_TASK_PAGE_SIZE,
            sortBy: "createdat",
            isDescending: true,
        };

        const keyword = debouncedSearch.trim();
        if (keyword) query.search = keyword;
        if (statusFilter !== "All") query.status = statusFilter;
        if (priorityFilter !== "All") query.priority = priorityFilter;
        if (overdueFilter !== "All") query.isOverdue = overdueFilter === "Overdue";
        if (selectedCategoryId !== null) query.categoryId = selectedCategoryId;

        return query;
    }, [debouncedSearch, overdueFilter, priorityFilter, selectedCategoryId, statusFilter, taskPage]);

    const advancedFiltersActive =
        statusFilter !== "All" ||
        priorityFilter !== "All" ||
        overdueFilter !== "All";

    useEffect(() => {
        setTaskPage(1);
    }, [debouncedSearch, statusFilter, priorityFilter, overdueFilter, selectedCategoryFilter]);

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

    function toggleFilter() {
        setFilterOpen((current) => !current);
    }

    function closeFilter() {
        setFilterOpen(false);
    }

    function selectCategory(filter: CategoryFilter) {
        setSearch("");
        clearAdvancedFilters();
        setSelectedCategoryFilter(filter);
    }

    return {
        advancedFiltersActive,
        filters: {
            search,
            filterActive: advancedFiltersActive,
            filterOpen,
            overdueFilter,
            priorityFilter,
            statusFilter,
        },
        pagination: {
            taskPage,
        },
        selectedCategoryFilter,
        selectedCategoryId,
        todoQuery,
        actions: {
            clearAdvancedFilters,
            clearTodoFilters,
            closeFilter,
            selectCategory,
            setOverdueFilter,
            setPriorityFilter,
            setStatusFilter,
            setTaskPage,
            setSearch,
            toggleFilter,
        },
    };
}
