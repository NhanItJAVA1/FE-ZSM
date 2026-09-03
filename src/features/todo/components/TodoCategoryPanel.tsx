import type { FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
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
    onDeleteCategory: (category: TodoCategoryDto) => void;
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

                <form className="todo-simple-category-form" onSubmit={onSubmitCategory}>
                    <input
                        value={categoryName}
                        placeholder="Enter for new category"
                        aria-label="Enter for new category"
                        onChange={(event) => onCategoryNameChange(event.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={createCategoryPending}
                        aria-label="Thêm category"
                        title="Thêm category"
                    >
                        +
                    </button>
                </form>
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
                                    onClick={() => onDeleteCategory(category)}
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
