import { Check, Trash2 } from "lucide-react";
import type { TodoDto, TodoPriority } from "../types.js";
import {
    PRIORITIES,
    emptyForm,
    formatShortDate,
    toInputDateTime,
    type TodoFormState,
    type TodoInlineDraft,
} from "../todoPageUtils.js";
import type { TodoPanelActions, TodoPanelData } from "./todoPanelTypes.js";

interface TodoDraftRowProps {
    categories: TodoPanelData["categories"];
    draft: TodoInlineDraft;
    index: number;
    totalDrafts: number;
    onRemoveDraft: TodoPanelActions["onRemoveDraft"];
    onUpdateDraft: TodoPanelActions["onUpdateDraft"];
}

export function TodoDraftRow({
    categories,
    draft,
    index,
    totalDrafts,
    onRemoveDraft,
    onUpdateDraft,
}: TodoDraftRowProps) {
    function updateDraftTodo(patch: Partial<TodoFormState>) {
        onUpdateDraft(draft.id, patch);
    }

    return (
        <article
            key={draft.id}
            className="todo-card todo-card--editing todo-card--draft"
        >
            <div className="todo-card-body">
                <div className="todo-card-name">
                    <button
                        type="button"
                        className="todo-delete-checkbox todo-delete-checkbox--draft"
                        title="Hủy"
                        aria-label="Hủy tạo task"
                        onClick={() => onRemoveDraft(draft.id)}
                    >
                        <Trash2 size={13} strokeWidth={2.3} />
                    </button>
                    <textarea
                        className="todo-inline-field todo-inline-field--strong"
                        value={draft.title}
                        placeholder="Task name"
                        rows={2}
                        autoFocus={index === totalDrafts - 1}
                        onChange={(event) =>
                            updateDraftTodo({
                                title: event.target.value,
                            })
                        }
                    />
                </div>
                <div className="todo-card-description">
                    <textarea
                        className="todo-inline-field todo-inline-field--textarea"
                        value={draft.description}
                        placeholder="Description"
                        rows={2}
                        onChange={(event) =>
                            updateDraftTodo({
                                description: event.target.value,
                            })
                        }
                    />
                </div>
                <div className="todo-card-due">
                    <input
                        className="todo-inline-field todo-inline-field--date"
                        type="datetime-local"
                        value={draft.dueDate}
                        onChange={(event) =>
                            updateDraftTodo({
                                dueDate: event.target.value,
                            })
                        }
                    />
                </div>
                <div className="todo-card-labels">
                    <select
                        className="todo-inline-field todo-inline-field--label"
                        value={draft.priority}
                        onChange={(event) =>
                            updateDraftTodo({
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
                    <select
                        className="todo-inline-field todo-inline-field--label"
                        value={draft.categoryId}
                        onChange={(event) =>
                            updateDraftTodo({
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
                </div>
            </div>
        </article>
    );
}

interface TodoRowProps {
    categories: TodoPanelData["categories"];
    editedRows: Record<number, TodoFormState>;
    isDeleteSelected: boolean;
    todo: TodoDto;
    onUpdateRow: TodoPanelActions["onUpdateRow"];
    onToggleSelection: TodoPanelActions["onToggleSelection"];
}

export function TodoRow({
    categories,
    editedRows,
    isDeleteSelected,
    todo,
    onUpdateRow,
    onToggleSelection,
}: TodoRowProps) {
    const rowDraft = editedRows[todo.id];
    const rowValues = rowDraft ?? {
        title: todo.title,
        description: todo.description ?? "",
        priority: todo.priority,
        dueDate: toInputDateTime(todo.dueDate),
        categoryId: todo.categoryId ? String(todo.categoryId) : "",
    };

    return (
        <article
            className={`todo-card ${rowDraft ? "todo-card--editing" : ""}`}
        >
            <div className="todo-card-body">
                <div className="todo-card-name">
                    <button
                        type="button"
                        className={`todo-delete-checkbox ${isDeleteSelected ? "active" : ""}`}
                        title={isDeleteSelected ? "Bỏ chọn task" : "Chọn task để xóa"}
                        aria-label={isDeleteSelected ? `Bỏ chọn task ${todo.title}` : `Chọn task ${todo.title} để xóa`}
                        onClick={() => onToggleSelection(todo.id)}
                    >
                        {isDeleteSelected && <Check size={13} strokeWidth={2.6} />}
                    </button>
                    <textarea
                        className="todo-inline-field todo-inline-field--strong"
                        value={rowValues.title}
                        placeholder="Task name"
                        rows={2}
                        onChange={(event) =>
                            onUpdateRow(todo, {
                                title: event.target.value,
                            })
                        }
                    />
                </div>
                <div className="todo-card-description">
                    <textarea
                        className="todo-inline-field todo-inline-field--textarea"
                        value={rowValues.description}
                        placeholder="Description"
                        rows={2}
                        onChange={(event) =>
                            onUpdateRow(todo, {
                                description: event.target.value,
                            })
                        }
                    />
                </div>
                <div className="todo-card-due">
                    <input
                        className="todo-inline-field todo-inline-field--date"
                        type="datetime-local"
                        value={rowValues.dueDate}
                        placeholder={formatShortDate(todo.dueDate)}
                        onChange={(event) =>
                            onUpdateRow(todo, {
                                dueDate: event.target.value,
                            })
                        }
                    />
                </div>
                <div className="todo-card-labels">
                    <select
                        className="todo-inline-field todo-inline-field--label"
                        value={rowValues.priority}
                        onChange={(event) =>
                            onUpdateRow(todo, {
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
                    <select
                        className="todo-inline-field todo-inline-field--label"
                        value={rowValues.categoryId}
                        onChange={(event) =>
                            onUpdateRow(todo, {
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
                </div>
            </div>
        </article>
    );
}
