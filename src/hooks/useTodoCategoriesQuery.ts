import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../constants/queryKeys.js";
import { todoCategoryService } from "../services/api/todoCategoryService.js";
import { useAppSelector } from "../stores/hook.js";

export function useTodoCategoriesQuery() {
    const userId = useAppSelector((state) => state.auth.user?.id);

    return useQuery({
        queryKey: userId
            ? QUERY_KEYS.todoCategories(userId)
            : ["todo-categories", "anonymous"],
        queryFn: todoCategoryService.getAll,
        enabled: userId !== undefined,
    });
}
