'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { organisationsApi, nzbnOAuthApi } from '@/lib/api/organisations.api';
import { OrganisationPart } from '@/types/organisation.types';

interface OrganisationPartSelectorProps {
  onSelect: (data: {
    nzbn: string;
    orchardId: string;
    organisationPart?: OrganisationPart;
  }) => void;
  initialNzbn?: string;
  initialOrchardId?: string;
  error?: string;
}

export const OrganisationPartSelector: React.FC<OrganisationPartSelectorProps> = ({
  onSelect,
  initialNzbn,
  initialOrchardId,
  error: externalError,
}) => {
  const [nzbn, setNzbn] = useState(initialNzbn || '');
  const [parts, setParts] = useState<OrganisationPart[]>([]);
  const [selectedPart, setSelectedPart] = useState<OrganisationPart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showParts, setShowParts] = useState(false);

  useEffect(() => {
    if (initialNzbn && initialNzbn !== nzbn) {
      setNzbn(initialNzbn);
      if (initialNzbn.length === 13) {
        loadParts(initialNzbn);
      }
    }
  }, [initialNzbn]);

  const loadParts = async (nzbnToLoad: string) => {
    if (nzbnToLoad.length !== 13) {
      setError('NZBN must be exactly 13 digits');
      return;
    }

    setIsLoading(true);
    setError('');
    setShowParts(false);

    try {
      const response = await organisationsApi.getOrganisationParts(nzbnToLoad);
      setParts(response);
      setShowParts(true);

      // If we have an initial orchard ID, try to find and select the matching part
      if (initialOrchardId && response.length > 0) {
        const matchingPart = response.find((part) => {
          // Look for orchard ID in custom-data
          const orchardIdInCustomData = part['custom-data']?.find(
            (item) => item.key === 'orchardId' && item.value === initialOrchardId,
          );
          return orchardIdInCustomData;
        });

        if (matchingPart) {
          handlePartSelect(matchingPart);
        }
      }
    } catch (err: any) {
      const errorCode = err.response?.data?.error?.error || err.response?.data?.error;
      const errorMessage = err.response?.data?.message || err.message;

      // Check if OAuth is needed
      if (
        err.response?.status === 401 &&
        (errorCode === 'OAUTH_TOKEN_MISSING' ||
          errorCode === 'OAUTH_TOKEN_EXPIRED' ||
          errorMessage?.includes('OAuth token') ||
          errorMessage?.includes('connect your NZBN account'))
      ) {
        // Trigger OAuth flow
        try {
          const authorizationUrl = await nzbnOAuthApi.getAuthorizationUrl();
          window.location.href = authorizationUrl;
          return;
        } catch (oauthErr: any) {
          setError('Failed to initiate OAuth flow. Please try again.');
        }
      } else {
        setError(errorMessage || 'Failed to load organisation parts');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNzbnChange = (value: string) => {
    setNzbn(value);
    setSelectedPart(null);
    setParts([]);
    setShowParts(false);
    setError('');
  };

  const handleNzbnSubmit = () => {
    if (nzbn.length === 13) {
      loadParts(nzbn);
    } else {
      setError('NZBN must be exactly 13 digits');
    }
  };

  const handlePartSelect = (part: OrganisationPart) => {
    setSelectedPart(part);

    // Extract Orchard ID from custom-data
    let orchardId = '';
    if (part['custom-data'] && part['custom-data'].length > 0) {
      const orchardIdItem = part['custom-data'].find((item) => item.key === 'orchardId');
      if (orchardIdItem?.value) {
        orchardId = orchardIdItem.value;
      }
    }

    // If no orchard ID in custom-data, use OPN or name as fallback
    if (!orchardId) {
      orchardId = part.opn || part.name || '';
    }

    // Call onSelect callback
    onSelect({
      nzbn: part.parentNzbn || nzbn,
      orchardId,
      organisationPart: part,
    });
  };

  const extractOrchardId = (part: OrganisationPart): string => {
    if (part['custom-data'] && part['custom-data'].length > 0) {
      const orchardIdItem = part['custom-data'].find((item) => item.key === 'orchardId');
      if (orchardIdItem?.value) {
        return orchardIdItem.value;
      }
    }
    return part.opn || part.name || '';
  };

  return (
    <div className="space-y-4">
      <div>
        <Input
          label="NZBN"
          type="text"
          value={nzbn}
          onChange={(e) => handleNzbnChange(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && nzbn.length === 13) {
              handleNzbnSubmit();
            }
          }}
          placeholder="Enter 13-digit NZBN"
          maxLength={13}
          error={error || externalError}
        />
        {nzbn.length === 13 && !showParts && !isLoading && (
          <Button
            type="button"
            onClick={handleNzbnSubmit}
            className="mt-2"
            size="sm"
          >
            Load Organisation Parts
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="text-sm text-gray-600">Loading organisation parts...</div>
      )}

      {showParts && parts.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Organisation Part
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedPart?.opn || ''}
            onChange={(e) => {
              const part = parts.find((p) => p.opn === e.target.value);
              if (part) {
                handlePartSelect(part);
              }
            }}
          >
            <option value="">-- Select Organisation Part --</option>
            {parts.map((part) => (
              <option key={part.opn} value={part.opn}>
                {part.name || part.opn} {part.opn ? `(${part.opn})` : ''}
              </option>
            ))}
          </select>

          {selectedPart && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm">
                <div className="font-medium text-gray-700">Selected Part:</div>
                <div className="mt-1 text-gray-600">
                  <div>Name: {selectedPart.name || 'N/A'}</div>
                  <div>OPN: {selectedPart.opn || 'N/A'}</div>
                  <div>NZBN: {selectedPart.parentNzbn || nzbn}</div>
                  <div>Orchard ID: {extractOrchardId(selectedPart)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showParts && parts.length === 0 && !isLoading && (
        <div className="text-sm text-gray-600">
          No organisation parts found for this NZBN.
        </div>
      )}
    </div>
  );
};
