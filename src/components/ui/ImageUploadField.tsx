import { useEffect, useState } from "react";

interface ImageUploadFieldProps {
    label: string;
    imageUrl: string;
    onImageUrlChange: (value: string) => void;
    imageFile: File | null;
    onImageFileChange: (file: File | null) => void;
    error?: string | undefined;
}

export default function ImageUploadField({
    label,
    imageUrl,
    onImageUrlChange,
    imageFile,
    onImageFileChange,
    error,
}: ImageUploadFieldProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!imageFile) {
            setPreviewUrl(imageUrl.trim() || null);
            return;
        }

        const objectUrl = URL.createObjectURL(imageFile);
        setPreviewUrl(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [imageFile, imageUrl]);

    return (
        <div className="image-upload-field wide">
            <span className="image-upload-label">{label}</span>

            <div className="image-upload-body">
                <div className="image-upload-preview">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Xem trước ảnh" />
                    ) : (
                        <span>Chưa có ảnh</span>
                    )}
                </div>

                <div className="image-upload-controls">
                    <label className="file-drop">
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/*"
                            onChange={(event) => {
                                onImageFileChange(event.target.files?.[0] ?? null);
                            }}
                        />
                        <span>
                            {imageFile
                                ? imageFile.name
                                : "Chọn ảnh từ máy (PNG/JPG/WebP)"}
                        </span>
                    </label>

                    <label>
                        Hoặc dán URL ảnh
                        <input
                            value={imageUrl}
                            onChange={(event) => onImageUrlChange(event.target.value)}
                            placeholder="https://..."
                            disabled={Boolean(imageFile)}
                        />
                    </label>
                </div>
            </div>

            {error && <span className="field-error">{error}</span>}
        </div>
    );
}
