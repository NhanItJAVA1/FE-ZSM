import { useEffect, useState, type RefObject } from "react";
import {
    TODO_PAGE_SIZE_DEFAULT,
    TODO_PAGE_SIZE_MAX,
    TODO_PAGE_SIZE_MIN,
    TODO_PANEL_STATIC_HEIGHT,
    TODO_ROW_ESTIMATED_HEIGHT,
} from "../todoPageUtils.js";

export function useTodoPageSize(panelRef: RefObject<HTMLElement | null>) {
    const [pageSize, setPageSize] = useState(TODO_PAGE_SIZE_DEFAULT);

    useEffect(() => {
        const panelElement = panelRef.current;
        if (!panelElement || typeof ResizeObserver === "undefined") return;
        const observedPanel: HTMLElement = panelElement;

        function calculatePageSize() {
            const panelHeight = observedPanel.getBoundingClientRect().height;
            const availableHeight = panelHeight - TODO_PANEL_STATIC_HEIGHT;
            const nextPageSize = clamp(
                Math.floor(availableHeight / TODO_ROW_ESTIMATED_HEIGHT),
                TODO_PAGE_SIZE_MIN,
                TODO_PAGE_SIZE_MAX
            );

            setPageSize((prev) => (prev === nextPageSize ? prev : nextPageSize));
        }

        calculatePageSize();

        const observer = new ResizeObserver(calculatePageSize);
        observer.observe(observedPanel);
        window.addEventListener("resize", calculatePageSize);

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", calculatePageSize);
        };
    }, [panelRef]);

    return pageSize - 1;
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}
