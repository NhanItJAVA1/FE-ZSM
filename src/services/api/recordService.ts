import api from "./axios.js";
import type {
    CreateRecordPayload,
    RecordDto,
    VideoUploadUrlResponse,
} from "../../features/records/types.js";
import { uploadFileToPresignedUrl } from "./uploadService.js";
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
};
