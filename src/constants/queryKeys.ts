export const QUERY_KEYS = {
    maps: ["maps"] as const,
    vehicles: ["vehicles"] as const,
    gameModes: ["gameModes"] as const,
    records: ["records"] as const,
    pendingRecords: ["records", "pending"] as const,
    myRecords: (userId: number) => ["records", "user", userId] as const,
    todos: (userId: number) => ["todos", "user", userId] as const,
    todoCategories: (userId: number) => ["todo-categories", "user", userId] as const,
};
