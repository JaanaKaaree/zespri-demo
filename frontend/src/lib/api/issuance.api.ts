import apiClient from './client';
import {
  ApiResponse,
  CreateCredentialRequest,
  CredentialResponse,
  CredentialStatus,
} from './types';

export const issuanceApi = {
  createCredential: async (
    request: CreateCredentialRequest,
  ): Promise<CredentialResponse> => {
    const response = await apiClient.post<ApiResponse<CredentialResponse>>(
      '/issuance/create',
      request,
    );
    return response.data.data;
  },

  issueCredential: async (
    credentialId: string,
  ): Promise<CredentialResponse> => {
    const response = await apiClient.post<ApiResponse<CredentialResponse>>(
      '/issuance/issue',
      { credentialId },
    );
    return response.data.data;
  },

  getCredentialStatus: async (id: string): Promise<CredentialStatus> => {
    const response = await apiClient.get<ApiResponse<CredentialStatus>>(
      `/issuance/status/${id}`,
    );
    return response.data.data;
  },
};
