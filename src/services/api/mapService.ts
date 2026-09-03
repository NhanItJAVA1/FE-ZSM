import api from "./axios.js";
import type {
    CreateMapPayload,
    MapDto,
    UpdateMapPayload,
} from "../../features/zsm/catalog/types.js";

export const mapService = {
    async getAll(): Promise<MapDto[]> {
        const response = await api.get<MapDto[]>("/Maps");

        return response.data;
    },

    async create(data: CreateMapPayload): Promise<MapDto> {
        const response = await api.post<MapDto>("/Maps", data);

        return response.data;
    },

    async update(id: number, data: UpdateMapPayload): Promise<MapDto> {
        const response = await api.put<MapDto>(`/Maps/${id}`, data);

        return response.data;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`/Maps/${id}`);
    },
};
