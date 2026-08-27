import type { FormEvent, PointerEvent, RefObject } from "react";
import type { TodoCategoryDto, TodoDto } from "../types.js";
import { getCategoryFilterId, type CategoryFilter } from "../todoPageUtils.js";

interface TodoCategoryRailProps {
    categories: TodoCategoryDto[];
    categoryName: string;
    isRailDragging: boolean;
    railRef: RefObject<HTMLDivElement | null>;
    selectedCategoryFilter: CategoryFilter;
    selectedCategoryName: string;
    todos: TodoDto[];
    onCategoryNameChange: (value: string) => void;
    onDeleteCategory: (category: TodoCategoryDto) => void;
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerEnd: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
    onRenameCategory: (category: TodoCategoryDto) => void;
    onScrollRail: (direction: "left" | "right") => void;
    onSelectCategory: (filter: CategoryFilter) => void;
    onSubmitCategory: (event: FormEvent<HTMLFormElement>) => void;
}

export default function TodoCategoryRail({
    categories,
    categoryName,
    isRailDragging,
    railRef,
    selectedCategoryFilter,
    selectedCategoryName,
    todos,
    onCategoryNameChange,
    onDeleteCategory,
    onPointerDown,
    onPointerEnd,
    onPointerMove,
    onRenameCategory,
    onScrollRail,
    onSelectCategory,
    onSubmitCategory,
}: TodoCategoryRailProps) {
    return (
        <section className="todo-category-rail" aria-label="Category rail">
            <div className="todo-rail-heading">
                <div className="todo-rail-breadcrumb">
                    <strong>Category rail</strong>
                    <span>&gt;</span>
                    <b>{selectedCategoryName}</b>
                </div>
                <form className="todo-rail-form" onSubmit={onSubmitCategory}>
                    <input
                        value={categoryName}
                        placeholder="enter để tạo category mới"
                        aria-label="enter để tạo category mới"
                        onChange={(event) => onCategoryNameChange(event.target.value)}
                    />
                </form>
            </div>

            <div className="todo-train-viewport">
                <button
                    type="button"
                    className="todo-rail-arrow todo-rail-arrow--left"
                    onClick={() => onScrollRail("left")}
                    aria-label="Lùi category rail"
                >
                    ‹
                </button>

                <div
                    ref={railRef}
                    className={`todo-train-track ${isRailDragging ? "is-dragging" : ""}`}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerEnd}
                    onPointerCancel={onPointerEnd}
                    role="listbox"
                    aria-label="Chọn category"
                >
                    <button
                        type="button"
                        className={`todo-train-car todo-train-car--engine ${selectedCategoryFilter === "all" ? "active" : ""}`}
                        onClick={() => onSelectCategory("all")}
                    >
                        <span>All tracks</span>
                        <small>{todos.length} tasks</small>
                    </button>

                    {categories.map((category) => {
                        const filterId = getCategoryFilterId(category.id);
                        const taskCount = todos.filter(
                            (todo) => todo.categoryId === category.id
                        ).length;

                        return (
                            <article
                                key={category.id}
                                className={`todo-train-car ${selectedCategoryFilter === filterId ? "active" : ""}`}
                            >
                                <button
                                    type="button"
                                    className="todo-train-car-main"
                                    onClick={() => onSelectCategory(filterId)}
                                >
                                    <span>{category.name}</span>
                                    <small>{taskCount} tasks</small>
                                </button>
                                <div className="todo-train-car-actions">
                                    <button type="button" onClick={() => onRenameCategory(category)}>
                                        Rename
                                    </button>
                                    <button type="button" onClick={() => onDeleteCategory(category)}>
                                        Delete
                                    </button>
                                </div>
                            </article>
                        );
                    })}

                    <button
                        type="button"
                        className={`todo-train-car todo-train-car--tail ${selectedCategoryFilter === "uncategorized" ? "active" : ""}`}
                        onClick={() => onSelectCategory("uncategorized")}
                    >
                        <span>Others</span>
                        <strong>others</strong>
                        <small>{todos.filter((todo) => todo.categoryId === null).length} tasks</small>
                    </button>
                </div>

                <button
                    type="button"
                    className="todo-rail-arrow todo-rail-arrow--right"
                    onClick={() => onScrollRail("right")}
                    aria-label="Tiến category rail"
                >
                    ›
                </button>
            </div>
        </section>
    );
}
