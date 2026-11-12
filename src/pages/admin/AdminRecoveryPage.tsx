import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AppLayout from "../../layouts/AppLayout.js";
import PageHeading from "../../layouts/PageHeading.js";
import { QUERY_KEYS } from "../../constants/queryKeys.js";
import { adminRecoveryService } from "../../services/api/adminRecoveryService.js";
import { ApiError } from "../../services/api/apiError.js";
import { useAppSelector } from "../../stores/hook.js";
import type { AdminRecoveryUser } from "../../features/adminRecovery/types.js";
import { RbacToast, type RbacToastNotice } from "../../features/rbac/components/RbacStates.js";

const PAGE_SIZE = 20;
const RECOVERY_PERMISSIONS = ["roles.manage-permissions", "users.manage-roles"] as const;

function getRecoveryErrorMessage(error: unknown) {
    if (!(error instanceof ApiError)) {
        return error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định.";
    }

    switch (error.status) {
        case 400:
            return error.message || "Lý do khôi phục không hợp lệ.";
        case 401:
            return "Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại.";
        case 403:
            return "Tài khoản hiện tại không có quyền System Owner để thực hiện khôi phục.";
        case 404:
            return "Không tìm thấy tài khoản cần khôi phục.";
        case 409:
            return error.message || "Có xung đột khi khôi phục quyền truy cập. Hãy tải lại dữ liệu rồi thử lại.";
        default:
            return error.status === 0
                ? "Không kết nối được máy chủ. Hãy kiểm tra kết nối rồi thử lại."
                : error.message || "Máy chủ gặp lỗi. Hãy thử lại sau.";
    }
}

