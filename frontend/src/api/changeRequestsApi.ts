import api from "./axios";
import type { ChangeRequest } from "../types/changeRequest";

export const getPendingChangeRequests = async (): Promise<ChangeRequest[]> => {
    const response = await api.get("/change-requests/pending");

    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data?.items)) return response.data.items;
    if (Array.isArray(response.data?.data)) return response.data.data;

    return [];
};

export const approveChangeRequest = async (id: number | string) => {
    const response = await api.patch(`/change-requests/${id}/approve`);
    return response.data;
};

export const rejectChangeRequest = async (id: number | string) => {
    const response = await api.patch(`/change-requests/${id}/reject`);
    return response.data;
};