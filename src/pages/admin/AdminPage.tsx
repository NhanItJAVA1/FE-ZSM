import AppLayout from "../../layouts/AppLayout.js";
import PageHeading from "../../layouts/PageHeading.js";
import { useState } from "react";
import RoleManagementPanel from "../../features/rbac/components/RoleManagementPanel.js";
import PermissionManagementPanel from "../../features/rbac/components/PermissionManagementPanel.js";
import UserRoleAssignmentPanel from "../../features/rbac/components/UserRoleAssignmentPanel.js";

type AdminSection = "roles" | "permissions" | "users";

export default function AdminPage() {
    const [section, setSection] = useState<AdminSection>("roles");

    return (
        <AppLayout>
            <PageHeading
                eyebrow="Admin"
                title="Quản lý truy cập"
                description="Quản lý Roles, Permissions và vai trò được gán cho từng User."
            />

            <section className="rbac-workspace">
                <div className="rbac-security-note" role="note">
                    Quyền được xác thực bởi Backend trên mọi request. Giao diện không suy ra quyền từ JWT Role claim.
                </div>
                <nav className="rbac-tabs" aria-label="Quản lý truy cập">
                    <button type="button" className={section === "roles" ? "active" : ""} onClick={() => setSection("roles")}>Roles</button>
                    <button type="button" className={section === "permissions" ? "active" : ""} onClick={() => setSection("permissions")}>Permissions</button>
                    <button type="button" className={section === "users" ? "active" : ""} onClick={() => setSection("users")}>User roles</button>
                </nav>
                {section === "roles" && <RoleManagementPanel />}
                {section === "permissions" && <PermissionManagementPanel />}
                {section === "users" && <UserRoleAssignmentPanel />}
            </section>
        </AppLayout>
    );
}
