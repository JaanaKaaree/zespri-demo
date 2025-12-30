'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { issuanceApi } from '@/lib/api/issuance.api';
import { CredentialStatus } from '@/lib/api/types';

export default function CredentialDetailPage() {
  const { id } = useParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [credential, setCredential] = useState<CredentialStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (id && isAuthenticated) {
      loadCredential();
    }
  }, [id, isAuthenticated]);

  const loadCredential = async () => {
    setIsLoading(true);
    setError('');

    try {
      const status = await issuanceApi.getCredentialStatus(id as string);
      setCredential(status);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to load credential details.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error) {
    return (
      <Card>
        <div className="text-red-600">{error}</div>
      </Card>
    );
  }

  if (!credential) {
    return (
      <Card>
        <div className="text-gray-600">Credential not found.</div>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'issued':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Credential Details</h1>
      </div>

      <Card>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">ID</label>
            <p className="mt-1 text-gray-900 font-mono">{credential.id}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Status</label>
            <div className="mt-1">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  credential.status,
                )}`}
              >
                {credential.status}
              </span>
            </div>
          </div>

          {credential.credentialId && (
            <div>
              <label className="text-sm font-medium text-gray-700">
                Credential ID
              </label>
              <p className="mt-1 text-gray-900 font-mono">
                {credential.credentialId}
              </p>
            </div>
          )}

          {credential.error && (
            <div>
              <label className="text-sm font-medium text-gray-700">Error</label>
              <p className="mt-1 text-red-600">{credential.error}</p>
            </div>
          )}

          <div className="pt-4">
            <button
              onClick={loadCredential}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh Status
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
