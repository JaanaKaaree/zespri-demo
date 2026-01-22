import apiClient from './client';
import { ApiResponse } from './types';
import {
  CollectionCredential,
  CreateCollectionCredentialRequest,
  UpdateCollectionCredentialRequest,
  CollectionCredentialFilters,
} from '@/types/collection-credential.types';

export const collectionCredentialApi = {
  /**
   * Create a new collection credential
   * Note: Backend TransformInterceptor wraps response in { data, statusCode, timestamp }
   */
  createCollectionCredential: async (
    data: CreateCollectionCredentialRequest,
  ): Promise<CollectionCredential> => {
    const response = await apiClient.post<ApiResponse<CollectionCredential>>(
      '/issuance/collection/create',
      data,
    );
    return response.data.data;
  },

  /**
   * Get a collection credential by ID
   * Note: Backend TransformInterceptor wraps response in { data, statusCode, timestamp }
   */
  getCollectionCredential: async (id: string): Promise<CollectionCredential> => {
    const response = await apiClient.get<ApiResponse<CollectionCredential>>(
      `/issuance/collection/${id}`,
    );
    return response.data.data;
  },

  /**
   * Update a collection credential
   * Note: Backend TransformInterceptor wraps response in { data, statusCode, timestamp }
   */
  updateCollectionCredential: async (
    id: string,
    data: UpdateCollectionCredentialRequest,
  ): Promise<CollectionCredential> => {
    const response = await apiClient.put<ApiResponse<CollectionCredential>>(
      `/issuance/collection/${id}`,
      data,
    );
    return response.data.data;
  },

  /**
   * List collection credentials with optional filters
   * Note: Backend TransformInterceptor wraps response in { data, statusCode, timestamp }
   */
  listCollectionCredentials: async (
    filters?: CollectionCredentialFilters,
  ): Promise<CollectionCredential[]> => {
    const params = new URLSearchParams();
    if (filters?.nzbn) params.append('nzbn', filters.nzbn);
    if (filters?.orchardId) params.append('orchardId', filters.orchardId);
    if (filters?.pickerId) params.append('pickerId', filters.pickerId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    const url = `/issuance/collection${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get<ApiResponse<CollectionCredential[]>>(url);
    return response.data.data || [];
  },

  /**
   * Issue a collection credential via MATTR
   * Note: Backend TransformInterceptor wraps response in { data, statusCode, timestamp }
   */
  issueCollectionCredential: async (id: string): Promise<CollectionCredential> => {
    const response = await apiClient.post<ApiResponse<CollectionCredential>>(
      `/issuance/collection/${id}/issue`,
    );
    return response.data.data;
  },
};
