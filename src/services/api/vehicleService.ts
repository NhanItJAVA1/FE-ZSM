import api from "./axios.js";
import type {
    CreateVehiclePayload,
    UpdateVehiclePayload,
    VehicleDto,
} from "../../features/catalog/types.js";

export const vehicleService = {
    async getAll(): Promise<VehicleDto[]> {
        const response = await api.get<VehicleDto[]>("/Vehicles");

        return response.data;
    },

    async create(data: CreateVehiclePayload): Promise<VehicleDto> {
        const response = await api.post<VehicleDto>("/Vehicles", data);

        return response.data;
    },

    async update(id: number, data: UpdateVehiclePayload): Promise<VehicleDto> {
        const response = await api.put<VehicleDto>(`/Vehicles/${id}`, data);

        return response.data;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`/Vehicles/${id}`);
    },
};
