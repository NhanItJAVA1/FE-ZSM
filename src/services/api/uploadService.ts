export interface PresignedUploadTarget {
    uploadUrl: string;
    objectKey: string;
    publicUrl: string;
    expiresAtUtc: string;
}

export async function uploadFileToPresignedUrl(
    uploadUrl: string,
    file: File,
    contentType?: string
): Promise<void> {
    const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
            "Content-Type": contentType || file.type || "application/octet-stream",
        },
        body: file,
    });

    if (!response.ok) {
        throw new Error(`Upload storage lỗi HTTP ${response.status}`);
    }
}

export function resolveImageContentType(file: File): string {
    if (file.type.startsWith("image/")) {
        return file.type;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    switch (extension) {
        case "png":
            return "image/png";
        case "webp":
            return "image/webp";
        case "gif":
            return "image/gif";
        default:
            return "image/jpeg";
    }
}
