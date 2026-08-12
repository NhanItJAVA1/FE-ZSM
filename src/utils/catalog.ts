import type { PickerItem } from "../components/ui/ImagePickerModal.js";
import type { MapDto, VehicleDto } from "../features/catalog/types.js";

export function mapsToPickerItems(maps: MapDto[]): PickerItem[] {
    return maps.map((map) => ({
        id: map.id,
        name: map.name,
        imageUrl: map.imageUrl ?? undefined,
        subtitle: `${map.rate} sao`,
    }));
}

export function vehiclesToPickerItems(vehicles: VehicleDto[]): PickerItem[] {
    return vehicles.map((vehicle) => ({
        id: vehicle.id,
        name: vehicle.name,
        imageUrl: vehicle.imageUrl ?? undefined,
        subtitle: vehicle.rank != null ? String(vehicle.rank) : undefined,
    }));
}

export function extractMapRates(maps: MapDto[]): string[] {
    const unique = new Set(
        maps.map((map) => String(map.rate)).filter(Boolean)
    );

    return Array.from(unique).sort((left, right) => Number(left) - Number(right));
}
