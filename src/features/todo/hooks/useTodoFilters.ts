import { useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue.js";
import type { TodoPriority, TodoQuery, TodoStatus } from "../types.js";
import {
    getCategoryIdFromFilter,
    type CategoryFilter,
    type TodoOverdueFilter,
} from "../todoPageUtils.js";

export function useTodoFilters(pageSize: number) {
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search, 350);
    const [statusFilter, setStatusFilter] = useState<TodoStatus | "All">("All");
    const [priorityFilter, setPriorityFilter] = useState<TodoPriority | "All">("All");
    const [overdueFilter, setOverdueFilter] = useState<TodoOverdueFilter>("All");
    const [page, setPage] = useState(1);
    const [filterOpen, setFilterOpen] = useState(false);
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<CategoryFilter>("all");
    const selectedCategoryId = getCategoryIdFromFilter(selectedCategoryFilter);

    const todoQuery = useMemo<TodoQuery>(() => {
        const query: TodoQuery = {
            page,
            pageSize,
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
    }, [debouncedSearch, overdueFilter, priorityFilter, selectedCategoryId, statusFilter, page, pageSize]);

    const advancedFiltersActive =
        statusFilter !== "All" ||
        priorityFilter !== "All" ||
        overdueFilter !== "All";

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, statusFilter, priorityFilter, overdueFilter, selectedCategoryFilter, pageSize]);

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
        setFilterOpen((prev) => !prev);
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
            page,
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
            setPage,
            setSearch,
            toggleFilter,
        },
    };
}
