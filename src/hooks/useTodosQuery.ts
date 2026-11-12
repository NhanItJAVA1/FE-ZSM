import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../constants/queryKeys.js";
import { todoService } from "../services/api/todoService.js";
import { useAppSelector } from "../stores/hook.js";
import type { TodoQuery, TodoView } from "../features/todo/types.js";

export function useTodosQuery(query: TodoQuery | undefined, view: TodoView, enabled: boolean) {
    const sessionUserId = useAppSelector((state) => state.auth.user?.id);
    const requestPage = query?.page ?? 1;
    const requestPageSize = query?.pageSize ?? 10;
    const viewUserId = view.type === "user" ? view.userId : null;

    return useQuery({
        queryKey: sessionUserId
            ? [
                ...QUERY_KEYS.todos(sessionUserId),
                view.type,
                viewUserId,
                requestPage,
                requestPageSize,
                query,
            ]
            : ["todos", "anonymous", view.type, viewUserId, requestPage, requestPageSize, query],
        queryFn: ({ signal }) => view.type === "mine"
            ? todoService.getMine(query, signal)
            : todoService.getForUser(view.userId, query, signal),
        enabled: sessionUserId !== undefined && enabled,
        retry: false,
    });
}
