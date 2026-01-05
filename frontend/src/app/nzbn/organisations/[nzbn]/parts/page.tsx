'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { OrganisationPartList } from '@/components/organisations/OrganisationPartList';
import { OrganisationPartForm } from '@/components/organisations/OrganisationPartForm';
import { organisationsApi, nzbnOAuthApi } from '@/lib/api/organisations.api';
import { OrganisationPart } from '@/types/organisation.types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function OrganisationPartsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const nzbn = params.nzbn as string;

  const [parts, setParts] = useState<OrganisationPart[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPart, setEditingPart] = useState<OrganisationPart | null>(null);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ACTIVE');

  // Redirect to organisations page if nzbn is missing or invalid
  useEffect(() => {
    if (!nzbn || nzbn === 'undefined') {
      router.push('/nzbn/organisations');
      return;
    }
  }, [nzbn, router]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Load organisation parts when NZBN and authenticated
  useEffect(() => {
    if (nzbn && nzbn !== 'undefined' && isAuthenticated && !authLoading) {
      loadParts();
    }
  }, [nzbn, isAuthenticated, authLoading]);

  const loadParts = async () => {
    if (!nzbn || nzbn === 'undefined') {
      console.log('[loadParts] Skipping loadParts - nzbn is invalid:', nzbn);
      return;
    }
    
    console.log('[loadParts] Starting loadParts for NZBN:', nzbn);
    setIsLoading(true);
    setError('');
    try {
      const response = await organisationsApi.getOrganisationParts(nzbn);
      console.log('[loadParts] Successfully loaded parts:', response);
      setParts(response);
    } catch (err: any) {
      console.log('[loadParts] ERROR CAUGHT - Full error object:', err);
      console.log('[loadParts] Error type:', err.constructor.name);
      console.log('[loadParts] Error response exists:', !!err.response);
      console.log('[loadParts] Error response data:', err.response?.data);
      console.log('[loadParts] Error response status:', err.response?.status);
      console.log('[loadParts] Error message:', err.message);
      
      const errorMessage = err.response?.data?.message || err.message;
      console.log('[loadParts] Extracted error message:', errorMessage);
      
      // HttpExceptionFilter wraps exception in error field, so check both error.error and error
      const errorCode = err.response?.data?.error?.error || err.response?.data?.error;
      console.log('[loadParts] Extracted error code:', errorCode);
      console.log('[loadParts] Error code path 1 (error.error):', err.response?.data?.error?.error);
      console.log('[loadParts] Error code path 2 (error):', err.response?.data?.error);
      console.log('[loadParts] Full error data JSON:', JSON.stringify(err.response?.data, null, 2));
      
      console.log('[loadParts] Checking conditions for OAuth flow:');
      console.log('[loadParts] - Status is 401?', err.response?.status === 401);
      console.log('[loadParts] - Error code is OAUTH_TOKEN_MISSING?', errorCode === 'OAUTH_TOKEN_MISSING');
      console.log('[loadParts] - Error code is OAUTH_TOKEN_EXPIRED?', errorCode === 'OAUTH_TOKEN_EXPIRED');
      console.log('[loadParts] - Error message includes OAuth token?', errorMessage?.includes('OAuth token'));
      console.log('[loadParts] - Error message includes connect your NZBN account?', errorMessage?.includes('connect your NZBN account'));
      
      // Check if error is due to missing OAuth token - automatically trigger OAuth flow
      const shouldTriggerOAuth = err.response?.status === 401 &&
        (errorCode === 'OAUTH_TOKEN_MISSING' ||
          errorCode === 'OAUTH_TOKEN_EXPIRED' ||
          errorMessage?.includes('OAuth token') ||
          errorMessage?.includes('connect your NZBN account'));
      
      console.log('[loadParts] Should trigger OAuth flow?', shouldTriggerOAuth);
      
      if (shouldTriggerOAuth) {
        console.log('[loadParts] ✓ OAuth token missing/expired, triggering OAuth flow');
        // Store NZBN in sessionStorage so we can redirect back after OAuth callback
        if (nzbn && nzbn !== 'undefined') {
          console.log('[loadParts] Storing NZBN in sessionStorage:', nzbn);
          sessionStorage.setItem('nzbn_oauth_redirect', nzbn);
        }
        // Get authorization URL via authenticated request, then redirect
        try {
          console.log('[loadParts] Calling nzbnOAuthApi.getAuthorizationUrl()...');
          const authorizationUrl = await nzbnOAuthApi.getAuthorizationUrl();
          console.log('[loadParts] ✓ Got authorization URL from API');
          console.log('[loadParts] Full authorization URL:', authorizationUrl);
          console.log('[loadParts] Authorization URL length:', authorizationUrl?.length);
          if (!authorizationUrl) {
            throw new Error('Authorization URL is undefined');
          }
          console.log('[loadParts] About to redirect to OAuth authorization URL...');
          console.log('[loadParts] Redirecting to:', authorizationUrl);
          window.location.href = authorizationUrl;
          return; // Exit early, redirect is happening
        } catch (oauthErr: any) {
          console.error('[loadParts] ✗ Failed to get OAuth authorization URL:', oauthErr);
          console.error('[loadParts] Error details:', oauthErr.response?.data || oauthErr.message);
          setError('Failed to initiate OAuth flow. Please try again.');
        }
      } else {
        console.log('[loadParts] ✗ Not triggering OAuth flow, setting error message');
        setError(errorMessage || 'Failed to load organisation parts');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPart(null);
    setShowForm(true);
  };

  const handleEdit = async (part: OrganisationPart) => {
    if (!part.opn) {
      setError('Cannot edit organisation part: OPN is missing');
      return;
    }
    try {
      // Fetch the full organisation part to get all fields including phone numbers
      const fullPart = await organisationsApi.getOrganisationPart(nzbn, part.opn);
      setEditingPart(fullPart);
      setShowForm(true);
    } catch (err: any) {
      const errorCode = err.response?.data?.error?.error || err.response?.data?.error;
      if (
        err.response?.status === 401 &&
        (errorCode === 'OAUTH_TOKEN_MISSING' || errorCode === 'OAUTH_TOKEN_EXPIRED')
      ) {
        // Get authorization URL via authenticated request, then redirect
        try {
          const authorizationUrl = await nzbnOAuthApi.getAuthorizationUrl();
          window.location.href = authorizationUrl;
          return;
        } catch (oauthErr: any) {
          setError('Failed to initiate OAuth flow. Please try again.');
        }
      }
      setError(err.response?.data?.message || err.message || 'Failed to load organisation part');
    }
  };

  const handleToggleStatus = async (part: OrganisationPart) => {
    if (!part.opn) return;
    
    const isActive = part.organisationPartStatus === 'ACTIVE';
    const action = isActive ? 'deactivate' : 'activate';
    
    if (!confirm(`Are you sure you want to ${action} organisation part ${part.opn}?`)) {
      return;
    }

    try {
      // Use update API to change status
      await organisationsApi.updateOrganisationPart(nzbn, part.opn, {
        ...part,
        organisationPartStatus: isActive ? 'INACTIVE' : 'ACTIVE',
      });
      await loadParts();
    } catch (err: any) {
      const errorCode = err.response?.data?.error?.error || err.response?.data?.error;
      if (
        err.response?.status === 401 &&
        (errorCode === 'OAUTH_TOKEN_MISSING' || errorCode === 'OAUTH_TOKEN_EXPIRED')
      ) {
        // Get authorization URL via authenticated request, then redirect
        try {
          const authorizationUrl = await nzbnOAuthApi.getAuthorizationUrl();
          window.location.href = authorizationUrl;
          return;
        } catch (oauthErr: any) {
          setError('Failed to initiate OAuth flow. Please try again.');
        }
      }
      setError(err.response?.data?.message || err.message || `Failed to ${action} organisation part`);
    }
  };

  const handleFormSubmit = async (data: OrganisationPart) => {
    try {
      if (editingPart?.opn) {
        await organisationsApi.updateOrganisationPart(nzbn, editingPart.opn, data);
      } else {
        await organisationsApi.createOrganisationPart(nzbn, {
          termsAndConditionsAccepted: true,
          organisationPart: data,
        });
      }
      await loadParts();
      setShowForm(false);
      setEditingPart(null);
    } catch (err: any) {
      const errorCode = err.response?.data?.error?.error || err.response?.data?.error;
      if (
        err.response?.status === 401 &&
        (errorCode === 'OAUTH_TOKEN_MISSING' || errorCode === 'OAUTH_TOKEN_EXPIRED')
      ) {
        // Get authorization URL via authenticated request, then redirect
        try {
          const authorizationUrl = await nzbnOAuthApi.getAuthorizationUrl();
          window.location.href = authorizationUrl;
          return;
        } catch (oauthErr: any) {
          setError('Failed to initiate OAuth flow. Please try again.');
        }
      }
      setError(err.response?.data?.message || err.message || 'Failed to save organisation part');
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingPart(null);
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

  // Redirect if nzbn is missing or invalid
  if (!nzbn || nzbn === 'undefined') {
    return null; // useEffect will handle redirect
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push('/nzbn/organisations')}
          >
            ← Back to NZBN Selection
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Organisation Parts</h1>
          <p className="text-sm text-gray-600 mt-1">NZBN: {nzbn}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {showForm ? (
        <OrganisationPartForm
          nzbn={nzbn}
          initialData={editingPart || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      ) : (
        <OrganisationPartList
          nzbn={nzbn}
          parts={parts}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
          onCreate={handleCreate}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      )}

      {isLoading && (
        <div className="text-center py-4">
          <p className="text-gray-600">Loading organisation parts...</p>
        </div>
      )}
    </div>
  );
}
