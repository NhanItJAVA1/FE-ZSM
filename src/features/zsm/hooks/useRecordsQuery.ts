import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../constants/queryKeys.js";
import { recordService } from "../../../services/api/recordService.js";

export function useRecordsQuery() {
    return useQuery({
        queryKey: QUERY_KEYS.records,
        queryFn: recordService.getAll,
    });
}
