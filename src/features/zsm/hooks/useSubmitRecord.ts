import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ROUTES } from "../../../constants/routes.js";
import { QUERY_KEYS } from "../../../constants/queryKeys.js";
import { recordService } from "../../../services/api/recordService.js";
import { parseFinishTimeInput, secondsToTimeSpan } from "../../../utils/format.js";
import type { CreateRecordPayload } from "../records/types.js";

export interface SubmitRecordInput {
    userId: number;
    mapId: number;
    vehicleId: number;
    gameModeId: number;
    racerName: string;
    finishTimeInput: string;
    title: string;
    description: string;
    videoFile: File;
    mapName?: string | undefined;
    vehicleName?: string | undefined;
}

export function useSubmitRecord() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
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

            setStatus("Đang gửi kỷ lục...");

            const trimmedTitle = input.title.trim();
            const fallbackTitle = input.mapName
                ? `${input.mapName} - ${input.racerName.trim()}`
                : input.racerName.trim();

            const payload: CreateRecordPayload = {
                userId: input.userId,
                mapId: input.mapId,
                vehicleId: input.vehicleId,
                gameModeId: input.gameModeId,
                title: trimmedTitle || fallbackTitle,
                videoUrl: uploadTarget.publicUrl,
                finishTime: secondsToTimeSpan(finishSeconds),
            };

            const trimmedDesc = input.description.trim();
            if (trimmedDesc) {
                payload.description = trimmedDesc;
            }

            await recordService.create(payload);

            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: QUERY_KEYS.myRecords(input.userId),
                }),
                queryClient.invalidateQueries({
                    queryKey: QUERY_KEYS.pendingRecords,
                }),
            ]);

            setStatus(
                "Đã gửi kỷ lục thành công! Bản ghi đang chờ admin kiểm duyệt."
            );

            setTimeout(() => navigate(ROUTES.myRecords), 1800);
        } catch (error) {
            let errorMessage = "Gửi thất bại.";

            if (error instanceof Error) {
                if (
                    error.message === "Failed to fetch" ||
                    error.message === "Network Error" ||
                    error.message.includes("ERR_CONNECTION")
                ) {
                    errorMessage =
                        "Không thể kết nối tới server. Kiểm tra kết nối mạng hoặc backend có đang chạy không.";
                } else if (error.message.includes("CORS") || error.message.includes("blocked")) {
                    errorMessage =
                        "Lỗi CORS: Backend chưa cho phép domain này gọi API. Liên hệ admin để cấu hình CORS.";
                } else {
                    errorMessage = `Gửi thất bại: ${error.message}`;
                }
            }

            setStatus(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    }

    return { submit, status, isSubmitting, setStatus };
}
