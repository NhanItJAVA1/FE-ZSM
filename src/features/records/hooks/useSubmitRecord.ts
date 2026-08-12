import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../constants/routes.js";
import { recordService } from "../../../services/api/recordService.js";
import { pendingRecordStorage } from "../../../services/storage/pendingRecords.js";
import { parseFinishTimeInput } from "../../../utils/format.js";
import type { PendingRecord } from "../types.js";

interface SubmitRecordInput {
    userId: number;
    mapId: number;
    vehicleId: number;
    gameModeId: number;
    racerName: string;
    finishTimeInput: string;
    title: string;
    description: string;
    videoFile: File;
    mapName?: string;
    vehicleName?: string;
}

export function useSubmitRecord() {
    const navigate = useNavigate();
    const [status, setStatus] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function submit(input: SubmitRecordInput) {
        setStatus(null);
        setIsSubmitting(true);

        try {
            const finishSeconds = parseFinishTimeInput(input.finishTimeInput);

            if (finishSeconds === null || finishSeconds <= 0) {
                throw new Error(
                    "Thời gian hoàn thành không hợp lệ (vd: 1:27.421 hoặc 87.421)."
                );
            }

            setStatus("Đang upload video...");
            const uploadTarget = await recordService.getVideoUploadUrl(
                input.videoFile.name,
                input.videoFile.type || "video/mp4"
            );

            await recordService.uploadVideoToStorage(
                uploadTarget.uploadUrl,
                input.videoFile
            );

            const pending: PendingRecord = {
                id: crypto.randomUUID(),
                status: "pending",
                submittedAt: new Date().toISOString(),
                racerName: input.racerName.trim(),
                mapId: input.mapId,
                vehicleId: input.vehicleId,
                gameModeId: input.gameModeId,
                title:
                    input.title.trim() ||
                    `${input.mapName} - ${input.racerName.trim()}`,
                videoUrl: uploadTarget.publicUrl,
                finishTimeSeconds: finishSeconds,
                description: input.description.trim(),
                userId: input.userId,
                mapName: input.mapName,
                vehicleName: input.vehicleName,
            };

            pendingRecordStorage.add(pending);

            setStatus(
                "Đã gửi kỷ lục thành công! Bản ghi đang chờ admin kiểm duyệt."
            );

            setTimeout(() => navigate(ROUTES.home), 1800);
        } catch (error) {
            setStatus(
                error instanceof Error
                    ? `Gửi thất bại: ${error.message}`
                    : "Gửi thất bại."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return { submit, status, isSubmitting, setStatus };
}
