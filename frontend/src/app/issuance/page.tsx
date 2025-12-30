'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { CredentialForm } from '@/components/issuance/CredentialForm';
import { CredentialList } from '@/components/issuance/CredentialList';
import { issuanceApi } from '@/lib/api/issuance.api';
import { CredentialFormData, Credential } from '@/types/issuance.types';

export default function IssuancePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleCreateCredential = async (data: CredentialFormData) => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await issuanceApi.createCredential(data);
      setCredentials((prev) => [
        {
          ...response,
          templateId: data.templateId,
          credentialData: data.credentialData,
          createdAt: new Date(),
        },
        ...prev,
      ]);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to create credential. Please try again.',
      );
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusCheck = async (id: string) => {
    try {
      const status = await issuanceApi.getCredentialStatus(id);
      setCredentials((prev) =>
        prev.map((cred) =>
          cred.id === id ? { ...cred, status: status.status } : cred,
        ),
      );
    } catch (err) {
      console.error('Error checking status:', err);
    }
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
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Credential Issuance</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <CredentialForm onSubmit={handleCreateCredential} isLoading={isSubmitting} />

      <CredentialList credentials={credentials} onStatusCheck={handleStatusCheck} />
    </div>
  );
}
