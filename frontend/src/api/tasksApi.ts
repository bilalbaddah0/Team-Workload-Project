import api from "./axios";
import type { TaskDetailsResponse, TaskFormData, TaskResponseDto } from "../types/task";

function mapPriorityToApi(value: string) {
    switch (value) {
        case "Low":
            return 1;
        case "Medium":
            return 2;
        case "High":
            return 3;
        case "Critical":
            return 4;
        default:
            return 2;
    }
}

function mapComplexityToApi(value: string) {
    switch (value) {
        case "Simple":
            return 1;
        case "Medium":
            return 2;
        case "Complex":
            return 3;
        default:
            return 2;
    }
}

export function mapStatusToApi(value: string) {
    switch (value) {
        case "New":
            return 0;
        case "In Progress":
            return 1;
        case "Blocked":
            return 2;
        case "Done":
            return 3;
        default:
            return 0;
    }
}

export const getTaskDetails = async (taskId: string | number): Promise<TaskDetailsResponse> => {
    const response = await api.get<TaskDetailsResponse>(`/tasks/${taskId}/details`);
    return response.data;
};

export const getTaskById = async (taskId: string | number): Promise<TaskResponseDto> => {
    const response = await api.get<TaskResponseDto>(`/tasks/${taskId}`);
    return response.data;
};

export const createTask = async (payload: TaskFormData): Promise<TaskResponseDto> => {
    const response = await api.post<TaskResponseDto>("/tasks", {
        title: payload.title,
        description: payload.description,
        assignedMemberId: Number(payload.assignedMemberId),
        priority: mapPriorityToApi(payload.priority),
        complexity: mapComplexityToApi(payload.complexity),
        estimatedEffortHours: payload.estimatedEffortHours,
        startDate: payload.startDate,
        dueDate: payload.dueDate,
    });

    return response.data;
};

export const updateTask = async (
    taskId: string | number,
    payload: TaskFormData
): Promise<TaskResponseDto> => {
    const response = await api.put<TaskResponseDto>(`/tasks/${taskId}`, {
        title: payload.title,
        description: payload.description,
        assignedMemberId: Number(payload.assignedMemberId),
        priority: mapPriorityToApi(payload.priority),
        complexity: mapComplexityToApi(payload.complexity),
        estimatedEffortHours: payload.estimatedEffortHours,
        startDate: payload.startDate,
        dueDate: payload.dueDate,
    });

    return response.data;
};

export const acknowledgeTask = async (taskId: string | number) => {
    const response = await api.patch(`/tasks/${taskId}/acknowledge`);
    return response.data;
};

export const updateTaskStatus = async (
    taskId: string | number,
    status: number
): Promise<TaskResponseDto> => {
    const response = await api.patch<TaskResponseDto>(`/tasks/${taskId}/status`, {
        status,
    });

    return response.data;
};

export const createTaskChangeRequest = async (
    taskId: string | number,
    payload: {
        newAssignedMemberId?: number;
        newDueDate?: string;
        newEstimatedEffortHours?: number;
        reason?: string;
    }
) => {
    const response = await api.post(`/tasks/${taskId}/change-request`, payload);
    return response.data;
};

export const deleteTask = async (taskId: string | number) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
};


export const getAllTasks = async (): Promise<TaskResponseDto[]> => {
    const response = await api.get<TaskResponseDto[]>("/tasks");
    return response.data;
};