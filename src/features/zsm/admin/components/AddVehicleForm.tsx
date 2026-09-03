import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ImageUploadField from "../../components/ImageUploadField.js";
import VehicleRankPicker from "../../components/VehicleRankPicker.js";
import VehicleTypePicker from "../../components/VehicleTypePicker.js";
import {
    getRanksForVehicleType,
    getVehicleRankLabel,
    getVehicleTypeLabel,
    parseVehicleRank,
} from "../../../../constants/catalog.js";
import { sortVehiclesByRank } from "../../../../utils/catalog.js";
import { resolveImageUrl } from "../../../../utils/image.js";
import { useVehiclesQuery } from "../../hooks/useCatalogQueries.js";
import type { VehicleDto } from "../../catalog/types.js";
import {
    useCreateVehicleMutation,
    useDeleteVehicleMutation,
    useUpdateVehicleMutation,
} from "../../hooks/useCatalogMutations.js";
import {
    vehicleFormSchema,
    type VehicleFormValues,
} from "../schemas/catalogSchemas.js";
import CatalogItemGrid from "./CatalogItemGrid.js";

const DEFAULT_VALUES: VehicleFormValues = {
    name: "",
    type: 0,
    rank: 0,
    imageUrl: "",
};

export default function AddVehicleForm() {
    const { data: vehicles = [], isLoading } = useVehiclesQuery();
    const createVehicle = useCreateVehicleMutation();
    const updateVehicle = useUpdateVehicleMutation();
    const deleteVehicle = useDeleteVehicleMutation();

    const formRef = useRef<HTMLFormElement>(null);
    const [editingVehicle, setEditingVehicle] = useState<VehicleDto | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        control,
        formState: { errors, isSubmitting },
    } = useForm<VehicleFormValues>({
        resolver: zodResolver(vehicleFormSchema),
        defaultValues: DEFAULT_VALUES,
    });

    const imageUrl = watch("imageUrl");
    const vehicleType = watch("type");
    const vehicleRank = watch("rank");
    const isEditing = editingVehicle !== null;

    useEffect(() => {
        if (!editingVehicle) {
            reset(DEFAULT_VALUES);
            setImageFile(null);
            return;
        }

        reset({
            name: editingVehicle.name,
            type: editingVehicle.type <= 1 ? editingVehicle.type : 0,
            rank: parseVehicleRank(editingVehicle.rank),
            imageUrl: editingVehicle.imageUrl ?? "",
        });
        setImageFile(null);
        setImageError(null);
        setStatus(null);
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [editingVehicle, reset]);

    useEffect(() => {
        const validRanks = getRanksForVehicleType(vehicleType);

        if (!validRanks.some((item) => item.value === vehicleRank)) {
            setValue("rank", validRanks[0]?.value ?? 0);
        }
    }, [vehicleType, vehicleRank, setValue]);

    function handleCancelEdit() {
        setEditingVehicle(null);
        setImageFile(null);
        setImageError(null);
        setStatus(null);
        reset(DEFAULT_VALUES);
    }

    async function onSubmit(values: VehicleFormValues) {
        setStatus(null);
        setImageError(null);

        try {
            if (imageFile) {
                setStatus("Đang upload ảnh lên S3...");
            }

            const resolvedImageUrl = await resolveImageUrl(
                imageFile,
                values.imageUrl,
                "vehicles"
            );
            const fallbackImageUrl = editingVehicle?.imageUrl ?? null;

            if (!resolvedImageUrl && !fallbackImageUrl) {
                setImageError("Hãy chọn ảnh hoặc nhập URL ảnh xe.");
                return;
            }

            const payload = {
                name: values.name.trim(),
                type: values.type,
                rank: values.rank,
                imageUrl: resolvedImageUrl ?? fallbackImageUrl,
            };

            if (isEditing) {
                await updateVehicle.mutateAsync({
                    id: editingVehicle.id,
                    payload,
                });
                setStatus("Đã cập nhật xe thành công.");
                setEditingVehicle(null);
            } else {
                await createVehicle.mutateAsync(payload);
                setStatus("Đã thêm xe thành công.");
            }

            reset(DEFAULT_VALUES);
            setImageFile(null);
        } catch (error) {
            setStatus(
                error instanceof Error ? error.message : "Không thể lưu xe."
            );
        }
    }

    async function handleDelete(id: number) {
        const target = vehicles.find((vehicle) => vehicle.id === id);

        if (!target) {
            return;
        }

        const confirmed = window.confirm(`Xóa xe "${target.name}"?`);

        if (!confirmed) {
            return;
        }

        setStatus(null);
        setDeletingId(id);

        try {
            await deleteVehicle.mutateAsync(id);

            if (editingVehicle?.id === id) {
                handleCancelEdit();
            }

            setStatus("Đã xóa xe thành công.");
        } catch (error) {
            setStatus(
                error instanceof Error ? error.message : "Không thể xóa xe."
            );
        } finally {
            setDeletingId(null);
        }
    }

    const isSaving =
        isSubmitting || createVehicle.isPending || updateVehicle.isPending;

    return (
        <div className="admin-catalog-section">
            <form
                ref={formRef}
                className="submit-form"
                onSubmit={handleSubmit(onSubmit)}
            >
                <div className="submit-grid">
                    <label className="wide">
                        Tên xe
                        <input
                            placeholder="Ví dụ: Lamborghini Huracán"
                            {...register("name")}
                        />
                        {errors.name && (
                            <span className="field-error">{errors.name.message}</span>
                        )}
                    </label>

                    <label>
                        Loại xe
                        <Controller
                            name="type"
                            control={control}
                            render={({ field }) => (
                                <VehicleTypePicker
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                        {errors.type && (
                            <span className="field-error">{errors.type.message}</span>
                        )}
                    </label>

                    <label>
                        Cấp bậc
                        <Controller
                            name="rank"
                            control={control}
                            render={({ field }) => (
                                <VehicleRankPicker
                                    vehicleType={vehicleType}
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                        {errors.rank && (
                            <span className="field-error">{errors.rank.message}</span>
                        )}
                    </label>

                    <ImageUploadField
                        label="Ảnh xe"
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
                              ? "Cập nhật xe"
                              : "Thêm xe"}
                    </button>
                </div>
            </form>

            <CatalogItemGrid
                title="Xe hiện có"
                emptyText="Chưa có xe nào."
                isLoading={isLoading}
                editingId={editingVehicle?.id ?? null}
                deletingId={deletingId}
                onEdit={(id) =>
                    setEditingVehicle(
                        vehicles.find((vehicle) => vehicle.id === id) ?? null
                    )
                }
                onDelete={handleDelete}
                items={sortVehiclesByRank(vehicles).map((vehicle) => ({
                    id: vehicle.id,
                    name: vehicle.name,
                    imageUrl: vehicle.imageUrl,
                    subtitle: `${getVehicleTypeLabel(vehicle.type)} · ${getVehicleRankLabel(vehicle.rank)}`,
                }))}
            />
        </div>
    );
}
