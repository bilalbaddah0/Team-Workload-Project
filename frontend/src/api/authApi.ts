import api from "./axios";

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    userId: number;
    fullName: string;
    email: string;
    role: string;
}

export const login = async (payload: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/login", payload);
    return response.data;
};