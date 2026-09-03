import api from "./axios.js";
import type { GameModeDto } from "../../features/zsm/catalog/types.js";

export const gameModeService = {
    async getAll(): Promise<GameModeDto[]> {
        const response = await api.get<GameModeDto[]>("/GameModes");

        return response.data;
    },
};
