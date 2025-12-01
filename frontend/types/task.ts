
type Task = {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: Date;
    estimatedDuration: number;
    createdAt: Date;
    updatedAt: Date;
    subtasks: Task[];
}

enum TaskStatus {
    notStarted,
    inProgress,
    completed,
    cancelled
}

enum TaskPriority {
    low,
    medium,
    high,
    critical
}