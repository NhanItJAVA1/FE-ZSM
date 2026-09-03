import type { SyntheticEvent } from "react";
import { Trash2 } from "lucide-react";
import type { TodoDto, TodoPriority } from "../types.js";
import {
    PRIORITIES,
    emptyForm,
    formatShortDate,
    toInputDateTime,
    type TodoFormState,
    type TodoInlineDraft,
} from "../todoPageUtils.js";
import type { TodoPanelActions, TodoPanelData, TodoPanelSelection } from "./todoPanelTypes.js";

interface TodoDraftRowProps {
    categories: TodoPanelData["categories"];
    draft: TodoInlineDraft;
    index: number;
    totalDrafts: number;
    onRemoveInlineDraft: TodoPanelActions["onRemoveInlineDraft"];
    onSetInlineDraft: TodoPanelActions["onSetInlineDraft"];
}

export function TodoDraftRow({
    categories,
    draft,
    index,
    totalDrafts,
    onRemoveInlineDraft,
    onSetInlineDraft,
}: TodoDraftRowProps) {
    function updateDraftTodo(patch: Partial<TodoFormState>) {
        onSetInlineDraft(draft.id, patch);
    }

    return (
        <article
            key={draft.id}
            className="todo-card todo-card--editing todo-card--draft"
        >
            <div className="todo-card-body">
                <div className="todo-card-name">
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
            <div className="todo-card-actions">
                <button
                    type="button"
                    className="todo-card-side-btn todo-card-side-btn--danger todo-card-side-btn--single"
                    title="Hủy"
                    aria-label="Hủy tạo task"
                    onClick={() => onRemoveInlineDraft(draft.id)}
                >
                    <Trash2 size={13} strokeWidth={2.3} />
                </button>
            </div>
        </article>
    );
}

interface TodoRowProps {
    categories: TodoPanelData["categories"];
    editedTodoRows: Record<number, TodoFormState>;
    selection: TodoPanelSelection;
    todo: TodoDto;
    onDeleteTodo: TodoPanelActions["onDeleteTodo"];
    onSelectTodo: TodoPanelActions["onSelectTodo"];
    onSetTodoRow: TodoPanelActions["onSetTodoRow"];
    onToggleDeleteSelection: TodoPanelActions["onToggleDeleteSelection"];
}

export function TodoRow({
    categories,
    editedTodoRows,
    selection,
    todo,
    onDeleteTodo,
    onSelectTodo,
    onSetTodoRow,
    onToggleDeleteSelection,
}: TodoRowProps) {
    const { bulkDeleteMode, selectedDeleteIds, selectedTodoId } = selection;
    const rowDraft = editedTodoRows[todo.id];
    const rowValues = rowDraft ?? {
        title: todo.title,
        description: todo.description ?? "",
        priority: todo.priority,
        dueDate: toInputDateTime(todo.dueDate),
        categoryId: todo.categoryId ? String(todo.categoryId) : "",
    };

    function stopRowClick(event: SyntheticEvent) {
        event.stopPropagation();
    }

    return (
        <article
            className={`todo-card ${selectedTodoId === todo.id ? "active" : ""} ${rowDraft ? "todo-card--editing" : ""}`}
            onClick={() => onSelectTodo(todo.id)}
        >
            <div className="todo-card-body">
                <div className="todo-card-name">
                    <textarea
                        className="todo-inline-field todo-inline-field--strong"
                        value={rowValues.title}
                        placeholder="Task name"
                        rows={2}
                        onClick={stopRowClick}
                        onChange={(event) =>
                            onSetTodoRow(todo, {
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
                        onClick={stopRowClick}
                        onChange={(event) =>
                            onSetTodoRow(todo, {
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
                        onClick={stopRowClick}
                        onChange={(event) =>
                            onSetTodoRow(todo, {
                                dueDate: event.target.value,
                            })
                        }
                    />
                </div>
                <div className="todo-card-labels">
                    <select
                        className="todo-inline-field todo-inline-field--label"
                        value={rowValues.priority}
                        onClick={stopRowClick}
                        onChange={(event) =>
                            onSetTodoRow(todo, {
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
                        onClick={stopRowClick}
                        onChange={(event) =>
                            onSetTodoRow(todo, {
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

            <div className="todo-card-actions">
                <div className="todo-card-edit-stack">
                    <button
                        type="button"
                        className="todo-card-side-btn todo-card-side-btn--danger todo-card-side-btn--single"
                        title={bulkDeleteMode ? "Chọn task để xóa" : "Xóa task"}
                        aria-label={bulkDeleteMode ? `Chọn task ${todo.title} để xóa` : `Xóa task ${todo.title}`}
                        onClick={(event) => {
                            event.stopPropagation();
                            if (bulkDeleteMode) {
                                onToggleDeleteSelection(todo.id);
                                return;
                            }
                            onDeleteTodo(todo);
                        }}
                    >
                        {bulkDeleteMode ? (
                            <span
                                className={`todo-delete-select-dot ${selectedDeleteIds.includes(todo.id) ? "active" : ""}`}
                            />
                        ) : (
                            <Trash2 size={13} strokeWidth={2.3} />
                        )}
                    </button>
                </div>
            </div>
        </article>
    );
}
