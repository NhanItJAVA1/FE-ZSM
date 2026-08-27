import type { FormEvent } from "react";
import type { TodoCategoryDto, TodoDto } from "../types.js";
import type { TodoDialogState } from "../todoPageUtils.js";

interface TodoDialogProps {
    deleteCategoryPending: boolean;
    deleteTodoPending: boolean;
    dialog: TodoDialogState;
    renameCategoryName: string;
    updateCategoryPending: boolean;
    onCancel: () => void;
    onConfirmDeleteCategory: (category: TodoCategoryDto, deleteTodos: boolean) => void;
    onConfirmDeleteTodo: (todo: TodoDto) => void;
    onConfirmDeleteTodos?: (todos: TodoDto[]) => void;
    onConfirmRenameCategory: (event: FormEvent<HTMLFormElement>) => void;
    onRenameCategoryNameChange: (value: string) => void;
}

function TrashIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M4 7h16" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M6 7l1 14h10l1-14" />
            <path d="M9 7V4h6v3" />
        </svg>
    );
}

export default function TodoDialog({
    deleteCategoryPending,
    deleteTodoPending,
    dialog,
    renameCategoryName,
    updateCategoryPending,
    onCancel,
    onConfirmDeleteCategory,
    onConfirmDeleteTodo,
    onConfirmDeleteTodos,
    onConfirmRenameCategory,
    onRenameCategoryNameChange,
}: TodoDialogProps) {
    if (!dialog) return null;

    return (
        <div
            className="modal-backdrop todo-dialog-backdrop"
            role="presentation"
            onClick={onCancel}
        >
            <section
                className="modal-panel todo-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="todo-dialog-title"
                onClick={(event) => event.stopPropagation()}
            >
                {dialog.type === "deleteTodo" && (
                    <>
                        <div className="todo-dialog-mark todo-dialog-mark--danger">
                            <TrashIcon />
                        </div>
                        <div className="todo-dialog-copy">
                            {/* <p className="eyebrow">Delete task</p> */}
                            <p>
                                Task "{dialog.todo.title}" sẽ bị xóa khỏi danh sách và timeline.
                            </p>
                        </div>
                        <div className="todo-dialog-actions">
                            <button type="button" className="ghost-btn" onClick={onCancel}>
                                Hủy
                            </button>
                            <button
                                type="button"
                                className="todo-danger-btn"
                                disabled={deleteTodoPending}
                                onClick={() => onConfirmDeleteTodo(dialog.todo)}
                            >
                                Xóa task
                            </button>
                        </div>
                    </>
                )}

                {dialog.type === "deleteTodos" && (
                    <>
                        <div className="todo-dialog-mark todo-dialog-mark--danger">
                            <TrashIcon />
                        </div>
                        <div className="todo-dialog-copy">
                            <p>
                                {dialog.todos.length} task đã chọn sẽ bị xóa khỏi danh sách và timeline.
                            </p>
                        </div>
                        <div className="todo-dialog-actions">
                            <button type="button" className="ghost-btn" onClick={onCancel}>
                                Hủy
                            </button>
                            <button
                                type="button"
                                className="todo-danger-btn"
                                disabled={deleteTodoPending}
                                onClick={() => onConfirmDeleteTodos?.(dialog.todos)}
                            >
                                Xóa task
                            </button>
                        </div>
                    </>
                )}

                {dialog.type === "deleteCategory" && (
                    <>
                        <div className="todo-dialog-mark todo-dialog-mark--danger">
                            <TrashIcon />
                        </div>
                        <div className="todo-dialog-copy">
                            <p className="eyebrow">Delete category</p>
                            {/* <h2 id="todo-dialog-title">Xóa category "{dialog.category.name}"?</h2> */}
                            <p>
                                Bạn có thể giữ lại các task và bỏ category, hoặc xóa luôn các task trong category này.
                            </p>
                        </div>
                        <div className="todo-dialog-actions todo-dialog-actions--stacked">
                            <button type="button" className="ghost-btn" onClick={onCancel}>
                                Hủy
                            </button>
                            <button
                                type="button"
                                className="ghost-btn"
                                disabled={deleteCategoryPending}
                                onClick={() => onConfirmDeleteCategory(dialog.category, false)}
                            >
                                Giữ task
                            </button>
                            <button
                                type="button"
                                className="todo-danger-btn"
                                disabled={deleteCategoryPending}
                                onClick={() => onConfirmDeleteCategory(dialog.category, true)}
                            >
                                Xóa cả task
                            </button>
                        </div>
                    </>
                )}

                {dialog.type === "renameCategory" && (
                    <form className="todo-dialog-form" onSubmit={onConfirmRenameCategory}>
                        <div className="todo-dialog-mark">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                        </div>
                        <div className="todo-dialog-copy">
                            <p className="eyebrow">Rename category</p>
                            <h2 id="todo-dialog-title">Đổi tên category</h2>
                            <label>
                                Tên mới
                                <input
                                    value={renameCategoryName}
                                    autoFocus
                                    onChange={(event) =>
                                        onRenameCategoryNameChange(event.target.value)
                                    }
                                />
                            </label>
                        </div>
                        <div className="todo-dialog-actions">
                            <button type="button" className="ghost-btn" onClick={onCancel}>
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={
                                    updateCategoryPending ||
                                    !renameCategoryName.trim() ||
                                    renameCategoryName.trim() === dialog.category.name
                                }
                            >
                                Lưu tên
                            </button>
                        </div>
                    </form>
                )}
            </section>
        </div>
    );
}
