import { Task } from "./task";

export type TimeBlock = {
    id: string;
    start: Date;
    end: Date;
    createdAt: Date;
    updatedAt: Date;
    tasks: Task[];
}