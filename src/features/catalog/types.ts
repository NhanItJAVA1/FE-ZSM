export interface MapDto {
    id: number;
    name: string;
    rate: number | string;
    imageUrl: string | null;
}

export interface VehicleDto {
    id: number;
    name: string;
    rank: number | string | null;
    type: number;
    imageUrl: string | null;
}

export interface CreateMapPayload {
    name: string;
    rate: number;
    imageUrl?: string | null;
}

export interface UpdateMapPayload extends CreateMapPayload {}

export interface CreateVehiclePayload {
    name: string;
    type: number;
    rank?: number | null;
    imageUrl?: string | null;
}

export interface UpdateVehiclePayload extends CreateVehiclePayload {}

export interface GameModeDto {
    id: number;
    name: string;
    description: string;
}
