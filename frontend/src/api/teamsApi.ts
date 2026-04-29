import api from "./axios";

export interface TeamResponseDto {
    id: number;
    name: string;
    description?: string;
    createdAt?: string;
}

export interface TeamMemberDto {
    id: number;
    fullName: string;
    email: string;
    role: number | string;
    isActive: boolean;
}

export interface TeamDetailsDto {
    id: number;
    name: string;
    createdAt?: string;
    members: TeamMemberDto[];
}

export interface CreateTeamPayload {
    name: string;
    description?: string;
}

export interface UpdateTeamPayload {
    name: string;
    description?: string;
}

export const getTeamWorkload = async (
    teamId: number | string,
    startDate?: string,
    endDate?: string
) => {
    const response = await api.get(`/teams/${teamId}/workload`, {
        params: {
            ...(startDate ? { startDate } : {}),
            ...(endDate ? { endDate } : {}),
        },
    });

    return response.data;
};

export const getAllTeams = async (): Promise<TeamResponseDto[]> => {
    const response = await api.get<TeamResponseDto[]>("/teams");
    return response.data;
};

export const getTeamById = async (id: number | string): Promise<TeamResponseDto> => {
    const response = await api.get<TeamResponseDto>(`/teams/${id}`);
    return response.data;
};

export const getTeamDetails = async (id: number | string): Promise<TeamDetailsDto> => {
    const response = await api.get<TeamDetailsDto>(`/teams/${id}/details`);
    return response.data;
};

export const createTeam = async (payload: CreateTeamPayload): Promise<TeamResponseDto> => {
    const response = await api.post<TeamResponseDto>("/teams", payload);
    return response.data;
};

export const updateTeam = async (
    id: number | string,
    payload: UpdateTeamPayload
): Promise<TeamResponseDto> => {
    const response = await api.put<TeamResponseDto>(`/teams/${id}`, payload);
    return response.data;
};

export const deleteTeam = async (id: number | string) => {
    const response = await api.delete(`/teams/${id}`);
    return response.data;
};