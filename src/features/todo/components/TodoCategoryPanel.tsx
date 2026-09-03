import { type FormEvent, useEffect, useRef, useState } from "react";
import { Plus, X, Pencil, Trash2 } from "lucide-react";
import type { TodoCategoryDto, TodoDto } from "../types.js";
import { getCategoryFilterId, type CategoryFilter, type TodoCounts } from "../todoPageUtils.js";

interface TodoCategoryPanelProps {
    allTodos: TodoDto[];
    categories: TodoCategoryDto[];
    categoryName: string;
    counts: TodoCounts;
    createCategoryPending: boolean;
    selectedCategoryFilter: CategoryFilter;
    onCategoryNameChange: (value: string) => void;
    onDeleteCategory: (category: TodoCategoryDto, taskCount: number) => void;
    onRenameCategory: (category: TodoCategoryDto) => void;
    onSelectCategory: (filter: CategoryFilter) => void;
    onSubmitCategory: (event: FormEvent<HTMLFormElement>) => void;
}

export default function TodoCategoryPanel({
    allTodos,
    categories,
    categoryName,
    counts,
    createCategoryPending,
    selectedCategoryFilter,
    onCategoryNameChange,
    onDeleteCategory,
    onRenameCategory,
    onSelectCategory,
    onSubmitCategory,
}: TodoCategoryPanelProps) {
    const [categoryFormOpen, setCategoryFormOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (categoryFormOpen) {
            inputRef.current?.focus();
        }
    }, [categoryFormOpen]);

    function submitCategory(event: FormEvent<HTMLFormElement>) {
        const hasName = categoryName.trim().length > 0;
        onSubmitCategory(event);
        if (hasName) {
            setCategoryFormOpen(false);
        }
    }

    return (
        <aside className="todo-simple-category-panel" aria-label="Todo categories">
            <div className="todo-panel-heading todo-simple-category-heading">
                <div className="todo-simple-category-title">
                    <p className="eyebrow">Category</p>
                    <div className="todo-stat-row todo-simple-category-stats">
                        <span><b>{counts.all}</b> Total</span>
                        <span><b>{counts.progress}</b> Running</span>
                        <span><b>{counts.overdue}</b> Overdue</span>
                    </div>
                </div>

                <div className="todo-simple-category-create">
                    <button
                        type="button"
                        className={`todo-simple-category-create-trigger ${categoryFormOpen ? "active" : ""}`}
                        disabled={createCategoryPending}
                        aria-label="Thêm category"
                        title="Thêm category"
                        onClick={() => setCategoryFormOpen((prev) => !prev)}
                    >
                        {categoryFormOpen ? (
                            <X size={16} strokeWidth={2.4} />
                        ) : (
                            <Plus size={17} strokeWidth={2.4} />
                        )}
                    </button>

                    {categoryFormOpen && (
                        <form className="todo-simple-category-form" onSubmit={submitCategory}>
                            <input
                                ref={inputRef}
                                value={categoryName}
                                placeholder="New category"
                                aria-label="New category"
                                onChange={(event) => onCategoryNameChange(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Escape") {
                                        setCategoryFormOpen(false);
                                    }
                                }}
                            />
                            <button
                                type="submit"
                                disabled={createCategoryPending || !categoryName.trim()}
                                aria-label="Lưu category"
                                title="Lưu category"
                            >
                                <Plus size={15} strokeWidth={2.5} />
                            </button>
                        </form>
                    )}
                </div>
            </div>

            <div className="todo-simple-category-list">
                <button
                    type="button"
                    className={`todo-simple-category-item ${selectedCategoryFilter === "all" ? "active" : ""}`}
                    onClick={() => onSelectCategory("all")}
                >
                    <span>All</span>
                    <small>{allTodos.length}</small>
                </button>

                {categories.map((category) => {
                    const filterId = getCategoryFilterId(category.id);
                    const taskCount = allTodos.filter(
                        (todo) => todo.categoryId === category.id
                    ).length;

                    return (
                        <article
                            key={category.id}
                            className={`todo-simple-category-row ${selectedCategoryFilter === filterId ? "active" : ""}`}
                        >
                            <button
                                type="button"
                                className="todo-simple-category-item todo-simple-category-item--main"
                                onClick={() => onSelectCategory(filterId)}
                            >
                                <span>{category.name}</span>
                                <small>{taskCount}</small>
                            </button>
                            <div className="todo-simple-category-actions">
                                <button
                                    type="button"
                                    aria-label={`Đổi tên category ${category.name}`}
                                    title="Đổi tên category"
                                    onClick={() => onRenameCategory(category)}
                                >
                                    <Pencil size={13} strokeWidth={2.3} />
                                </button>
                                <button
                                    type="button"
                                    aria-label={`Xóa category ${category.name}`}
                                    title="Xóa category"
                                    onClick={() => onDeleteCategory(category, taskCount)}
                                >
                                    <Trash2 size={13} strokeWidth={2.3} />
                                </button>
                            </div>
                        </article>
                    );
                })}

                <button
                    type="button"
                    className={`todo-simple-category-item ${selectedCategoryFilter === "uncategorized" ? "active" : ""}`}
                    onClick={() => onSelectCategory("uncategorized")}
                >
                    <span>others</span>
                    <small>{allTodos.filter((todo) => todo.categoryId === null).length}</small>
                </button>
            </div>
        </aside>
    );
}
