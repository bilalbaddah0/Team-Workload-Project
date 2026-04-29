import api from "./axios";

export interface WeightMultiplierSetting {
    id: number;
    type: string;
    name: string;
    multiplier: number;
}

export interface UpdateWeightMultiplierPayload {
    multiplier: number;
}

export const getWeightMultipliers = async (): Promise<WeightMultiplierSetting[]> => {
    const response = await api.get<WeightMultiplierSetting[]>("/weight-multipliers");
    return response.data;
};

export const updateWeightMultiplier = async (
    id: number | string,
    payload: UpdateWeightMultiplierPayload
): Promise<WeightMultiplierSetting> => {
    const response = await api.put<WeightMultiplierSetting>(
        `/weight-multipliers/${id}`,
        payload
    );

    return response.data;
};