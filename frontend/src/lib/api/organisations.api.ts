import apiClient from './client';
import { ApiResponse } from './types';
import { OrganisationPart, CreateOrganisationPartRequest, UpdateOrganisationPartRequest } from '@/types/organisation.types';

/**
 * Organisation Parts API Client
 * 
 * Note: OAuth tokens are handled by the backend via user session.
 * The backend automatically retrieves the OAuth token from the session.
 */

export const nzbnOAuthApi = {
  /**
   * Get the OAuth authorization URL
   * Note: Backend TransformInterceptor wraps response in { data, statusCode, timestamp }
   */
  getAuthorizationUrl: async (): Promise<string> => {
    const response = await apiClient.get<ApiResponse<{ authorizationUrl: string }>>('/nzbn/oauth/authorize-url');
    // TransformInterceptor wraps the response, so we need to access response.data.data
    const authorizationUrl = response.data.data?.authorizationUrl;
    if (!authorizationUrl) {
      console.error('[nzbnOAuthApi] Authorization URL not found in response:', response.data);
      throw new Error('Authorization URL not found in response');
    }
    return authorizationUrl;
  },
};

export const organisationsApi = {
  /**
   * Get all organisation parts for an NZBN
   * @param nzbn - The NZBN number
   * Note: Backend TransformInterceptor wraps response in { data, statusCode, timestamp }
   */
  getOrganisationParts: async (nzbn: string): Promise<OrganisationPart[]> => {
    const response = await apiClient.get<ApiResponse<OrganisationPart[]>>(
      `/nzbn/organisations/${nzbn}/parts`,
    );
    // TransformInterceptor wraps the response, so we need to access response.data.data
    return response.data.data || [];
  },

  /**
   * Create a new organisation part
   * @param nzbn - The NZBN number
   * @param data - Organisation part data
   * Note: Backend TransformInterceptor wraps response in { data, statusCode, timestamp }
   */
  createOrganisationPart: async (
    nzbn: string,
    data: CreateOrganisationPartRequest,
  ): Promise<OrganisationPart> => {
    const response = await apiClient.post<ApiResponse<OrganisationPart>>(
      `/nzbn/organisations/${nzbn}/organisation-parts`,
      data,
    );
    // TransformInterceptor wraps the response, so we need to access response.data.data
    return response.data.data;
  },

  /**
   * Update an organisation part
   * @param nzbn - The NZBN number
   * @param opn - The Organisation Part Number
   * @param data - Updated organisation part data
   * Note: Backend TransformInterceptor wraps response in { data, statusCode, timestamp }
   */
  updateOrganisationPart: async (
    nzbn: string,
    opn: string,
    data: UpdateOrganisationPartRequest,
  ): Promise<OrganisationPart> => {
    const response = await apiClient.put<ApiResponse<OrganisationPart>>(
      `/nzbn/organisations/${nzbn}/organisation-parts/${opn}`,
      data,
    );
    // TransformInterceptor wraps the response, so we need to access response.data.data
    return response.data.data;
  },

  /**
   * Delete an organisation part
   * @param nzbn - The NZBN number
   * @param opn - The Organisation Part Number
   */
  deleteOrganisationPart: async (nzbn: string, opn: string): Promise<void> => {
    await apiClient.delete(`/nzbn/organisations/${nzbn}/organisation-parts/${opn}`);
  },
};
