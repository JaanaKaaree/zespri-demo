'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DeliveryCredentialForm } from '@/components/issuance/delivery/DeliveryCredentialForm';
import { DeliveryCredentialList } from '@/components/issuance/delivery/DeliveryCredentialList';
import { deliveryCredentialApi } from '@/lib/api/delivery-credential.api';
import {
  DeliveryCredential,
  DeliveryCredentialFormData,
} from '@/types/delivery-credential.types';
import { sessionStorage } from '@/lib/auth/session';

export default function DeliveryCredentialPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [credentials, setCredentials] = useState<DeliveryCredential[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<
    'pending' | 'issued' | 'failed' | 'all'
  >('all');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadCredentials();
    }
  }, [isAuthenticated, authLoading, statusFilter]);

  const loadCredentials = async () => {
    setIsLoading(true);
    setError('');
    try {
      const credentialsList = await deliveryCredentialApi.listDeliveryCredentials({
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setCredentials(credentialsList);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load delivery credentials.');
      console.error('Error loading credentials:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCredential = async (data: DeliveryCredentialFormData) => {
    setIsSubmitting(true);
    setError('');

    try {
      // Get session ID for OAuth token retrieval (if needed)
      const session = sessionStorage.get();
      const sessionId = session?.sessionId;

      await deliveryCredentialApi.createDeliveryCredential({
        originAddress: data.originAddress,
        destinationAddress: data.destinationAddress,
        deliveryStartDatetime: data.deliveryStartDatetime,
        deliveryEndDatetime: data.deliveryEndDatetime,
        driverId: data.driverId,
        driverName: data.driverName,
        vehicleId: data.vehicleId,
        collectionId: data.collectionId,
        nzbn: data.nzbn,
        recipientDid: data.recipientDid,
        recipientEmail: data.recipientEmail,
        sessionId,
      });

      // Reload credentials list to ensure we have the latest data
      await loadCredentials();
      setShowForm(false);
      setError('');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Failed to create delivery credential. Please try again.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewCredential = (credential: DeliveryCredential) => {
    router.push(`/issuance/delivery/${credential.id}`);
  };

  const handleIssueCredential = async (credential: DeliveryCredential) => {
    try {
      await deliveryCredentialApi.issueDeliveryCredential(credential.id);
      // Reload credentials list to ensure we have the latest data
      await loadCredentials();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to issue credential.');
      console.error('Error issuing credential:', err);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setError('');
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Delivery Credentials</h1>
        <p className="text-gray-600 mt-2">
          Create and manage delivery credentials for produce transportation
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {showForm ? (
        <DeliveryCredentialForm
          onSubmit={handleCreateCredential}
          onCancel={handleFormCancel}
          isLoading={isSubmitting}
        />
      ) : (
        <DeliveryCredentialList
          credentials={credentials}
          onView={handleViewCredential}
          onIssue={handleIssueCredential}
          onCreate={() => setShowForm(true)}
          statusFilter={statusFilter}
          onStatusFilterChange={(filter) => {
            setStatusFilter(filter);
          }}
        />
      )}

      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <p className="text-gray-600">Loading credentials...</p>
        </div>
      )}
    </div>
  );
}
