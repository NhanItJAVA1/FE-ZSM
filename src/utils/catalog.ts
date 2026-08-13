import type { PickerItem } from "../components/ui/ImagePickerModal.js";
import { parseVehicleRank } from "../constants/catalog.js";
import type { GameModeDto, MapDto, VehicleDto } from "../features/catalog/types.js";

function compareByName<T extends { name: string }>(left: T, right: T): number {
    return left.name.localeCompare(right.name, "vi");
}

export function sortMapsByRate(maps: MapDto[]): MapDto[] {
    return [...maps].sort((left, right) => {
        const rateDiff = Number(left.rate) - Number(right.rate);

        if (rateDiff !== 0) {
            return rateDiff;
        }

        return compareByName(left, right);
    });
}

export function sortVehiclesByRank(vehicles: VehicleDto[]): VehicleDto[] {
    return [...vehicles].sort((left, right) => {
        const typeDiff = left.type - right.type;

        if (typeDiff !== 0) {
            return typeDiff;
        }

        const rankDiff =
            parseVehicleRank(left.rank) - parseVehicleRank(right.rank);

        if (rankDiff !== 0) {
            return rankDiff;
        }

        return compareByName(left, right);
    });
}

export function mapsToPickerItems(maps: MapDto[]): PickerItem[] {
    return sortMapsByRate(maps).map((map) => ({
        id: map.id,
        name: map.name,
        imageUrl: map.imageUrl ?? undefined,
        subtitle: `${map.rate} sao`,
    }));
}

export function vehiclesToPickerItems(vehicles: VehicleDto[]): PickerItem[] {
    return sortVehiclesByRank(vehicles).map((vehicle) => ({
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

export const DEFAULT_GAME_MODE_NAME = "Speed";
export const DEFAULT_GAME_MODE_ID = 1;

export function getDefaultGameModeId(gameModes: GameModeDto[]): number | null {
    const speedMode = gameModes.find(
        (mode) =>
            mode.name.trim().toLowerCase() ===
            DEFAULT_GAME_MODE_NAME.toLowerCase()
    );

    return speedMode?.id ?? gameModes[0]?.id ?? null;
}

export function resolveSubmitGameModeId(gameModes: GameModeDto[]): number {
    return getDefaultGameModeId(gameModes) ?? DEFAULT_GAME_MODE_ID;
}
