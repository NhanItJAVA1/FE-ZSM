import api from "./axios.js";
import type { PresignedUploadTarget } from "./uploadService.js";

export type CatalogImageCategory = "maps" | "vehicles";

export const catalogUploadService = {
    async getImageUploadUrl(
        fileName: string,
        contentType: string,
        category: CatalogImageCategory
    ): Promise<PresignedUploadTarget> {
        const response = await api.post<PresignedUploadTarget>(
            "/Catalog/image-upload-url",
            { fileName, contentType, category }
        );

        return response.data;
    },
};
