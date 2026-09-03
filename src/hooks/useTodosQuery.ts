import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../constants/queryKeys.js";
import { todoService } from "../services/api/todoService.js";
import { useAppSelector } from "../stores/hook.js";
import type { TodoQuery } from "../features/todo/types.js";

export function useTodosQuery(query?: TodoQuery) {
    const userId = useAppSelector((state) => state.auth.user?.id);

    return useQuery({
        queryKey: userId
            ? [...QUERY_KEYS.todos(userId), query]
            : ["todos", "anonymous", query],
        queryFn: ({ signal }) => todoService.getAll(query, signal),
        enabled: userId !== undefined,
        placeholderData: keepPreviousData,
    });
}
