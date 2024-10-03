export interface Todo {
    taskId: number;
    description: string;
    doneDate?: Date;
    difficulty: number;
    done: boolean;
}