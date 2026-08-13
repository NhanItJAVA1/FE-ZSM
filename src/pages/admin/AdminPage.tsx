import { useState } from "react";
import AppLayout from "../../layouts/AppLayout.js";
import PageHeading from "../../layouts/PageHeading.js";
import AdminPendingList from "../../features/admin/components/AdminPendingList.js";
import AddMapForm from "../../features/admin/components/AddMapForm.js";
import AddVehicleForm from "../../features/admin/components/AddVehicleForm.js";
import AdminTabs, {
    type AdminTab,
} from "../../features/admin/components/AdminTabs.js";
import { useModeration } from "../../features/admin/hooks/useModeration.js";

const TAB_COPY: Record<
    AdminTab,
    { title: string; description: string }
> = {
    moderation: {
        title: "Kiểm duyệt kỷ lục",
        description:
            "Duyệt hoặc từ chối các bản ghi chờ trước khi hiển thị công khai.",
    },
    maps: {
        title: "Quản lý map",
        description: "Thêm map mới với tên, ảnh và độ khó cho hệ thống.",
    },
    vehicles: {
        title: "Quản lý xe",
        description: "Thêm xe mới với tên, loại xe, cấp bậc và ảnh.",
    },
};

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<AdminTab>("moderation");
    const {
        pending,
        isLoading,
        isFetching,
        error,
        refetch,
        processingId,
        message,
        approve,
        reject,
    } = useModeration();
    const tabCopy = TAB_COPY[activeTab];

    return (
        <AppLayout>
            <PageHeading
                eyebrow="Admin"
                title={tabCopy.title}
                description={tabCopy.description}
            />

            <AdminTabs activeTab={activeTab} onChange={setActiveTab} />

            {activeTab === "moderation" && (
                <>
                    {message && <p className="form-status">{message}</p>}

                    <AdminPendingList
                        pending={pending}
                        isLoading={isLoading}
                        isFetching={isFetching}
                        error={error}
                        processingId={processingId}
                        onApprove={approve}
                        onReject={reject}
                        onRefresh={() => {
                            void refetch();
                        }}
                    />
                </>
            )}

            {activeTab === "maps" && <AddMapForm />}
            {activeTab === "vehicles" && <AddVehicleForm />}
        </AppLayout>
    );
}
