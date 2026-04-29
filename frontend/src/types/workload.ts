export type WorkloadStatus = "Available" | "Moderate" | "Overloaded" | string;

export interface TeamWorkloadMember {
    userId?: string;
    id?: string;
    fullName?: string;
    name?: string;
    memberName?: string;
    userName?: string;

    totalTasks?: number;
    taskCount?: number;

    totalEffortHours?: number;
    effortHours?: number;

    totalWeight?: number;

    workloadStatus?: WorkloadStatus;
    status?: WorkloadStatus;

    role?: string;
}

export interface TeamWorkloadResponse {
    teamId?: number;
    id?: number;
    teamName?: string;
    name?: string;
    startDate?: string;
    endDate?: string;
    members?: TeamWorkloadMember[];
    users?: TeamWorkloadMember[];
}