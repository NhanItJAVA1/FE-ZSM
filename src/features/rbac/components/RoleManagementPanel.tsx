import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../constants/queryKeys.js";
import { rbacService } from "../../../services/api/rbacService.js";
import { getApiErrorMessage } from "../apiErrors.js";
import type { RoleDto, SaveRoleDto } from "../types.js";
import { RbacEmpty, RbacError, RbacLoading } from "./RbacStates.js";

function isProtectedRole(role: RoleDto) {
    return role.id === 1 || role.id === 2 || ["user", "admin"].includes(role.name.trim().toLowerCase());
}

export default function RoleManagementPanel() {
    const queryClient = useQueryClient();
    const rolesQuery = useQuery({ queryKey: QUERY_KEYS.rbacRoles, queryFn: rbacService.getRoles });
    const [editing, setEditing] = useState<RoleDto | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [formError, setFormError] = useState<string | null>(null);

    const refreshRoles = () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rbacRoles });
    const saveMutation = useMutation({
        mutationFn: (payload: SaveRoleDto) => editing
            ? rbacService.updateRole(editing.id, payload)
            : rbacService.createRole(payload),
        onSuccess: () => {
            setEditing(null);
            setName("");
            setDescription("");
            setFormError(null);
            void refreshRoles();
        },
        onError: (error) => setFormError(getApiErrorMessage(error, "lưu Role")),
    });
    const deleteMutation = useMutation({
        mutationFn: rbacService.deleteRole,
        onSuccess: () => void refreshRoles(),
        onError: (error) => setFormError(getApiErrorMessage(error, "xóa Role")),
    });

    function resetForm() {
        setEditing(null);
        setName("");
        setDescription("");
        setFormError(null);
    }

    function beginEdit(role: RoleDto) {
        setEditing(role);
        setName(role.name);
        setDescription(role.description);
        setFormError(null);
    }

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError(null);
        saveMutation.mutate({ name: name.trim(), description: description.trim() });
    }

    return (
        <div className="rbac-panel-grid">
            <section className="rbac-card">
                <div className="rbac-section-heading">
                    <div>
                        <h2>Roles</h2>
                        <p>Tạo vai trò và quản lý tên, mô tả.</p>
                    </div>
                    <button type="button" className="ghost-btn" onClick={() => void rolesQuery.refetch()}>Làm mới</button>
                </div>
                {rolesQuery.isLoading && <RbacLoading />}
                {rolesQuery.isError && <RbacError error={rolesQuery.error} action="tải Roles" />}
                {rolesQuery.data && rolesQuery.data.length === 0 && <RbacEmpty>Chưa có Role nào.</RbacEmpty>}
                {rolesQuery.data && rolesQuery.data.length > 0 && (
                    <div className="rbac-role-list">
                        {rolesQuery.data.map((role) => {
                            const protectedRole = isProtectedRole(role);
                            return (
                                <article className="rbac-role-row" key={role.id}>
                                    <div className="rbac-role-copy">
                                        <div className="rbac-role-title">
                                            <strong>{role.name}</strong>
                                            {protectedRole && <span className="rbac-badge">Mặc định · khóa</span>}
                                        </div>
                                        <p>{role.description || "Chưa có mô tả"}</p>
                                    </div>
                                    <div className="rbac-row-actions">
                                        <button type="button" className="ghost-btn" disabled={protectedRole} onClick={() => beginEdit(role)}>Đổi tên</button>
                                        <button
                                            type="button"
                                            className="ghost-btn danger"
                                            disabled={protectedRole || deleteMutation.isPending}
                                            onClick={() => {
                                                if (window.confirm(`Xóa Role “${role.name}”? Thao tác này không thể hoàn tác.`)) {
                                                    setFormError(null);
                                                    deleteMutation.mutate(role.id);
                                                }
                                            }}
                                        >Xóa</button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            <section className="rbac-card rbac-form-card">
                <div className="rbac-section-heading">
                    <div>
                        <h2>{editing ? `Sửa ${editing.name}` : "Tạo Role"}</h2>
                        <p>Role mới bắt đầu với 0 permission.</p>
                    </div>
                </div>
                <form className="rbac-form" onSubmit={submit}>
                    <label>
                        Tên Role
                        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={50} required />
                    </label>
                    <label>
                        Mô tả
                        <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={4} />
                    </label>
                    {formError && <p className="rbac-inline-error" role="alert">{formError}</p>}
                    <div className="rbac-row-actions">
                        {editing && <button type="button" className="ghost-btn" onClick={resetForm}>Hủy</button>}
                        <button type="submit" className="rbac-primary-button" disabled={saveMutation.isPending || !name.trim()}>
                            {saveMutation.isPending ? "Đang lưu…" : editing ? "Lưu thay đổi" : "Tạo Role"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
