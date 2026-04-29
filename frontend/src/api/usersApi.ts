import api from "./axios";

export interface MemberTask {
    id: number;
    title: string;
    status: number | string;
    estimatedEffortHours?: number;
    weight?: number;
    startDate?: string;
    dueDate?: string;
}

export interface UserWorkloadResponse {
    id: number;
    fullName: string;
    email: string;
    totalTasks: number;
    totalEffortHours: number;
    totalWeight: number;
    workloadStatus: string;
    tasks: MemberTask[];
}

export interface UserResponseDto {
    id: number;
    fullName: string;
    email: string;
    role: number | string;
    teamId?: number | null;
    isActive: boolean;
    createdAt?: string;
}

export interface CreateUserPayload {
    fullName: string;
    email: string;
    password: string;
    role: number;
    teamId?: number | null;
}

export interface UpdateUserPayload {
    fullName: string;
    email: string;
    password: string;
    role: number;
    teamId?: number | null;
    isActive: boolean;
}

export const getUserWorkload = async (
    userId: number | string,
    startDate?: string,
    endDate?: string
): Promise<UserWorkloadResponse> => {
    const response = await api.get<UserWorkloadResponse>(`/users/${userId}/workload`, {
        params: {
            ...(startDate ? { startDate } : {}),
            ...(endDate ? { endDate } : {}),
        },
    });

    return response.data;
};

export const getAllUsers = async (): Promise<UserResponseDto[]> => {
    const response = await api.get<UserResponseDto[]>("/users");
    return response.data;
};

export const getUserById = async (id: number | string): Promise<UserResponseDto> => {
    const response = await api.get<UserResponseDto>(`/users/${id}`);
    return response.data;
};

export const createUser = async (payload: CreateUserPayload): Promise<UserResponseDto> => {
    const response = await api.post<UserResponseDto>("/users", payload);
    return response.data;
};

export const updateUser = async (
    id: number | string,
    payload: UpdateUserPayload
): Promise<UserResponseDto> => {
    const response = await api.put<UserResponseDto>(`/users/${id}`, payload);
    return response.data;
};

export const deleteUser = async (id: number | string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
};