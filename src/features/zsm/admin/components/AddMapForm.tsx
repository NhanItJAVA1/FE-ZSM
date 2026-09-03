import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ImageUploadField from "../../components/ImageUploadField.js";
import { MAP_DIFFICULTIES, formatMapRate } from "../../../../constants/catalog.js";
import { sortMapsByRate } from "../../../../utils/catalog.js";
import { resolveImageUrl } from "../../../../utils/image.js";
import { useMapsQuery } from "../../hooks/useCatalogQueries.js";
import type { MapDto } from "../../catalog/types.js";
import {
    useCreateMapMutation,
    useDeleteMapMutation,
    useUpdateMapMutation,
} from "../../hooks/useCatalogMutations.js";
import {
    mapFormSchema,
    type MapFormValues,
} from "../schemas/catalogSchemas.js";
import CatalogItemGrid from "./CatalogItemGrid.js";
import { Controller } from "react-hook-form";
import StarRating from "../../components/StarRating.js";

const DEFAULT_VALUES: MapFormValues = {
    name: "",
    rate: 3,
    imageUrl: "",
};

export default function AddMapForm() {
    const { data: maps = [], isLoading } = useMapsQuery();
    const createMap = useCreateMapMutation();
    const updateMap = useUpdateMapMutation();
    const deleteMap = useDeleteMapMutation();

    const [editingMap, setEditingMap] = useState<MapDto | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        control,
        formState: { errors, isSubmitting },
    } = useForm<MapFormValues>({
        resolver: zodResolver(mapFormSchema),
        defaultValues: DEFAULT_VALUES,
    });

    const imageUrl = watch("imageUrl");
    const isEditing = editingMap !== null;

    useEffect(() => {
        if (!editingMap) {
            reset(DEFAULT_VALUES);
            setImageFile(null);
            return;
        }

        reset({
            name: editingMap.name,
            rate: Number(editingMap.rate),
            imageUrl: editingMap.imageUrl ?? "",
        });
        setImageFile(null);
        setImageError(null);
        setStatus(null);
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [editingMap, reset]);

    function handleCancelEdit() {
        setEditingMap(null);
        setImageFile(null);
        setImageError(null);
        setStatus(null);
        reset(DEFAULT_VALUES);
    }

    async function onSubmit(values: MapFormValues) {
        setStatus(null);
        setImageError(null);

        try {
            if (imageFile) {
                setStatus("Đang upload ảnh lên S3...");
            }

            const resolvedImageUrl = await resolveImageUrl(
                imageFile,
                values.imageUrl,
                "maps"
            );
            const fallbackImageUrl = editingMap?.imageUrl ?? null;

            if (!resolvedImageUrl && !fallbackImageUrl) {
                setImageError("Hãy chọn ảnh hoặc nhập URL ảnh map.");
                return;
            }

            const payload = {
                name: values.name.trim(),
                rate: values.rate,
                imageUrl: resolvedImageUrl ?? fallbackImageUrl,
            };

            if (isEditing) {
                await updateMap.mutateAsync({
                    id: editingMap.id,
                    payload,
                });
                setStatus("Đã cập nhật map thành công.");
                setEditingMap(null);
            } else {
                await createMap.mutateAsync(payload);
                setStatus("Đã thêm map thành công.");
            }

            reset(DEFAULT_VALUES);
            setImageFile(null);
        } catch (error) {
            setStatus(
                error instanceof Error ? error.message : "Không thể lưu map."
            );
        }
    }

    async function handleDelete(id: number) {
        const target = maps.find((map) => map.id === id);

        if (!target) {
            return;
        }

        const confirmed = window.confirm(`Xóa map "${target.name}"?`);

        if (!confirmed) {
            return;
        }

        setStatus(null);
        setDeletingId(id);

        try {
            await deleteMap.mutateAsync(id);

            if (editingMap?.id === id) {
                handleCancelEdit();
            }

            setStatus("Đã xóa map thành công.");
        } catch (error) {
            setStatus(
                error instanceof Error ? error.message : "Không thể xóa map."
            );
        } finally {
            setDeletingId(null);
        }
    }

    const isSaving =
        isSubmitting || createMap.isPending || updateMap.isPending;

    return (
        <div className="admin-catalog-section">
            <form ref={formRef} className="submit-form" onSubmit={handleSubmit(onSubmit)}>
                <div className="submit-grid">
                    <label className="wide">
                        Tên map
                        <input
                            placeholder="Ví dụ: Thành phố đêm"
                            {...register("name")}
                        />
                        {errors.name && (
                            <span className="field-error">{errors.name.message}</span>
                        )}
                    </label>

                    <label>
                        Độ khó
                        <Controller
                            name="rate"
                            control={control}
                            render={({ field }) => (
                                <StarRating
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                        {errors.rate && (
                            <span className="field-error">{errors.rate.message}</span>
                        )}
                    </label>

                    <ImageUploadField
                        label="Ảnh map"
                        imageUrl={imageUrl}
                        onImageUrlChange={(value) => setValue("imageUrl", value)}
                        imageFile={imageFile}
                        onImageFileChange={setImageFile}
                        error={imageError ?? undefined}
                    />
                </div>

                {status && <p className="form-status">{status}</p>}

                <div className="form-actions">
                    {isEditing && (
                        <button
                            type="button"
                            className="ghost-btn"
                            onClick={handleCancelEdit}
                        >
                            Huỷ sửa
                        </button>
                    )}
                    <button type="submit" disabled={isSaving}>
                        {isSaving
                            ? "Đang lưu..."
                            : isEditing
                                ? "Cập nhật map"
                                : "Thêm map"}
                    </button>
                </div>
            </form>

            <CatalogItemGrid
                title="Map hiện có"
                emptyText="Chưa có map nào."
                isLoading={isLoading}
                editingId={editingMap?.id ?? null}
                deletingId={deletingId}
                onEdit={(id) =>
                    setEditingMap(maps.find((map) => map.id === id) ?? null)
                }
                onDelete={handleDelete}
                items={sortMapsByRate(maps).map((map) => ({
                    id: map.id,
                    name: map.name,
                    imageUrl: map.imageUrl,
                    subtitle: formatMapRate(map.rate),
                }))}
            />
        </div>
    );
}
