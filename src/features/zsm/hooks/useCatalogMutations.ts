import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../constants/queryKeys.js";
import type {
    CreateMapPayload,
    CreateVehiclePayload,
    UpdateMapPayload,
    UpdateVehiclePayload,
} from "../catalog/types.js";
import { mapService } from "../../../services/api/mapService.js";
import { vehicleService } from "../../../services/api/vehicleService.js";

export function useCreateMapMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateMapPayload) => mapService.create(payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.maps });
        },
    });
}

export function useUpdateMapMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: number;
            payload: UpdateMapPayload;
        }) => mapService.update(id, payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.maps });
        },
    });
}

export function useDeleteMapMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => mapService.delete(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.maps });
        },
    });
}

export function useCreateVehicleMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateVehiclePayload) =>
            vehicleService.create(payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vehicles });
        },
    });
}

export function useUpdateVehicleMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: number;
            payload: UpdateVehiclePayload;
        }) => vehicleService.update(id, payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vehicles });
        },
    });
}

export function useDeleteVehicleMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => vehicleService.delete(id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vehicles });
        },
    });
}
