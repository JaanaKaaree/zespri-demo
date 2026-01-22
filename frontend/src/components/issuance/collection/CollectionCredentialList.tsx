'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CollectionCredential } from '@/types/collection-credential.types';

interface CollectionCredentialListProps {
  credentials: CollectionCredential[];
  onView?: (credential: CollectionCredential) => void;
  onIssue?: (credential: CollectionCredential) => void;
  onCreate?: () => void;
  statusFilter?: 'pending' | 'issued' | 'failed' | 'all';
  onStatusFilterChange?: (filter: 'pending' | 'issued' | 'failed' | 'all') => void;
}

export const CollectionCredentialList: React.FC<CollectionCredentialListProps> = ({
  credentials,
  onView,
  onIssue,
  onCreate,
  statusFilter = 'all',
  onStatusFilterChange,
}) => {
  // Filter credentials based on status
  const filteredCredentials =
    statusFilter === 'all'
      ? credentials
      : credentials.filter((cred) => cred.status === statusFilter);

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

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return 'N/A';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleString('en-NZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Collection Credentials</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredCredentials.length} credential{filteredCredentials.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {onStatusFilterChange && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700 font-medium">Filter:</label>
              <select
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={statusFilter}
                onChange={(e) =>
                  onStatusFilterChange(
                    e.target.value as 'pending' | 'issued' | 'failed' | 'all',
                  )
                }
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="issued">Issued</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          )}
          {onCreate && <Button onClick={onCreate}>Create Collection Credential</Button>}
        </div>
      </div>

      {filteredCredentials.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No collection credentials found.</p>
          {onCreate && (
            <Button onClick={onCreate}>Create Your First Collection Credential</Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCredentials.map((credential) => (
            <div
              key={credential.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {credential.collectionId}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        credential.status,
                      )}`}
                    >
                      {credential.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Bin ID:</span>
                      <p className="font-medium text-gray-900">{credential.binIdentifier}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Row ID:</span>
                      <p className="font-medium text-gray-900">{credential.rowIdentifier}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Picker:</span>
                      <p className="font-medium text-gray-900">{credential.pickerName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Orchard:</span>
                      <p className="font-medium text-gray-900">{credential.orchardId}</p>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Harvest Start:</span>{' '}
                      {formatDate(credential.harvestStartDatetime)}
                    </div>
                    {credential.harvestEndDatetime && (
                      <div>
                        <span className="font-medium">Harvest End:</span>{' '}
                        {formatDate(credential.harvestEndDatetime)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  {onView && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onView(credential)}
                    >
                      View
                    </Button>
                  )}
                  {onIssue && credential.status === 'pending' && (
                    <Button size="sm" onClick={() => onIssue(credential)}>
                      Issue
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
