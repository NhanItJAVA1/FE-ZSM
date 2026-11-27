import { Fragment, useEffect, useMemo, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../constants/queryKeys.js";
import { rbacService } from "../../../services/api/rbacService.js";
import { authService } from "../../../services/api/authService.js";
import { useAppDispatch, useAppSelector } from "../../../stores/hook.js";
import { setAuth } from "../../../stores/slices/authSlice.js";
import { getApiErrorCode, getApiErrorMessage } from "../apiErrors.js";
import { RbacEmpty, RbacError, RbacLoading } from "./RbacStates.js";
import type { RbacToastType } from "./RbacStates.js";
import type { PermissionDto } from "../types.js";

export default function UserRoleAssignmentPanel({ onToast }: { onToast: (message: string, type?: RbacToastType) => void }) {
    const dispatch = useAppDispatch();
    const currentUserId = useAppSelector((state) => state.auth.user?.id);
    const queryClient = useQueryClient();
    const usersQuery = useQuery({ queryKey: QUERY_KEYS.users, queryFn: rbacService.getUsers });
    const rolesQuery = useQuery({ queryKey: QUERY_KEYS.rbacRoles, queryFn: rbacService.getRoles });
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const user = usersQuery.data?.find((item) => item.id === editingUserId);
    const userRolesQuery = useQuery({
        queryKey: user ? QUERY_KEYS.userRoles(user.id) : ["rbac", "user-roles", "none"],
        queryFn: () => rbacService.getUserRoles(user!.id),
        enabled: user !== undefined,
    });
    const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
    const [permissionSearch, setPermissionSearch] = useState("");
    const selectedRoles = useMemo(
        () => (rolesQuery.data ?? []).filter((role) => selectedRoleIds.includes(role.id)),
        [rolesQuery.data, selectedRoleIds]
    );
    const rolePermissionQueries = useQueries({
        queries: selectedRoles.map((role) => ({
            queryKey: QUERY_KEYS.rolePermissions(role.id),
            queryFn: () => rbacService.getRolePermissions(role.id),
        })),
    });
    const effectivePermissions = useMemo(() => {
        const permissionsById = new Map<number, { permission: PermissionDto; roles: string[] }>();
        selectedRoles.forEach((role, index) => {
            for (const permission of rolePermissionQueries[index]?.data ?? []) {
                const existing = permissionsById.get(permission.id);
                if (existing) {
                    existing.roles.push(role.name);
                } else {
                    permissionsById.set(permission.id, { permission, roles: [role.name] });
                }
            }
        });

        return [...permissionsById.values()].sort((left, right) =>
            (left.permission.description || left.permission.code).localeCompare(
                right.permission.description || right.permission.code
            )
        );
    }, [rolePermissionQueries, selectedRoles]);
    const effectivePermissionGroups = useMemo(() => {
        const normalizedSearch = permissionSearch.trim().toLocaleLowerCase();
        const groups = new Map<string, typeof effectivePermissions>();

        effectivePermissions
            .filter(({ permission, roles }) => !normalizedSearch || [
                permission.code,
                permission.description,
                ...roles,
            ].some((value) => value.toLocaleLowerCase().includes(normalizedSearch)))
            .forEach((item) => {
                const [module = "other"] = item.permission.code.split(".");
                const groupName = (module === "todos" ? "todo" : module).replaceAll("-", " ");
                groups.set(groupName, [...(groups.get(groupName) ?? []), item]);
            });

        return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right));
    }, [effectivePermissions, permissionSearch]);
    const savedIds = useMemo(() => userRolesQuery.data?.map((role) => role.id) ?? [], [userRolesQuery.data]);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [lastAdminError, setLastAdminError] = useState(false);

    useEffect(() => {
        setSelectedRoleIds(savedIds);
        setSaveError(null);
        setLastAdminError(false);
    }, [user?.id, savedIds]);

    const dirty = [...selectedRoleIds].sort((a, b) => a - b).join(",") !== [...savedIds].sort((a, b) => a - b).join(",");
    const saveMutation = useMutation({
        mutationFn: () => rbacService.replaceUserRoles(user!.id, { roleIds: selectedRoleIds }),
        onSuccess: async (roles) => {
            setSelectedRoleIds(roles.map((role) => role.id));
            setSaveError(null);
            setLastAdminError(false);
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userRoles(user!.id) }),
                queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users }),
            ]);
            onToast(`Roles updated for “${user!.displayName || user!.username}”.`);
            if (user!.id === currentUserId) {
                try {
                    dispatch(setAuth(await authService.refreshSession()));
                } catch {
                    setSaveError("Roles were saved, but the current session permissions could not be refreshed. Reload the page.");
                }
            }
        },
        onError: (error) => {
            setSaveError(getApiErrorMessage(error, "update this User's Roles", "en"));
            setLastAdminError(getApiErrorCode(error) === "LAST_ADMIN_PROTECTED");
        },
    });

    function editUser(userId: number) {
        setEditingUserId(userId);
        setSaveError(null);
        setLastAdminError(false);
    }

    return (
        <div className="rbac-panel-grid">
            {!user && <section className="rbac-card">
                <div className="rbac-section-heading">
                    <div>
                        <h2>Users</h2>
                        <p>Select a User to assign Roles and review their effective Permissions.</p>
                    </div>
                </div>

                {usersQuery.isLoading && <RbacLoading language="en" />}
                {usersQuery.isError && <RbacError error={usersQuery.error} action="load Users" language="en" />}
                {usersQuery.data?.length === 0 && <RbacEmpty>No Users found.</RbacEmpty>}
                {usersQuery.data && usersQuery.data.length > 0 && (
                    <div className="rbac-user-list">
                        {usersQuery.data.map((item) => (
                            <button
                                type="button"
                                className="rbac-user-row"
                                key={item.id}
                                onClick={() => editUser(item.id)}
                                aria-label={`Edit access for ${item.displayName || item.username}`}
                            >
                                <div className="rbac-role-copy">
                                    <strong>{item.displayName || item.username}</strong>
                                    <p>{item.email} · {item.roles.join(", ") || item.role || "No Role"}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </section>}

            {user && (
                <section className="rbac-card rbac-user-editor-card">
                    <div className="rbac-user-editor-sticky">
                        <div className="rbac-user-editor-header">
                            <button
                                type="button"
                                className="rbac-user-editor-back"
                                aria-label="Back to Users"
                                title="Back"
                                onClick={() => setEditingUserId(null)}
                            >←</button>
                            <span className="rbac-user-editor-divider" aria-hidden="true" />
                            <h2>Edit Access</h2>
                            <span className="rbac-user-editor-divider" aria-hidden="true" />
                            <p>{user.displayName || user.username} · {user.email}</p>
                            {effectivePermissions.length > 0 && (
                                <label className="rbac-effective-permissions-search">
                                    <span className="sr-only">Search Permissions or granting Roles</span>
                                    <input
                                        type="search"
                                        value={permissionSearch}
                                        onChange={(event) => setPermissionSearch(event.target.value)}
                                        placeholder="Search Permissions or granting Roles…"
                                    />
                                </label>
                            )}
                        </div>
                    </div>
                    <div className="rbac-user-edit-grid">
                        <section>
                            {rolesQuery.isLoading && <RbacLoading language="en" />}
                            {rolesQuery.isError && <RbacError error={rolesQuery.error} action="load Roles" language="en" />}
                            {rolesQuery.data?.length === 0 && <RbacEmpty>No Roles are available to assign.</RbacEmpty>}
                            {userRolesQuery.isLoading && <RbacLoading language="en" />}
                            {userRolesQuery.isError && <RbacError error={userRolesQuery.error} action="load this User's Roles" language="en" />}
                            {rolesQuery.data && rolesQuery.data.length > 0 && !userRolesQuery.isLoading && !userRolesQuery.isError && (
                                <div className="rbac-user-table-wrap">
                                    <table className="rbac-user-table rbac-user-roles-table">
                                        <thead><tr>
                                            <th scope="col">
                                                <div className="rbac-role-table-heading">
                                                    <span>Role</span>
                                                    {dirty && <button
                                                        type="button"
                                                        className="rbac-role-reset-icon"
                                aria-label="Reset Role selection"
                                title="Reset Role selection"
                                                        disabled={saveMutation.isPending}
                                                        onClick={() => {
                                                            setSelectedRoleIds(savedIds);
                                                            setSaveError(null);
                                                            setLastAdminError(false);
                                                        }}
                                                    >↶</button>}
                                                </div>
                                            </th>
                                            <th scope="col">Description</th>
                                        </tr></thead>
                                        <tbody>
                                            {rolesQuery.data.map((role) => (
                                                <tr key={role.id}>
                                                    <td>
                                                        <label className="rbac-role-check">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedRoleIds.includes(role.id)}
                                                                onChange={(event) => setSelectedRoleIds((current) => event.target.checked
                                                                    ? [...new Set([...current, role.id])]
                                                                    : current.filter((id) => id !== role.id))}
                                                            />
                                                            <strong>{role.name}</strong>
                                                        </label>
                                                    </td>
                                                    <td>{role.description || "—"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>

                        <section>
                            {userRolesQuery.isLoading && <RbacLoading language="en" />}
                            {userRolesQuery.isError && <RbacError error={userRolesQuery.error} action="load this User's Roles" language="en" />}
                            {!rolesQuery.isLoading && !rolesQuery.isError && !userRolesQuery.isLoading && selectedRoles.length === 0 && <RbacEmpty>This User will have no Roles or Permissions after saving.</RbacEmpty>}
                            {rolePermissionQueries.map((query, index) => query.isLoading && <RbacLoading key={selectedRoles[index]?.id ?? index} language="en" />)}
                            {rolePermissionQueries.map((query, index) => query.isError && <RbacError key={selectedRoles[index]?.id ?? index} error={query.error} action={`load Permissions for ${selectedRoles[index]?.name ?? "Role"}`} language="en" />)}
                            {selectedRoles.length > 0 && !rolePermissionQueries.some((query) => query.isLoading || query.isError) && effectivePermissions.length === 0 && <RbacEmpty>The selected Roles have no Permissions.</RbacEmpty>}
                            {effectivePermissions.length > 0 && (
                                <>
                                    {effectivePermissionGroups.length === 0 ? (
                                        <RbacEmpty>No matching Permissions found.</RbacEmpty>
                                    ) : (
                                        <div className="rbac-user-table-wrap rbac-effective-permissions-scroll">
                                            <table className="rbac-user-table rbac-effective-permissions-table">
                                                <thead><tr><th scope="col">Permission</th><th scope="col">Granted by</th></tr></thead>
                                                <tbody>
                                                    {effectivePermissionGroups.map(([groupName, permissions]) => (
                                                        <Fragment key={groupName}>
                                                            <tr className="rbac-effective-permissions-group">
                                                                <th scope="rowgroup" colSpan={2}>{groupName}</th>
                                                            </tr>
                                                            {permissions.map(({ permission, roles }) => (
                                                                <tr key={permission.id}>
                                                                    <td>{permission.description || permission.code}</td>
                                                                    <td><div className="rbac-role-source-list">{roles.map((roleName) => <span key={roleName}>{roleName}</span>)}</div></td>
                                                                </tr>
                                                            ))}
                                                        </Fragment>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            )}
                        </section>
                    </div>

                    {lastAdminError && <p className="rbac-inline-error" role="alert">Cannot remove RBAC management Permissions from the last administrator.</p>}
                    {saveError && !lastAdminError && <p className="rbac-inline-error" role="alert">{saveError}</p>}
                    <div className="rbac-footer-actions rbac-user-save-actions">
                        <button
                            type="button"
                            className="rbac-primary-button"
                            disabled={!dirty || saveMutation.isPending || rolesQuery.isLoading || rolesQuery.isError || userRolesQuery.isLoading || userRolesQuery.isError}
                            onClick={() => saveMutation.mutate()}
                        >{saveMutation.isPending ? "Saving…" : "Save changes"}</button>
                        <span>{selectedRoleIds.length} Roles selected</span>
                    </div>
                </section>
            )}
        </div>
    );
}
