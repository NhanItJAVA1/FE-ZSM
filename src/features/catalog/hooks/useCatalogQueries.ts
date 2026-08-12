import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../constants/queryKeys.js";
import { gameModeService } from "../../../services/api/gameModeService.js";
import { mapService } from "../../../services/api/mapService.js";
import { vehicleService } from "../../../services/api/vehicleService.js";

export function useMapsQuery() {
    return useQuery({
        queryKey: QUERY_KEYS.maps,
        queryFn: mapService.getAll,
    });
}

export function useVehiclesQuery() {
    return useQuery({
        queryKey: QUERY_KEYS.vehicles,
        queryFn: vehicleService.getAll,
    });
}

export function useGameModesQuery() {
    return useQuery({
        queryKey: QUERY_KEYS.gameModes,
        queryFn: gameModeService.getAll,
    });
}
