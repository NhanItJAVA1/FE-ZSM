import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../../constants/routes.js";
import { resolveSubmitGameModeId } from "../../../../utils/catalog.js";
import { formatToday } from "../../../../utils/format.js";
import { useGameModesQuery } from "../../hooks/useCatalogQueries.js";
import MapPickerModal from "../../catalog/components/MapPickerModal.js";
import VehiclePickerModal from "../../catalog/components/VehiclePickerModal.js";
import type { MapDto, VehicleDto } from "../../catalog/types.js";
import FinishTimeInput from "../../components/FinishTimeInput.js";
import { useSubmitRecord } from "../../hooks/useSubmitRecord.js";

interface SubmitRecordFormProps {
    maps: MapDto[];
    vehicles: VehicleDto[];
    userId: number;
    defaultRacerName: string;
}

export default function SubmitRecordForm({
    maps,
    vehicles,
    userId,
    defaultRacerName,
}: SubmitRecordFormProps) {
    const navigate = useNavigate();
    const { submit, status, isSubmitting } = useSubmitRecord();
    const gameModesQuery = useGameModesQuery();

    const [mapId, setMapId] = useState<number | null>(null);
    const [vehicleId, setVehicleId] = useState<number | null>(null);
    const [racerName, setRacerName] = useState(defaultRacerName);
    const [timeMinutes, setTimeMinutes] = useState("");
    const [timeSeconds, setTimeSeconds] = useState("");
    const [timeMillis, setTimeMillis] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [mapModalOpen, setMapModalOpen] = useState(false);
    const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const selectedMap = maps.find((map) => map.id === mapId);
    const selectedVehicle = vehicles.find((vehicle) => vehicle.id === vehicleId);
    const gameModeId = resolveSubmitGameModeId(gameModesQuery.data ?? []);

    function buildFinishTimeInput(): string {
        const min = timeMinutes || "0";
        const sec = timeSeconds || "0";
        const ms = timeMillis.padEnd(3, "0") || "000";
        return `${min}:${sec}.${ms}`;
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setValidationError(null);

        if (!mapId || !vehicleId) {
            setValidationError("Hãy chọn map và xe đua.");
            return;
        }

        if (!videoFile) {
            setValidationError("Hãy chọn file video.");
            return;
        }

        if (!racerName.trim()) {
            setValidationError("Hãy nhập tên người đua.");
            return;
        }

        if (!timeSeconds && !timeMinutes) {
            setValidationError("Hãy nhập thời gian hoàn thành.");
            return;
        }

        if (timeSeconds && Number(timeSeconds) > 59) {
            setValidationError("Số giây phải nhỏ hơn 60.");
            return;
        }

        await submit({
            userId,
            mapId,
            vehicleId,
            gameModeId,
            racerName,
            finishTimeInput: buildFinishTimeInput(),
            title,
            description,
            videoFile,
            mapName: selectedMap?.name,
            vehicleName: selectedVehicle?.name,
        });
    }

    const feedback = validationError ?? status;

    return (
        <>
            <form className="submit-form" onSubmit={handleSubmit}>
                <div className="submit-grid">
                    <button
                        type="button"
                        className="picker-field"
                        onClick={() => setMapModalOpen(true)}
                    >
                        <span>Map</span>
                        <strong>{selectedMap?.name ?? "Chọn map"}</strong>
                    </button>

                    <button
                        type="button"
                        className="picker-field"
                        onClick={() => setVehicleModalOpen(true)}
                    >
                        <span>Xe đua</span>
                        <strong>{selectedVehicle?.name ?? "Chọn xe"}</strong>
                    </button>

                    <label>
                        Tên người đua
                        <input
                            value={racerName}
                            onChange={(event) => setRacerName(event.target.value)}
                            placeholder="Tên hiển thị trên bảng kỷ lục"
                            required
                        />
                    </label>

                    <FinishTimeInput
                        minutes={timeMinutes}
                        seconds={timeSeconds}
                        millis={timeMillis}
                        onMinutesChange={setTimeMinutes}
                        onSecondsChange={setTimeSeconds}
                        onMillisChange={setTimeMillis}
                    />

                    <label>
                        Ngày đăng
                        <input value={formatToday()} readOnly disabled />
                    </label>

                    <label className="wide">
                        Tiêu đề (tuỳ chọn)
                        <input
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="Tự tạo nếu để trống"
                        />
                    </label>

                    <label className="wide">
                        Mô tả
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                        />
                    </label>

                    <label className="file-drop wide">
                        <input
                            type="file"
                            accept="video/mp4,video/webm,video/*"
                            onChange={(event) =>
                                setVideoFile(event.target.files?.[0] ?? null)
                            }
                        />
                        <span>
                            {videoFile
                                ? videoFile.name
                                : "Chọn video MP4/WebM để upload"}
                        </span>
                    </label>
                </div>

                {feedback && <p className="form-status">{feedback}</p>}

                <div className="form-actions">
                    <button
                        type="button"
                        className="ghost-btn"
                        onClick={() => navigate(ROUTES.home)}
                    >
                        Huỷ
                    </button>
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Đang gửi..." : "Gửi kiểm duyệt"}
                    </button>
                </div>
            </form>

            <MapPickerModal
                open={mapModalOpen}
                maps={maps}
                selectedId={mapId}
                allowClear={false}
                enableRateFilter
                onSelect={(id) => id !== null && setMapId(id)}
                onClose={() => setMapModalOpen(false)}
            />

            <VehiclePickerModal
                open={vehicleModalOpen}
                vehicles={vehicles}
                selectedId={vehicleId}
                allowClear={false}
                onSelect={(id) => id !== null && setVehicleId(id)}
                onClose={() => setVehicleModalOpen(false)}
            />
        </>
    );
}
