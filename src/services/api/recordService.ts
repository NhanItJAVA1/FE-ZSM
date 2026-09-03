import api from "./axios.js";
import type {
    CreateRecordPayload,
    RecordDto,
    VideoUploadUrlResponse,
} from "../../features/zsm/records/types.js";
import { uploadFileToPresignedUrl } from "./uploadService.js";

function normalizeRecordList(data: unknown): RecordDto[] {
    if (Array.isArray(data)) {
        return data;
    }

    if (data && typeof data === "object") {
        const wrapped = data as {
            data?: unknown;
            items?: unknown;
            records?: unknown;
        };

        for (const candidate of [wrapped.data, wrapped.items, wrapped.records]) {
            if (Array.isArray(candidate)) {
                return candidate;
            }
        }
    }

    return [];
}

export const recordService = {
    async getAll(): Promise<RecordDto[]> {
        const response = await api.get<RecordDto[]>("/Records");

        return response.data;
    },

    async getById(id: number): Promise<RecordDto> {
        const response = await api.get<RecordDto>(`/Records/${id}`);

        return response.data;
    },

    async create(data: CreateRecordPayload): Promise<RecordDto> {
        const response = await api.post<RecordDto>("/Records", data);

        return response.data;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`/Records/${id}`);
    },

    async getVideoUploadUrl(
        fileName: string,
        contentType: string
    ): Promise<VideoUploadUrlResponse> {
        const response = await api.post<VideoUploadUrlResponse>(
            "/Records/video-upload-url",
            { fileName, contentType }
        );

        return response.data;
    },

    async uploadVideoToStorage(
        uploadUrl: string,
        file: File
    ): Promise<void> {
        await uploadFileToPresignedUrl(
            uploadUrl,
            file,
            file.type || "video/mp4"
        );
    },

    async getByUser(userId: number): Promise<RecordDto[]> {
        const response = await api.get<RecordDto[]>(
            `/Records/records-by-user/${userId}`
        );

        return response.data;
    },

    async getPendingAdmin(): Promise<RecordDto[]> {
        const response = await api.get<unknown>(
            "/Records/admin/records/pending"
        );

        return normalizeRecordList(response.data);
    },

    async approve(id: number): Promise<void> {
        await api.put(`/Records/admin/records/${id}/approve`);
    },

    async reject(id: number, reason?: string): Promise<void> {
        await api.put(`/Records/admin/records/${id}/reject`, null, {
            params: reason?.trim() ? { reason: reason.trim() } : undefined,
        });
    },
};
