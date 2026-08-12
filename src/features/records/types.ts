import type { MapDto, VehicleDto, GameModeDto } from "../catalog/types.js";

export interface UserSummary {
    id: number;
    username: string;
    email: string;
}

export interface RecordDto {
    id: number;
    title: string;
    videoUrl: string;
    thumbnailUrl: string | null;
    finishTime: number;
    description: string | null;
    views: number;
    createdAt: string;
    updatedAt: string;
    user: UserSummary | null;
    map: MapDto | null;
    vehicle: VehicleDto | null;
    gameMode: GameModeDto | null;
}

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
