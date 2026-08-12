import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../constants/queryKeys.js";
import { recordService } from "../../../services/api/recordService.js";
import { pendingRecordStorage } from "../../../services/storage/pendingRecords.js";
import { secondsToTimeSpan } from "../../../utils/format.js";
import type { PendingRecord } from "../types.js";

export function useModeration() {
    const queryClient = useQueryClient();
    const [pending, setPending] = useState<PendingRecord[]>(
        pendingRecordStorage.getPending()
    );
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    function refreshList() {
        setPending(pendingRecordStorage.getPending());
    }

    async function approve(record: PendingRecord) {
        setProcessingId(record.id);
        setMessage(null);

        try {
            await recordService.create({
                userId: record.userId,
                mapId: record.mapId,
                vehicleId: record.vehicleId,
                gameModeId: record.gameModeId,
                title: record.title,
                videoUrl: record.videoUrl,
                finishTime: secondsToTimeSpan(record.finishTimeSeconds),
                description: record.description || undefined,
            });

            pendingRecordStorage.approve(record.id);
            pendingRecordStorage.remove(record.id);
            refreshList();
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.records });
            setMessage(`Đã duyệt kỷ lục của ${record.racerName}.`);
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

    function reject(record: PendingRecord) {
        pendingRecordStorage.reject(record.id);
        pendingRecordStorage.remove(record.id);
        refreshList();
        setMessage(`Đã từ chối kỷ lục của ${record.racerName}.`);
    }

    return {
        pending,
        processingId,
        message,
        approve,
        reject,
    };
}
