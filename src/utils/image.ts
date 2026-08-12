import { catalogUploadService } from "../services/api/catalogUploadService.js";
import type { CatalogImageCategory } from "../services/api/catalogUploadService.js";
import {
    resolveImageContentType,
    uploadFileToPresignedUrl,
} from "../services/api/uploadService.js";

export async function uploadCatalogImage(
    file: File,
    category: CatalogImageCategory
): Promise<string> {
    const contentType = resolveImageContentType(file);
    const uploadTarget = await catalogUploadService.getImageUploadUrl(
        file.name,
        contentType,
        category
    );

    await uploadFileToPresignedUrl(uploadTarget.uploadUrl, file, contentType);

    return uploadTarget.publicUrl;
}

export async function resolveImageUrl(
    imageFile: File | null,
    imageUrl: string,
    category: CatalogImageCategory
): Promise<string | null> {
    if (imageFile) {
        return uploadCatalogImage(imageFile, category);
    }

    const trimmedUrl = imageUrl.trim();

    return trimmedUrl || null;
}
