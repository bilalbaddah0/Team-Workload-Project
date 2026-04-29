export interface ChangeRequest {
    id: number;
    taskId: number;
    taskTitle?: string;

    requestedById?: number;
    requestedByName?: string;

    currentAssignedMemberId?: number | null;
    newAssignedMemberId?: number | null;

    currentDueDate?: string;
    newDueDate?: string;

    currentEstimatedEffortHours?: number;
    newEstimatedEffortHours?: number;

    reason?: string;
    status?: string;
    createdAt?: string;
}