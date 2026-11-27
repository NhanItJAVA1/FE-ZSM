import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RBAC_ADMIN_PAGE_ACCESS_PERMISSIONS } from "../../../constants/rbacPermissions.js";
import { QUERY_KEYS } from "../../../constants/queryKeys.js";
import { rbacService } from "../../../services/api/rbacService.js";
import { authService } from "../../../services/api/authService.js";
import { useAppDispatch } from "../../../stores/hook.js";
import { setAuth } from "../../../stores/slices/authSlice.js";
import { getApiErrorMessage } from "../apiErrors.js";
import type { PermissionDto } from "../types.js";
import { RbacEmpty, RbacError, RbacLoading } from "./RbacStates.js";
import type { RbacToastType } from "./RbacStates.js";

function moduleName(permission: PermissionDto) {
    const [module] = permission.code.split(".");
    const normalizedModule = module === "todos" ? "todo" : module;
    return normalizedModule?.replaceAll("-", " ") || "other";
}

interface PermissionManagementPanelProps {
    roleId?: number;
    roleName?: string;
    onToast: (message: string, type?: RbacToastType) => void;
    onCancel?: () => void;
    onBeforeSave?: () => Promise<boolean>;
    hasAdditionalChanges?: boolean;
}

export default function PermissionManagementPanel({
    roleId,
    roleName,
    onToast,
    onCancel,
    onBeforeSave,
    hasAdditionalChanges = false,
}: PermissionManagementPanelProps) {
    const dispatch = useAppDispatch();
    const queryClient = useQueryClient();
    const rolesQuery = useQuery({
        queryKey: QUERY_KEYS.rbacRoles,
        queryFn: rbacService.getRoles,
        enabled: roleId === undefined,
    });
    const permissionsQuery = useQuery({ queryKey: QUERY_KEYS.rbacPermissions, queryFn: rbacService.getPermissions });
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
    const role = roleId === undefined
        ? rolesQuery.data?.find((item) => item.id === selectedRoleId) ?? rolesQuery.data?.[0]
        : { id: roleId, name: roleName ?? `Role ${roleId}`, description: "" };
    const selectedId = role?.id;
    const rolePermissionsQuery = useQuery({
        queryKey: selectedId ? QUERY_KEYS.rolePermissions(selectedId) : ["rbac", "role-permissions", "none"],
        queryFn: () => rbacService.getRolePermissions(selectedId!),
        enabled: selectedId !== undefined,
    });
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
    const [saveError, setSaveError] = useState<string | null>(null);
    const savedIds = useMemo(
        () => rolePermissionsQuery.data?.map((permission) => permission.id) ?? [],
        [rolePermissionsQuery.data]
    );

    useEffect(() => {
        setSelectedPermissionIds(savedIds);
        setSaveError(null);
    }, [selectedId, rolePermissionsQuery.data]);

    const groups = useMemo(() => {
        const grouped = new Map<string, PermissionDto[]>();
        for (const permission of permissionsQuery.data ?? []) {
            const module = moduleName(permission);
            grouped.set(module, [...(grouped.get(module) ?? []), permission]);
        }
        return [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right));
    }, [permissionsQuery.data]);
    const dirty = [...selectedPermissionIds].sort((a, b) => a - b).join(",") !== [...savedIds].sort((a, b) => a - b).join(",");

    const saveMutation = useMutation({
        mutationFn: async () => {
            const roleDetailsUpdated = await onBeforeSave?.() ?? false;
            try {
                await rbacService.replaceRolePermissions(selectedId!, { permissionIds: selectedPermissionIds });
            } catch (error) {
                if (roleDetailsUpdated) {
                    throw new Error(`Role name and description were saved, but Permissions could not be saved: ${getApiErrorMessage(error, "update Permissions", "en")}`);
                }
                throw error;
            }
            return roleDetailsUpdated;
        },
        onSuccess: async (roleDetailsUpdated) => {
            setSaveError(null);
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rolePermissions(selectedId!) });
            onToast(roleDetailsUpdated
                ? `Role and Permissions saved for “${role?.name ?? ""}”.`
                : `Permissions updated for Role “${role?.name ?? ""}”.`);
            try {
                dispatch(setAuth(await authService.refreshSession()));
            } catch {
                setSaveError("Permissions were saved, but the current session could not be refreshed. Reload the page.");
            }
        },
        onError: (error) => setSaveError(getApiErrorMessage(error, "update Permissions", "en")),
    });

    function togglePermission(id: number, checked: boolean) {
        setSelectedPermissionIds((current) => checked
            ? [...new Set([...current, id])]
            : current.filter((permissionId) => permissionId !== id));
    }

    return (
        <section className={`rbac-card${roleId !== undefined ? " rbac-card-embedded" : ""}`}>
            <div className="rbac-section-heading">
                <div>
                    <h2>Permissions · {role?.name ?? "Role"}</h2>
                    <p>Configure the effective Permissions granted to this Role.</p>
                </div>
            </div>

            {roleId === undefined && rolesQuery.isLoading && <RbacLoading language="en" />}
            {roleId === undefined && rolesQuery.isError && <RbacError error={rolesQuery.error} action="load Roles" language="en" />}
            {roleId === undefined && rolesQuery.data && rolesQuery.data.length === 0 && <RbacEmpty>Create a Role before configuring Permissions.</RbacEmpty>}

            {((roleId !== undefined && role !== undefined) || (roleId === undefined && rolesQuery.data && rolesQuery.data.length > 0)) && (
                <>
                    {roleId === undefined && rolesQuery.data && <label className="rbac-role-select">
                        Role
                        <select value={role?.id ?? ""} onChange={(event) => setSelectedRoleId(Number(event.target.value))}>
                            {rolesQuery.data.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                    </label>}

                    <div className="rbac-replace-warning" role="note">
                        <strong>Saving replaces this Role’s entire current Permission list.</strong>
                        <span>Unselected Permissions will be revoked. Review your changes before saving.</span>
                    </div>

                    {permissionsQuery.isLoading && <RbacLoading language="en" />}
                    {permissionsQuery.isError && <RbacError error={permissionsQuery.error} action="load Permissions" language="en" />}
                    {rolePermissionsQuery.isLoading && <RbacLoading language="en" />}
                    {rolePermissionsQuery.isError && <RbacError error={rolePermissionsQuery.error} action="load this Role’s Permissions" language="en" />}
                    {permissionsQuery.data?.length === 0 && <RbacEmpty>No Permissions are available.</RbacEmpty>}

                    {permissionsQuery.data && permissionsQuery.data.length > 0 && !rolePermissionsQuery.isLoading && !rolePermissionsQuery.isError && (
                        <div className="rbac-permission-groups">
                            {groups.map(([module, permissions]) => {
                                const allChecked = permissions.every((permission) => selectedPermissionIds.includes(permission.id));
                                return (
                                    <section className="rbac-permission-group" key={module}>
                                        <div className="rbac-group-heading">
                                            <h3>{module}</h3>
                                            <button
                                                type="button"
                                                className="rbac-link-button"
                                                onClick={() => {
                                                    for (const permission of permissions) togglePermission(permission.id, !allChecked);
                                                }}
                                            >{allChecked ? "Deselect group" : "Select all"}</button>
                                        </div>
                                        <div className="rbac-permission-list">
                                            {permissions.map((permission) => (
                                                <label className="rbac-permission-item" key={permission.id}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPermissionIds.includes(permission.id)}
                                                        onChange={(event) => togglePermission(permission.id, event.target.checked)}
                                                    />
                                                    <span>
                                                        <span className="rbac-permission-title">
                                                            <strong>{permission.description || permission.code}</strong>
                                                            {RBAC_ADMIN_PAGE_ACCESS_PERMISSIONS.some((code) => code === permission.code) && (
                                                                <small className="rbac-admin-access-badge">Admin access</small>
                                                            )}
                                                        </span>
                                                        <small>{permission.code}</small>
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    )}

                    {saveError && <p className="rbac-inline-error" role="alert">{saveError}</p>}
                    <div className="rbac-footer-actions">
                        <span>{selectedPermissionIds.length} Permissions selected</span>
                        <div className="rbac-row-actions">
                            {onCancel && <button type="button" className="ghost-btn" onClick={onCancel}>Cancel</button>}
                            <button
                                type="button"
                                className="rbac-primary-button"
                                disabled={(!dirty && !hasAdditionalChanges) || saveMutation.isPending || rolePermissionsQuery.isLoading || permissionsQuery.isLoading || permissionsQuery.isError || rolePermissionsQuery.isError}
                                onClick={() => saveMutation.mutate()}
                            >{saveMutation.isPending ? "Saving…" : "Save"}</button>
                        </div>
                    </div>
                </>
            )}
        </section>
    );
}
