export interface TaskUser {
    id?: number;
    fullName?: string;
    email?: string;
}

export interface TaskWeightBreakdown {
    estimatedEffortHours?: number;
    complexityMultiplier?: number;
    priorityMultiplier?: number;
    calculatedWeight?: number;
}

export interface TaskStatusHistoryItem {
    id?: number;
    oldStatus?: number | string;
    newStatus?: number | string;
    changedAt?: string;
    changedBy?: TaskUser | string;
    changedByName?: string;
}

export interface TaskChangeHistoryItem {
    id?: number;

    requestedBy?: TaskUser;
    currentAssignedMember?: TaskUser;
    newAssignedMember?: TaskUser;

    currentDueDate?: string;
    newDueDate?: string;

    currentEstimatedEffortHours?: number;
    newEstimatedEffortHours?: number;

    reason?: string;
    status?: string;

    createdAt?: string;
    reviewedAt?: string;
    reviewedBy?: TaskUser;

    // keep old fallback fields too
    fieldName?: string;
    changeType?: string;
    oldValue?: string;
    newValue?: string;
    changedAt?: string;
    requestedAt?: string;
    changedByName?: string;
    requestedByName?: string;
}

export interface TaskResponseDto {
    id?: number;
    title?: string;
    description?: string;
    assignedMemberId?: number | string;
    createdById?: number | string;
    priority?: number | string;
    complexity?: number | string;
    estimatedEffortHours?: number;
    startDate?: string;
    dueDate?: string;
    status?: number | string;
    weight?: number;
    isAcknowledged?: boolean;
    acknowledgedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface TaskDetailsResponse extends TaskResponseDto {
    taskId?: number;

    assignedMember?: TaskUser;
    createdBy?: TaskUser;

    assignedMemberName?: string;
    assignedToName?: string;
    createdByName?: string;

    effortHours?: number;
    totalWeight?: number;
    acknowledged?: boolean;

    weightBreakdown?: TaskWeightBreakdown;
    complexityMultiplier?: number;
    priorityMultiplier?: number;

    statusHistory?: TaskStatusHistoryItem[];
    taskStatusHistories?: TaskStatusHistoryItem[];

    changeHistory?: TaskChangeHistoryItem[];
    taskChangeHistories?: TaskChangeHistoryItem[];
}

export interface TaskFormData {
    title: string;
    description: string;
    assignedMemberId: string;
    priority: string;
    complexity: string;
    estimatedEffortHours: number;
    startDate: string;
    dueDate: string;
}