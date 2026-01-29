import apiClient from './client';
import { ApiResponse } from './types';
import {
  DeliveryCredential,
  CreateDeliveryCredentialRequest,
  UpdateDeliveryCredentialRequest,
  DeliveryCredentialFilters,
} from '@/types/delivery-credential.types';

export const deliveryCredentialApi = {
  /**
   * Create a new delivery credential
   * Note: Backend TransformInterceptor wraps response in { data, statusCode, timestamp }
   */
  createDeliveryCredential: async (
    data: CreateDeliveryCredentialRequest,
  ): Promise<DeliveryCredential> => {
    const response = await apiClient.post<ApiResponse<DeliveryCredential>>(
      '/issuance/delivery/create',
      data,
    );
    return response.data.data;
  },

  /**
   * Get a delivery credential by ID
   * Note: Backend TransformInterceptor wraps response in { data, statusCode, timestamp }
   */
  getDeliveryCredential: async (id: string): Promise<DeliveryCredential> => {
    const response = await apiClient.get<ApiResponse<DeliveryCredential>>(
      `/issuance/delivery/${id}`,
    );
    return response.data.data;
  },

  /**
   * Update a delivery credential
   * Note: Backend TransformInterceptor wraps response in { data, statusCode, timestamp }
   */
  updateDeliveryCredential: async (
    id: string,
    data: UpdateDeliveryCredentialRequest,
  ): Promise<DeliveryCredential> => {
    const response = await apiClient.put<ApiResponse<DeliveryCredential>>(
      `/issuance/delivery/${id}`,
      data,
    );
    return response.data.data;
  },

  /**
   * List delivery credentials with optional filters
   * Note: Backend TransformInterceptor wraps response in { data, statusCode, timestamp }
   */
  listDeliveryCredentials: async (
    filters?: DeliveryCredentialFilters,
  ): Promise<DeliveryCredential[]> => {
    const params = new URLSearchParams();
    if (filters?.nzbn) params.append('nzbn', filters.nzbn);
    if (filters?.driverId) params.append('driverId', filters.driverId);
    if (filters?.vehicleId) params.append('vehicleId', filters.vehicleId);
    if (filters?.collectionId) params.append('collectionId', filters.collectionId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    const url = `/issuance/delivery${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get<ApiResponse<DeliveryCredential[]>>(url);
    return response.data.data || [];
  },

  /**
   * Issue a delivery credential via MATTR
   * Note: Backend TransformInterceptor wraps response in { data, statusCode, timestamp }
   */
  issueDeliveryCredential: async (id: string): Promise<DeliveryCredential> => {
    const response = await apiClient.post<ApiResponse<DeliveryCredential>>(
      `/issuance/delivery/${id}/issue`,
    );
    return response.data.data;
  },
};
