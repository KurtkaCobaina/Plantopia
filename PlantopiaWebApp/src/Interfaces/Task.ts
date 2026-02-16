export interface Task {
    id: number;
    title: string;
    description: string;
    dueDate: string;      // camelCase
    category: string;
    completed: boolean;
    createdAt: string;    // camelCase
}