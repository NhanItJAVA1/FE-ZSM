import AppLayout from "../../layouts/AppLayout.js";
import PageHeading from "../../layouts/PageHeading.js";
import { useCallback, useRef, useState } from "react";
import RoleManagementPanel from "../../features/rbac/components/RoleManagementPanel.js";
import UserRoleAssignmentPanel from "../../features/rbac/components/UserRoleAssignmentPanel.js";
import { useAppSelector } from "../../stores/hook.js";
import { RBAC_PERMISSIONS } from "../../constants/rbacPermissions.js";
import { RbacToast, type RbacToastNotice, type RbacToastType } from "../../features/rbac/components/RbacStates.js";

type AdminSection = "roles" | "users";

export default function AdminPage() {
    const [section, setSection] = useState<AdminSection>("roles");
    const [toast, setToast] = useState<RbacToastNotice | null>(null);
    const toastId = useRef(0);
    const { user } = useAppSelector((state) => state.auth);
    const permissions = new Set(user?.permissions ?? []);
    const hasPermission = (permission: string) => permissions.has(permission);
    const canCreateRole = hasPermission(RBAC_PERMISSIONS.rolesCreate);
    const canUpdateRole = hasPermission(RBAC_PERMISSIONS.rolesUpdate);
    const canDeleteRole = hasPermission(RBAC_PERMISSIONS.rolesDelete);
    const canReadRoles = hasPermission(RBAC_PERMISSIONS.rolesRead);
    const canReadPermissions = hasPermission(RBAC_PERMISSIONS.permissionsRead);
    const canManagePermissions = hasPermission(RBAC_PERMISSIONS.rolesManagePermissions);
    const visibleSections: AdminSection[] = [
        ...(canReadRoles || canReadPermissions || canCreateRole || canUpdateRole || canDeleteRole || canManagePermissions ? ["roles" as const] : []),
        ...(hasPermission(RBAC_PERMISSIONS.usersManageRoles) ? ["users" as const] : []),
    ];
    const activeSection = visibleSections.includes(section) ? section : visibleSections[0];
    const showToast = useCallback((message: string, type: RbacToastType = "success") => {
        toastId.current += 1;
        setToast({ id: toastId.current, message, type });
    }, []);
    const dismissToast = useCallback(() => setToast(null), []);

    return (
        <AppLayout>
            <PageHeading
                className="page-heading--sticky page-heading--admin"
                eyebrow="Admin"
                title="Access Management"
                description="Manage Roles, Role permissions, and User access."
                action={user && <span className="admin-heading-greeting">Hi, {user.displayName || user.username}</span>}
            />

            <section className="rbac-workspace">
                {visibleSections.length === 0 && (
                    <p role="status">Bạn chưa được cấp quyền quản lý RBAC.</p>
                )}
                {visibleSections.length > 0 && (
                    <>
                        <nav className="rbac-tabs" aria-label="Quản lý truy cập">
                            {visibleSections.includes("roles") && <button type="button" className={activeSection === "roles" ? "active" : ""} onClick={() => setSection("roles")}>Roles</button>}
                            {visibleSections.includes("users") && <button type="button" className={activeSection === "users" ? "active" : ""} onClick={() => setSection("users")}>Users</button>}
                        </nav>
                        {activeSection === "roles" && (
                            <RoleManagementPanel
                                canReadRoles={canReadRoles}
                                canCreateRole={canCreateRole}
                                canUpdateRole={canUpdateRole}
                                canDeleteRole={canDeleteRole}
                                canManagePermissions={canManagePermissions}
                                canManageUserRoles={hasPermission(RBAC_PERMISSIONS.usersManageRoles)}
                                onToast={showToast}
                            />
                        )}
                        {activeSection === "users" && <UserRoleAssignmentPanel onToast={showToast} />}
                    </>
                )}
            </section>
            <RbacToast notice={toast} onDismiss={dismissToast} />
        </AppLayout>
    );
}
