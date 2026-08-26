import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { TodoCategoryDto, TodoPriority } from "../types.js";
import {
    emptyForm,
    PRIORITIES,
    type TodoFormState,
} from "../todoPageUtils.js";

export interface TodoBulkDraft extends TodoFormState {
    id: string;
}

interface TodoBulkCreateModalProps {
    categories: TodoCategoryDto[];
    drafts: TodoBulkDraft[];
    error: string | null;
    saving: boolean;
    onAddRow: () => void;
    onCancel: () => void;
    onRemoveRow: (id: string) => void;
    onSetDrafts: Dispatch<SetStateAction<TodoBulkDraft[]>>;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function createTodoBulkDraft(): TodoBulkDraft {
    return {
        ...emptyForm,
        id: crypto.randomUUID(),
    };
}

export default function TodoBulkCreateModal({
    categories,
    drafts,
    error,
    saving,
    onAddRow,
    onCancel,
    onRemoveRow,
    onSetDrafts,
    onSubmit,
}: TodoBulkCreateModalProps) {
    function updateDraft(id: string, patch: Partial<TodoFormState>) {
        onSetDrafts((current) =>
            current.map((draft) =>
                draft.id === id ? { ...draft, ...patch } : draft
            )
        );
    }

    return (
        <div className="modal-backdrop todo-dialog-backdrop" role="presentation">
            <form
                className="modal-panel todo-bulk-modal"
                onSubmit={onSubmit}
                role="dialog"
                aria-modal="true"
                aria-labelledby="todo-bulk-title"
            >
                <div className="todo-bulk-header">
                    <div>
                        <p className="eyebrow">Bulk create</p>
                        <h2 id="todo-bulk-title">Create todos</h2>
                    </div>
                    <button type="button" className="ghost-btn" onClick={onCancel}>
                        Close
                    </button>
                </div>

                <div className="todo-bulk-table-wrap">
                    <table className="todo-bulk-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Description</th>
                                <th>Priority</th>
                                <th>Due date</th>
                                <th>Category</th>
                                <th aria-label="Actions" />
                            </tr>
                        </thead>
                        <tbody>
                            {drafts.map((draft, index) => (
                                <tr key={draft.id}>
                                    <td>
                                        <input
                                            autoFocus={index === 0}
                                            value={draft.title}
                                            placeholder="Task title"
                                            onChange={(event) =>
                                                updateDraft(draft.id, {
                                                    title: event.target.value,
                                                })
                                            }
                                        />
                                    </td>
                                    <td>
                                        <input
                                            value={draft.description}
                                            placeholder="Short note"
                                            onChange={(event) =>
                                                updateDraft(draft.id, {
                                                    description: event.target.value,
                                                })
                                            }
                                        />
                                    </td>
                                    <td>
                                        <select
                                            value={draft.priority}
                                            onChange={(event) =>
                                                updateDraft(draft.id, {
                                                    priority: event.target.value as TodoPriority,
                                                })
                                            }
                                        >
                                            {PRIORITIES.map((priority) => (
                                                <option key={priority} value={priority}>
                                                    {priority}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <input
                                            type="datetime-local"
                                            value={draft.dueDate}
                                            onChange={(event) =>
                                                updateDraft(draft.id, {
                                                    dueDate: event.target.value,
                                                })
                                            }
                                        />
                                    </td>
                                    <td>
                                        <select
                                            value={draft.categoryId}
                                            onChange={(event) =>
                                                updateDraft(draft.id, {
                                                    categoryId: event.target.value,
                                                })
                                            }
                                        >
                                            <option value={emptyForm.categoryId}>others</option>
                                            {categories.map((category) => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className="todo-bulk-remove-btn"
                                            disabled={drafts.length === 1}
                                            onClick={() => onRemoveRow(draft.id)}
                                            aria-label="Remove row"
                                            title="Remove row"
                                        >
                                            ×
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {error && <p className="form-error">{error}</p>}

                <div className="todo-bulk-actions">
                    <button type="button" className="ghost-btn" onClick={onAddRow}>
                        + Add row
                    </button>
                    <div>
                        <button type="button" className="ghost-btn" onClick={onCancel}>
                            Cancel
                        </button>
                        <button type="submit" disabled={saving}>
                            {saving ? "Saving..." : `Save ${drafts.length} task${drafts.length > 1 ? "s" : ""}`}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
