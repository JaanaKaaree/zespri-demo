import apiClient from './client';
import { ApiResponse, LoginRequest, LoginResponse } from './types';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      '/auth/login',
      credentials,
    );
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  getProfile: async () => {
    const response = await apiClient.get('/auth/profile');
    return response.data.data;
  },
};
