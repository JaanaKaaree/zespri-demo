'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { collectionCredentialApi } from '@/lib/api/collection-credential.api';
import { CollectionCredential } from '@/types/collection-credential.types';

export default function CollectionCredentialDetailPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [credential, setCredential] = useState<CollectionCredential | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [error, setError] = useState('');
  const [harvestEndDatetime, setHarvestEndDatetime] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (id && isAuthenticated && !authLoading) {
      loadCredential();
    }
  }, [id, isAuthenticated, authLoading]);

  const loadCredential = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await collectionCredentialApi.getCollectionCredential(id);
      setCredential(data);
      setHarvestEndDatetime(
        data.harvestEndDatetime
          ? formatDateTimeLocal(data.harvestEndDatetime)
          : '',
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load collection credential.');
      console.error('Error loading credential:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateHarvestEnd = async () => {
    if (!harvestEndDatetime) {
      setError('Please enter a harvest end datetime');
      return;
    }

    setIsUpdating(true);
    setError('');
    try {
      const updated = await collectionCredentialApi.updateCollectionCredential(id, {
        harvestEndDatetime: parseDateTimeLocal(harvestEndDatetime),
      });
      setCredential(updated);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update credential.');
      console.error('Error updating credential:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleIssue = async () => {
    setIsIssuing(true);
    setError('');
    try {
      const updated = await collectionCredentialApi.issueCollectionCredential(id);
      setCredential(updated);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to issue credential.');
      console.error('Error issuing credential:', err);
    } finally {
      setIsIssuing(false);
    }
  };

  const formatDateTimeLocal = (isoString: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const parseDateTimeLocal = (localString: string): string => {
    if (!localString) return '';
    const date = new Date(localString);
    return date.toISOString();
  };

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return 'N/A';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleString('en-NZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

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

  if (!credential) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Collection credential not found.</p>
            <Button onClick={() => router.push('/issuance/collection')}>
              Back to Collection Credentials
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="secondary" onClick={() => router.push('/issuance/collection')}>
          ← Back to Collection Credentials
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <Card title="Collection Credential Details">
        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                credential.status,
              )}`}
            >
              {credential.status.toUpperCase()}
            </span>
          </div>

          {/* Collection ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Collection ID
            </label>
            <p className="text-lg font-semibold text-gray-900">{credential.collectionId}</p>
          </div>

          {/* Bin and Row Identifiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bin Identifier
              </label>
              <p className="text-gray-900">{credential.binIdentifier}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Row Identifier
              </label>
              <p className="text-gray-900">{credential.rowIdentifier}</p>
            </div>
          </div>

          {/* Harvest Datetimes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Harvest Start Datetime
              </label>
              <p className="text-gray-900">{formatDate(credential.harvestStartDatetime)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Harvest End Datetime
              </label>
              {credential.harvestEndDatetime ? (
                <p className="text-gray-900">{formatDate(credential.harvestEndDatetime)}</p>
              ) : (
                <div className="space-y-2">
                  <Input
                    type="datetime-local"
                    value={harvestEndDatetime}
                    onChange={(e) => setHarvestEndDatetime(e.target.value)}
                    placeholder="Set harvest end datetime"
                  />
                  <Button
                    size="sm"
                    onClick={handleUpdateHarvestEnd}
                    isLoading={isUpdating}
                  >
                    Update End Time
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Picker Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Picker ID</label>
              <p className="text-gray-900">{credential.pickerId}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Picker Name</label>
              <p className="text-gray-900">{credential.pickerName}</p>
            </div>
          </div>

          {/* Organisation Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NZBN</label>
              <p className="text-gray-900">{credential.nzbn}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Orchard ID</label>
              <p className="text-gray-900">{credential.orchardId}</p>
            </div>
          </div>

          {/* Recipient Information */}
          {(credential.recipientDid || credential.recipientEmail) && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Recipient</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {credential.recipientDid && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recipient DID
                    </label>
                    <p className="text-gray-900">{credential.recipientDid}</p>
                  </div>
                )}
                {credential.recipientEmail && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recipient Email
                    </label>
                    <p className="text-gray-900">{credential.recipientEmail}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* QR Code */}
          {credential.qrCode?.qrcode && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-800 mb-3">QR Code</h3>
              <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                <img
                  src={`data:${credential.qrCode.type || 'image/png'};base64,${credential.qrCode.qrcode}`}
                  alt="Credential QR Code"
                  className="max-w-xs w-full h-auto"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2 text-center">
                Scan this QR code to view the credential in a wallet
              </p>
            </div>
          )}

          {/* MATTR Credential Information */}
          {credential.credentialId && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-800 mb-3">MATTR Credential</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Credential ID:</span>{' '}
                  <span className="text-gray-900">{credential.credentialId}</span>
                </div>
                {credential.issuanceUrl && (
                  <div>
                    <span className="font-medium text-gray-700">Issuance URL:</span>{' '}
                    <a
                      href={credential.issuanceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {credential.issuanceUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="border-t pt-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Created:</span> {formatDate(credential.createdAt)}
            </div>
            {credential.updatedAt && (
              <div>
                <span className="font-medium">Updated:</span> {formatDate(credential.updatedAt)}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t pt-4 flex gap-4">
            {credential.status === 'pending' && (
              <Button onClick={handleIssue} isLoading={isIssuing}>
                Issue Credential
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
