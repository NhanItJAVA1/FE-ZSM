import AppLayout from "../../layouts/AppLayout.js";
import PageHeading from "../../layouts/PageHeading.js";
import { useState } from "react";
import RoleManagementPanel from "../../features/rbac/components/RoleManagementPanel.js";
import PermissionManagementPanel from "../../features/rbac/components/PermissionManagementPanel.js";
import UserRoleAssignmentPanel from "../../features/rbac/components/UserRoleAssignmentPanel.js";
import { useAppSelector } from "../../stores/hook.js";
import { RBAC_PERMISSIONS } from "../../constants/rbacPermissions.js";

type AdminSection = "roles" | "permissions" | "users";

export default function AdminPage() {
    const [section, setSection] = useState<AdminSection>("roles");
    const { user } = useAppSelector((state) => state.auth);
    const isSystemOwner = user?.isSystemOwner ?? false;
    const permissions = new Set(user?.permissions ?? []);
    const hasPermission = (permission: string) => isSystemOwner || permissions.has(permission);
    const canCreateRole = hasPermission(RBAC_PERMISSIONS.rolesCreate);
    const canUpdateRole = hasPermission(RBAC_PERMISSIONS.rolesUpdate);
    const canDeleteRole = hasPermission(RBAC_PERMISSIONS.rolesDelete);
    const canReadRoles = hasPermission(RBAC_PERMISSIONS.rolesRead);
    const visibleSections: AdminSection[] = [
        ...(canCreateRole || canUpdateRole || canDeleteRole ? ["roles" as const] : []),
        ...(hasPermission(RBAC_PERMISSIONS.rolesManagePermissions) ? ["permissions" as const] : []),
        ...(hasPermission(RBAC_PERMISSIONS.usersManageRoles) ? ["users" as const] : []),
    ];
    const activeSection = visibleSections.includes(section) ? section : visibleSections[0];

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
                {visibleSections.length === 0 && (
                    <p role="status">Bạn chưa được cấp quyền quản lý RBAC.</p>
                )}
                {visibleSections.length > 0 && (
                    <>
                        <nav className="rbac-tabs" aria-label="Quản lý truy cập">
                            {visibleSections.includes("roles") && <button type="button" className={activeSection === "roles" ? "active" : ""} onClick={() => setSection("roles")}>Roles</button>}
                            {visibleSections.includes("permissions") && <button type="button" className={activeSection === "permissions" ? "active" : ""} onClick={() => setSection("permissions")}>Permissions</button>}
                            {visibleSections.includes("users") && <button type="button" className={activeSection === "users" ? "active" : ""} onClick={() => setSection("users")}>User roles</button>}
                        </nav>
                        {activeSection === "roles" && (
                            <RoleManagementPanel
                                canReadRoles={canReadRoles}
                                canCreateRole={canCreateRole}
                                canUpdateRole={canUpdateRole}
                                canDeleteRole={canDeleteRole}
                            />
                        )}
                        {activeSection === "permissions" && <PermissionManagementPanel />}
                        {activeSection === "users" && <UserRoleAssignmentPanel />}
                    </>
                )}
            </section>
        </AppLayout>
    );
}
