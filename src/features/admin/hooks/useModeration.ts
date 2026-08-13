import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../constants/queryKeys.js";
import { recordService } from "../../../services/api/recordService.js";
import type { RecordDto } from "../../records/types.js";

function toQueryError(error: unknown): Error | null {
    if (!error) {
        return null;
    }

    if (error instanceof Error) {
        return error;
    }

    return new Error(String(error));
}

export function useModeration() {
    const queryClient = useQueryClient();
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const pendingQuery = useQuery({
        queryKey: QUERY_KEYS.pendingRecords,
        queryFn: recordService.getPendingAdmin,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        retry: false,
    });

    async function approve(record: RecordDto) {
        setProcessingId(record.id);
        setMessage(null);

        try {
            await recordService.approve(record.id);
            await queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.pendingRecords,
            });
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.records });

            if (record.user?.id) {
                await queryClient.invalidateQueries({
                    queryKey: QUERY_KEYS.myRecords(record.user.id),
                });
            }

            setMessage(`Đã duyệt kỷ lục "${record.title}".`);
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? `Duyệt thất bại: ${error.message}`
                    : "Duyệt thất bại."
            );
        } finally {
            setProcessingId(null);
        }
    }

    async function reject(record: RecordDto, reason?: string) {
        setProcessingId(record.id);
        setMessage(null);

        try {
            await recordService.reject(record.id, reason);
            await queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.pendingRecords,
            });

            if (record.user?.id) {
                await queryClient.invalidateQueries({
                    queryKey: QUERY_KEYS.myRecords(record.user.id),
                });
            }

            setMessage(`Đã từ chối kỷ lục "${record.title}".`);
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? `Từ chối thất bại: ${error.message}`
                    : "Từ chối thất bại."
            );
        } finally {
            setProcessingId(null);
        }
    }

    return {
        pending: pendingQuery.data ?? [],
        isLoading: pendingQuery.isLoading,
        isFetching: pendingQuery.isFetching,
        error: toQueryError(pendingQuery.error),
        refetch: pendingQuery.refetch,
        processingId,
        message,
        approve,
        reject,
    };
}
