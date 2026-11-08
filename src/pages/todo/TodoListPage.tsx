import TodoCategoryPanel from "../../features/todo/components/TodoCategoryPanel.js";
import TodoDialog from "../../features/todo/components/TodoDialog.js";
import TodoPanel from "../../features/todo/components/TodoPanel.js";
import TodoActionNotice from "../../features/todo/components/TodoActionNotice.js";
import { useTodoListPageModel } from "../../features/todo/hooks/useTodoListPageModel.js";
import AppLayout from "../../layouts/AppLayout.js";

export default function TodoListPage() {
    const { categoryPanelProps, dialogProps, notificationProps, panelProps } = useTodoListPageModel();

    return (
        <AppLayout>
            <main className="todo-list-page">
                <TodoCategoryPanel {...categoryPanelProps} />

                <div className="todo-list-page-panel">
                    <TodoPanel {...panelProps} />
                </div>
            </main>

            <TodoDialog {...dialogProps} />
            <TodoActionNotice {...notificationProps} />
        </AppLayout>
    );
}
