import type { MapDto, VehicleDto, GameModeDto } from "../catalog/types.js";

export interface UserSummary {
    id: number;
    username: string;
    email: string;
}

export type RecordStatus = "pending" | "approved" | "rejected";

export interface RecordDto {
    id: number;
    title: string;
    videoUrl: string;
    thumbnailUrl: string | null;
    finishTime: number;
    description: string | null;
    views: number;
    status?: RecordStatus | "Pending" | "Approved" | "Rejected" | number;
    rejectionReason?: string | null;
    rejectReason?: string | null;
    createdAt: string;
    updatedAt: string;
    user: UserSummary | null;
    map: MapDto | null;
    vehicle: VehicleDto | null;
    gameMode: GameModeDto | null;
}

export function normalizeRecordStatus(
    status: RecordDto["status"]
): RecordStatus {
    if (status === undefined || status === null) {
        return "pending";
    }

    if (typeof status === "number") {
        if (status === 0) {
            return "pending";
        }

        if (status === 2) {
            return "rejected";
        }

        return "approved";
    }

    const normalized = String(status).toLowerCase();

    if (normalized === "pending") {
        return "pending";
    }

    if (normalized === "rejected") {
        return "rejected";
    }

    return "approved";
}

export const RECORD_STATUS_LABELS: Record<RecordStatus, string> = {
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Từ chối",
};

export interface CreateRecordPayload {
    userId: number;
    mapId: number;
    vehicleId: number;
    gameModeId: number;
    title: string;
    videoUrl: string;
    thumbnailUrl?: string;
    finishTime: string;
    description?: string;
}

export interface VideoUploadUrlResponse {
    uploadUrl: string;
    objectKey: string;
    publicUrl: string;
    expiresAtUtc: string;
}

export type PendingRecordStatus = "pending" | "approved" | "rejected";

export interface PendingRecord {
    id: string;
    status: PendingRecordStatus;
    submittedAt: string;
    racerName: string;
    mapId: number;
    vehicleId: number;
    gameModeId: number;
    title: string;
    videoUrl: string;
    finishTimeSeconds: number;
    description: string;
    userId: number;
    mapName?: string;
    vehicleName?: string;
}

export interface RecordFilters {
    mapId: number | null;
    vehicleId: number | null;
    rate: string;
    search: string;
    vehicleType: number | null;
    vehicleRank: number | null;
}

export const DEFAULT_RECORD_FILTERS: RecordFilters = {
    mapId: null,
    vehicleId: null,
    rate: "",
    search: "",
    vehicleType: null,
    vehicleRank: null,
};

export type MyRecordStatusFilter = RecordStatus | "all";

export interface MyRecordFilters extends RecordFilters {
    status: MyRecordStatusFilter;
}

export const DEFAULT_MY_RECORD_FILTERS: MyRecordFilters = {
    ...DEFAULT_RECORD_FILTERS,
    status: "all",
};