export default function AdminRecoveryPage() {
    const queryClient = useQueryClient();
    const ownerUserId = useAppSelector((state) => state.auth.user?.id);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState<AdminRecoveryUser | null>(null);
    const [reason, setReason] = useState("");
    const [reasonTouched, setReasonTouched] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [toast, setToast] = useState<RbacToastNotice | null>(null);
    const requestLock = useRef(false);
    const dismissToast = useCallback(() => setToast(null), []);

    const trimmedSearch = search.trim();
    const isDebouncing = trimmedSearch !== debouncedSearch;

    useEffect(() => {
        const timeoutId = window.setTimeout(() => setDebouncedSearch(trimmedSearch), 350);
        return () => window.clearTimeout(timeoutId);
    }, [trimmedSearch]);

    const usersQuery = useQuery({
        queryKey: QUERY_KEYS.adminRecoveryUsers(debouncedSearch, page, PAGE_SIZE),
        queryFn: () => adminRecoveryService.searchRecoveryUsers({
            search: debouncedSearch,
            page,
            pageSize: PAGE_SIZE,
        }),
        enabled: Boolean(debouncedSearch),
        retry: false,
    });

    const restoreMutation = useMutation({
        mutationFn: ({ userId, recoveryReason }: { userId: number; recoveryReason: string }) =>
            adminRecoveryService.restoreAdminAccess(userId, recoveryReason),
        retry: false,
        onSuccess: async () => {
            setConfirmOpen(false);
            setSelectedUser(null);
            setReason("");
            setReasonTouched(false);
            setToast({ id: Date.now(), message: "Đã khôi phục quyền truy cập Admin cho User.", type: "success" });
            await queryClient.invalidateQueries({ queryKey: ["rbac"] });
        },
    });

    const reasonError = reason.trim().length === 0
        ? "Nhập lý do hoặc mã tham chiếu phê duyệt."
        : reason.trim().length > 1000
            ? "Lý do không được vượt quá 1000 ký tự."
            : null;
    const resultUsers = (usersQuery.data?.items ?? []).filter((user) => user.id !== ownerUserId);

    function selectUser(user: AdminRecoveryUser) {
        if (selectedUser?.id !== user.id) {
            setReason("");
            setReasonTouched(false);
        }
        setSelectedUser(user);
        restoreMutation.reset();
    }

    function clearSelectedUser() {
        setSelectedUser(null);
        setReason("");
        setReasonTouched(false);
        restoreMutation.reset();
    }

    function openConfirmation() {
        setReasonTouched(true);
        if (!selectedUser || reasonError) return;
        restoreMutation.reset();
        setConfirmOpen(true);
    }

    async function confirmRestore() {
        if (!selectedUser || reasonError || requestLock.current || restoreMutation.isPending) return;
        requestLock.current = true;
        try {
            await restoreMutation.mutateAsync({
                userId: selectedUser.id,
                recoveryReason: reason.trim(),
            });
        } catch {
            // The mutation state below displays the mapped API error without exposing response data.
        } finally {
            requestLock.current = false;
        }
    }

    return (
        <AppLayout>
            <main className="admin-recovery-page">
                <PageHeading
                    eyebrow="System Owner"
                    title="Admin Recovery"
                    description="Restore administrative access to an approved user account."
                />

                <div className="admin-recovery-grid">
                    <section className="rbac-card admin-recovery-search-card">
                        <div className="rbac-section-heading">
                            <div>
                                <h2>Search account</h2>
                                <p>Search by name, email, or User ID.</p>
                            </div>
                        </div>

                        <label className="admin-recovery-search-label">
                            User name, email, or ID
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    setPage(1);
                                }}
                                placeholder="Enter a name, email, or User ID"
                                autoComplete="off"
                            />
                        </label>

                        {!trimmedSearch && <p className="rbac-state">Enter a search term to find an account.</p>}
                        {trimmedSearch && isDebouncing && <p className="rbac-state" role="status">Searching…</p>}
                        {!isDebouncing && usersQuery.isLoading && <p className="rbac-state" role="status">Searching accounts…</p>}
                        {!isDebouncing && usersQuery.isError && (
                            <div className="rbac-error" role="alert">
                                <strong>Could not search accounts</strong>
                                <p>{getRecoveryErrorMessage(usersQuery.error)}</p>
                                <button type="button" className="ghost-btn" onClick={() => void usersQuery.refetch()}>Retry</button>
                            </div>
                        )}
                        {!isDebouncing && usersQuery.isSuccess && resultUsers.length === 0 && (
                            <p className="rbac-state">No matching accounts. The current System Owner account is excluded.</p>
                        )}

                        {!isDebouncing && usersQuery.isSuccess && resultUsers.length > 0 && (
                            <>
                                <div className="admin-recovery-results" role="list" aria-label="Search results">
                                    {resultUsers.map((user) => (
                                        <button
                                            type="button"
                                            role="listitem"
                                            className={`admin-recovery-user-row${selectedUser?.id === user.id ? " is-selected" : ""}`}
                                            key={user.id}
                                            onClick={() => selectUser(user)}
                                        >
                                            <span>
                                                <strong>{user.displayName}</strong>
                                                <small>{user.email}</small>
                                            </span>
                                            <small>User ID: {user.id}</small>
                                        </button>
                                    ))}
                                </div>
                                <div className="admin-recovery-pagination">
                                    <button
                                        type="button"
                                        className="ghost-btn"
                                        disabled={page <= 1 || usersQuery.isFetching}
                                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                                    >Previous</button>
                                    <span>Page {usersQuery.data.page} of {Math.max(1, usersQuery.data.totalPages)}</span>
                                    <button
                                        type="button"
                                        className="ghost-btn"
                                        disabled={page >= usersQuery.data.totalPages || usersQuery.isFetching}
                                        onClick={() => setPage((current) => current + 1)}
                                    >Next</button>
                                </div>
                            </>
                        )}
                    </section>

                    <div className="admin-recovery-side-column">
                        <section className="rbac-card">
                            <div className="rbac-section-heading">
                                <div>
                                    <h2>Selected account</h2>
                                    <p>Verify the account before restoring access.</p>
                                </div>
                            </div>
                            {selectedUser ? (
                                <div className="admin-recovery-selected-user">
                                    <div><span>Display name</span><strong>{selectedUser.displayName}</strong></div>
                                    <div><span>Email</span><strong>{selectedUser.email}</strong></div>
                                    <div><span>User ID</span><strong>{selectedUser.id}</strong></div>
                                    <button type="button" className="rbac-link-button" onClick={clearSelectedUser}>Choose another account</button>
                                </div>
                            ) : (
                                <p className="rbac-state">Select an account from the search results.</p>
                            )}
                        </section>

                        <section className="rbac-card">
                            <div className="rbac-section-heading">
                                <div>
                                    <h2>Recovery reason / approval reference</h2>
                                    <p>Required for the recovery audit record.</p>
                                </div>
                            </div>
                            <label className="admin-recovery-reason-label">
                                Recovery Reason / Approval Reference
                                <textarea
                                    value={reason}
                                    onChange={(event) => setReason(event.target.value)}
                                    onBlur={() => setReasonTouched(true)}
                                    maxLength={1000}
                                    rows={3}
                                    placeholder="Approved by IT Manager - INC-2026-001"
                                    aria-required="true"
                                    aria-invalid={reasonTouched && Boolean(reasonError)}
                                />
                            </label>
                            {reasonTouched && reasonError && <p className="rbac-inline-error" role="alert">{reasonError}</p>}
                            <p className="admin-recovery-character-count">{reason.length}/1000</p>
                        </section>

                        <section className="rbac-card">
                            <div className="rbac-section-heading">
                                <div>
                                    <h2>Recovery permissions</h2>
                                    <p>These permissions are restored together as a protected recovery role.</p>
                                </div>
                            </div>
                            <ul className="admin-recovery-permissions">
                                {RECOVERY_PERMISSIONS.map((permission) => <li key={permission}><code>{permission}</code></li>)}
                            </ul>
                            <p className="admin-recovery-assignments-note">Existing Role assignments will remain unchanged.</p>
                        </section>

                        <button
                            type="button"
                            className="rbac-primary-button admin-recovery-submit"
                            disabled={!selectedUser || Boolean(reasonError) || restoreMutation.isPending}
                            onClick={openConfirmation}
                        >Restore Admin Access</button>
                    </div>
                </div>
            </main>

            {confirmOpen && selectedUser && (
                <div className="modal-backdrop todo-dialog-backdrop" role="presentation" onClick={() => !restoreMutation.isPending && setConfirmOpen(false)}>
                    <section
                        className="modal-panel todo-dialog admin-recovery-confirm-dialog"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="admin-recovery-confirm-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="todo-dialog-copy">
                            <p className="eyebrow">System Owner confirmation</p>
                            <h2 id="admin-recovery-confirm-title">Restore Admin Access?</h2>
                            <p>Confirm this recovery for the selected account.</p>
                        </div>
                        <dl className="admin-recovery-confirm-details">
                            <div><dt>Target User</dt><dd>{selectedUser.displayName}</dd></div>
                            <div><dt>Email</dt><dd>{selectedUser.email}</dd></div>
                            <div><dt>User ID</dt><dd>{selectedUser.id}</dd></div>
                            <div><dt>Reason</dt><dd>{reason.trim()}</dd></div>
                            <div><dt>Permissions</dt><dd>{RECOVERY_PERMISSIONS.join(", ")}</dd></div>
                        </dl>
                        {restoreMutation.isError && <div className="rbac-error" role="alert">{getRecoveryErrorMessage(restoreMutation.error)}</div>}
                        <div className="todo-dialog-actions">
                            <button type="button" className="ghost-btn" disabled={restoreMutation.isPending} onClick={() => setConfirmOpen(false)}>Cancel</button>
                            <button type="button" className="rbac-primary-button" disabled={restoreMutation.isPending} onClick={() => void confirmRestore()}>
                                {restoreMutation.isPending ? "Restoring…" : "Confirm restore"}
                            </button>
                        </div>
                    </section>
                </div>
            )}

            <RbacToast notice={toast} onDismiss={dismissToast} />
        </AppLayout>
    );
}
