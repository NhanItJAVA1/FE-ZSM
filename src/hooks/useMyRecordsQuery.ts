import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../constants/queryKeys.js";
import { recordService } from "../services/api/recordService.js";

export function useMyRecordsQuery(userId: number | null | undefined) {
    return useQuery({
        queryKey: userId ? QUERY_KEYS.myRecords(userId) : ["records", "user", "none"],
        queryFn: () => recordService.getByUser(userId!),
        enabled: userId != null,
    });
}
