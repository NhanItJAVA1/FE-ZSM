export const MAP_DIFFICULTIES = [
    { value: 1, label: "1 sao" },
    { value: 2, label: "2 sao" },
    { value: 3, label: "3 sao" },
    { value: 4, label: "4 sao" },
    { value: 5, label: "5 sao" },
    { value: 6, label: "6 sao" },
    { value: 7, label: "7 sao" },
] as const;

export const VEHICLE_TYPES = [
    { value: 0, label: "Ô tô" },
    { value: 1, label: "Xe máy" },
    { value: 2, label: "Ván trượt" },
] as const;

export const VEHICLE_RANKS = [
    { value: 0, label: "D" },
    { value: 1, label: "C" },
    { value: 2, label: "B" },
    { value: 3, label: "A" },
    { value: 4, label: "S" },
    { value: 5, label: "T" },
    { value: 6, label: "M1" },
    { value: 7, label: "M2" },
] as const;

export const CAR_RANKS = VEHICLE_RANKS.filter((item) => item.value <= 5);
export const MOTO_RANKS = VEHICLE_RANKS.filter((item) => item.value >= 6);

export const FILTER_VEHICLE_TYPES = VEHICLE_TYPES.filter((item) => item.value <= 1);

export function getRanksForVehicleType(type: number) {
    return type === 1 ? MOTO_RANKS : CAR_RANKS;
}

export function parseVehicleRank(rank: number | string | null): number {
    if (typeof rank === "number") {
        return rank;
    }

    if (rank === null || rank === "") {
        return 0;
    }

    const matched = VEHICLE_RANKS.find(
        (item) => item.label === String(rank).toUpperCase()
    );

    if (matched) {
        return matched.value;
    }

    const numericRank = Number(rank);

    return Number.isNaN(numericRank) ? 0 : numericRank;
}

export function getVehicleTypeLabel(type: number): string {
    return VEHICLE_TYPES.find((item) => item.value === type)?.label ?? "Khác";
}

export function getVehicleRankLabel(rank: number | string | null): string {
    if (rank === null || rank === "") {
        return "—";
    }

    const numericRank = typeof rank === "number" ? rank : Number(rank);

    if (!Number.isNaN(numericRank)) {
        return VEHICLE_RANKS.find((item) => item.value === numericRank)?.label ?? String(rank);
    }

    return String(rank);
}

export function formatMapRate(rate: number | string): string {
    return `${rate} sao`;
}
