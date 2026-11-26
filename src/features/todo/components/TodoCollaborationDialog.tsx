import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../../constants/queryKeys.js";
import { rbacService } from "../../../services/api/rbacService.js";
import { todoService } from "../../../services/api/todoService.js";
import { ApiError } from "../../../services/api/apiError.js";
import { useAppSelector } from "../../../stores/hook.js";
import type { TodoDto } from "../types.js";

export type TodoCollaborationDialogState = {
    mode: "share" | "notes";
    todo: TodoDto;
    sharedContext: boolean;
};

interface TodoCollaborationDialogProps {
    dialog: TodoCollaborationDialogState | null;
    canCreateNotes: boolean;
    onClose: () => void;
    onSharedAccessLost: () => void;
}

export default function TodoCollaborationDialog({
    dialog,
    canCreateNotes,
    onClose,
    onSharedAccessLost,
}: TodoCollaborationDialogProps) {
    const queryClient = useQueryClient();
    const currentUser = useAppSelector((state) => state.auth.user);
    const [search, setSearch] = useState("");
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [content, setContent] = useState("");
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const handledAccessError = useRef<unknown>(null);
    const todoId = dialog?.todo.id;
    const isShareDialog = dialog?.mode === "share";

    const sharesQuery = useQuery({
        queryKey: todoId === undefined ? ["todos", "shares", "none"] : QUERY_KEYS.todoShares(todoId),
        queryFn: () => todoService.getShares(todoId!),
        enabled: isShareDialog && todoId !== undefined,
        retry: false,
    });
    const usersQuery = useQuery({
        queryKey: QUERY_KEYS.users,
        queryFn: rbacService.getUsers,
        enabled: isShareDialog,
        retry: false,
    });
    const notesQuery = useQuery({
        queryKey: todoId === undefined ? ["todos", "notes", "none"] : QUERY_KEYS.todoNotes(todoId),
        queryFn: () => todoService.getNotes(todoId!),
        enabled: !isShareDialog && todoId !== undefined,
        retry: false,
    });

    useEffect(() => {
        setSearch("");
        setContent("");
        setSuccessMessage(null);
        setSelectedUserIds([]);
    }, [dialog?.mode, todoId]);

    useEffect(() => {
        if (sharesQuery.data) {
            setSelectedUserIds(sharesQuery.data.map((share) => share.sharedWithUserId));
        }
    }, [sharesQuery.data, todoId]);

    const recipients = useMemo(() => (usersQuery.data ?? [])
        .filter((user) => user.id !== currentUser?.id)
        .filter((user) => {
            const value = `${user.displayName ?? ""} ${user.username} ${user.email}`.toLocaleLowerCase();
            return value.includes(search.trim().toLocaleLowerCase());
        })
        .sort((left, right) => (left.displayName || left.username).localeCompare(right.displayName || right.username)),
    [currentUser?.id, search, usersQuery.data]);

    const savedUserIds = (sharesQuery.data ?? []).map((share) => share.sharedWithUserId).sort((a, b) => a - b);
    const selectedSortedIds = [...selectedUserIds].sort((a, b) => a - b);
    const sharesChanged = savedUserIds.join(",") !== selectedSortedIds.join(",");

    const replaceSharesMutation = useMutation({
        mutationFn: () => todoService.replaceShares(todoId!, selectedUserIds),
        onSuccess: async () => {
            setSuccessMessage("Danh sách người được chia sẻ đã được cập nhật.");
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todoShares(todoId!) });
        },
    });

    const createNoteMutation = useMutation({
        mutationFn: () => todoService.createNote(todoId!, content.trim()),
        onSuccess: async () => {
            setContent("");
            setSuccessMessage("Ghi chú đã được thêm.");
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todoNotes(todoId!) });
        },
    });

    useEffect(() => {
        const error = notesQuery.error ?? createNoteMutation.error;
        if (dialog?.sharedContext && error instanceof ApiError
            && (error.status === 403 || error.status === 404)
            && handledAccessError.current !== error) {
            handledAccessError.current = error;
            onSharedAccessLost();
        }
    }, [createNoteMutation.error, dialog?.sharedContext, notesQuery.error, onSharedAccessLost]);

    if (!dialog) return null;

    const noteError = notesQuery.error ?? createNoteMutation.error;
    const shareError = sharesQuery.error ?? usersQuery.error ?? replaceSharesMutation.error;
    const isPending = replaceSharesMutation.isPending || createNoteMutation.isPending;
    const canSubmitNote = content.trim().length > 0 && content.length <= 2000 && !isPending;

    function toggleRecipient(userId: number) {
        setSelectedUserIds((current) => current.includes(userId)
            ? current.filter((id) => id !== userId)
            : [...current, userId]);
        setSuccessMessage(null);
    }

    return (
        <div className="modal-backdrop todo-dialog-backdrop" role="presentation" onClick={() => !isPending && onClose()}>
            <section
                className="modal-panel todo-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="todo-collaboration-title"
                style={{ maxHeight: "85vh", overflow: "auto" }}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="todo-dialog-copy">
                    <h2 id="todo-collaboration-title">{isShareDialog ? "Chia sẻ Todo" : "Ghi chú Todo"}</h2>
                    <p>{dialog.todo.title}</p>
                    {!isShareDialog && <p>Todo của: {dialog.todo.ownerDisplayName || "Không rõ"}</p>}
                </div>

                {isShareDialog ? <>
                    <label className="todo-dialog-copy" style={{ gap: 6 }}>
                        <span>Tìm người dùng</span>
                        <input
                            value={search}
                            placeholder="Tên, username hoặc email"
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </label>

                    {sharesQuery.isLoading || usersQuery.isLoading ? <p>Đang tải người dùng…</p> : null}
                    {shareError && <p className="todo-dialog-error" role="alert">{getErrorMessage(shareError, "Không thể tải danh sách chia sẻ.")}</p>}
                    {!shareError && !sharesQuery.isLoading && !usersQuery.isLoading && recipients.length === 0 && (
                        <p className="empty-state-desc">Không tìm thấy người dùng phù hợp.</p>
                    )}
                    {!shareError && !sharesQuery.isLoading && !usersQuery.isLoading && recipients.length > 0 && (
                        <div style={{ display: "grid", gap: 4, maxHeight: 300, overflowY: "auto" }}>
                            {recipients.map((user) => (
                                <label key={user.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 2px" }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedUserIds.includes(user.id)}
                                        onChange={() => toggleRecipient(user.id)}
                                    />
                                    <span>{user.displayName || user.username} <small>· {user.email}</small></span>
                                </label>
                            ))}
                        </div>
                    )}
                    <p className="empty-state-desc">{selectedUserIds.length} người được chọn. Lưu danh sách rỗng sẽ thu hồi toàn bộ chia sẻ.</p>
                    {successMessage && <p role="status">{successMessage}</p>}
                    <div className="todo-dialog-actions">
                        <button type="button" className="ghost-btn" disabled={isPending} onClick={onClose}>Đóng</button>
                        <button
                            type="button"
                            disabled={!sharesChanged || isPending || sharesQuery.isLoading || sharesQuery.isError || usersQuery.isLoading || usersQuery.isError}
                            onClick={() => replaceSharesMutation.mutate()}
                        >{replaceSharesMutation.isPending ? "Đang lưu…" : "Lưu người nhận"}</button>
                    </div>
                </> : <>
                    {notesQuery.isLoading && <p>Đang tải ghi chú…</p>}
                    {noteError && <p className="todo-dialog-error" role="alert">{getErrorMessage(noteError, "Không thể tải ghi chú.")}</p>}
                    {!notesQuery.isLoading && !notesQuery.isError && (notesQuery.data?.length ?? 0) === 0 && (
                        <p className="empty-state-desc">Chưa có ghi chú nào.</p>
                    )}
                    {(notesQuery.data?.length ?? 0) > 0 && <div className="todo-activity-log">
                        {notesQuery.data?.map((note) => (
                            <div key={note.id}>
                                <span>{note.displayName || (note.userId === currentUser?.id
                                    ? currentUser.displayName || currentUser.username
                                    : `User #${note.userId}`)}</span>
                                <p>{note.content}</p>
                                <small>{new Date(note.createdAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</small>
                            </div>
                        ))}
                    </div>}
                    {canCreateNotes && <label className="todo-dialog-copy" style={{ gap: 6 }}>
                        <span>Thêm ghi chú</span>
                        <textarea
                            value={content}
                            maxLength={2000}
                            rows={4}
                            onChange={(event) => {
                                setContent(event.target.value);
                                setSuccessMessage(null);
                            }}
                        />
                        <small>{content.length}/2000</small>
                    </label>}
                    {content.length > 0 && !content.trim() && <p className="todo-dialog-error" role="alert">Ghi chú không được chỉ chứa khoảng trắng.</p>}
                    {successMessage && <p role="status">{successMessage}</p>}
                    <div className="todo-dialog-actions">
                        <button type="button" className="ghost-btn" disabled={isPending} onClick={onClose}>Đóng</button>
                        {canCreateNotes && <button
                            type="button"
                            disabled={!canSubmitNote || notesQuery.isLoading || notesQuery.isError}
                            onClick={() => createNoteMutation.mutate()}
                        >{createNoteMutation.isPending ? "Đang gửi…" : "Thêm ghi chú"}</button>}
                    </div>
                </>}
            </section>
        </div>
    );
}

function getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof ApiError) {
        if (error.status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
        if (error.status === 403) return "Bạn không có quyền thực hiện thao tác này. Nếu không tải được người nhận, có thể cần quyền users.read.";
        if (error.status === 404) return "Todo không còn tồn tại hoặc quyền truy cập đã bị thu hồi.";
        return error.message || fallback;
    }
    return error instanceof Error ? error.message : fallback;
}
