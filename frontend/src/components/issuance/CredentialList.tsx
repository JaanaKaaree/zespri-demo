'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Credential } from '@/types/issuance.types';

interface CredentialListProps {
  credentials: Credential[];
  onStatusCheck?: (id: string) => void;
}

export const CredentialList: React.FC<CredentialListProps> = ({
  credentials,
  onStatusCheck,
}) => {
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

  if (credentials.length === 0) {
    return (
      <Card>
        <p className="text-gray-500 text-center py-8">
          No credentials created yet.
        </p>
      </Card>
    );
  }

  return (
    <Card title="Credentials">
      <div className="space-y-4">
        {credentials.map((credential) => (
          <div
            key={credential.id}
            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {credential.id}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      credential.status,
                    )}`}
                  >
                    {credential.status}
                  </span>
                </div>
                {credential.credentialId && (
                  <p className="text-sm text-gray-600">
                    Credential ID: {credential.credentialId}
                  </p>
                )}
                {credential.templateId && (
                  <p className="text-sm text-gray-600">
                    Template: {credential.templateId}
                  </p>
                )}
              </div>
              {onStatusCheck && (
                <button
                  onClick={() => onStatusCheck(credential.id)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Check Status
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
