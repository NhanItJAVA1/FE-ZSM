type AdminTab = "moderation" | "maps" | "vehicles";

interface AdminTabsProps {
    activeTab: AdminTab;
    onChange: (tab: AdminTab) => void;
}

const TABS: Array<{ id: AdminTab; label: string }> = [
    { id: "moderation", label: "Kiểm duyệt" },
    { id: "maps", label: "Thêm map" },
    { id: "vehicles", label: "Thêm xe" },
];

export default function AdminTabs({ activeTab, onChange }: AdminTabsProps) {
    return (
        <div className="admin-tabs" role="tablist" aria-label="Admin sections">
            {TABS.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    className={activeTab === tab.id ? "active" : undefined}
                    onClick={() => onChange(tab.id)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

export type { AdminTab };
