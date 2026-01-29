'use client';

import React, { useState, useEffect } from 'react';
import { collectionCredentialApi } from '@/lib/api/collection-credential.api';
import { CollectionCredential } from '@/types/collection-credential.types';

interface CollectionCredentialSelectorProps {
  onSelect: (collectionCredential: CollectionCredential | null) => void;
  initialCollectionId?: string;
  error?: string;
}

export const CollectionCredentialSelector: React.FC<CollectionCredentialSelectorProps> = ({
  onSelect,
  initialCollectionId,
  error: externalError,
}) => {
  const [collections, setCollections] = useState<CollectionCredential[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(initialCollectionId || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCollections();
  }, []);

  useEffect(() => {
    if (initialCollectionId && initialCollectionId !== selectedCollectionId) {
      setSelectedCollectionId(initialCollectionId);
      // Find and select the matching collection
      const matchingCollection = collections.find(
        (c) => c.collectionId === initialCollectionId || c.id === initialCollectionId,
      );
      if (matchingCollection) {
        handleSelect(matchingCollection);
      }
    }
  }, [initialCollectionId, collections]);

  const loadCollections = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await collectionCredentialApi.listCollectionCredentials({
        status: 'issued', // Only show issued collection credentials
      });
      setCollections(response);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load collection credentials';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (collection: CollectionCredential | null) => {
    setSelectedCollectionId(collection?.collectionId || collection?.id || '');
    onSelect(collection);
    setError('');
  };

  const displayError = externalError || error;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Link to Collection Credential (Optional)
      </label>
      
      {isLoading ? (
        <div className="text-sm text-gray-600">Loading collection credentials...</div>
      ) : (
        <select
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            displayError ? 'border-red-500' : 'border-gray-300'
          }`}
          value={selectedCollectionId}
          onChange={(e) => {
            const collection = collections.find(
              (c) => c.collectionId === e.target.value || c.id === e.target.value,
            );
            handleSelect(collection || null);
          }}
        >
          <option value="">None (No collection linked)</option>
          {collections.map((collection) => (
            <option key={collection.id} value={collection.collectionId || collection.id}>
              {collection.collectionId} - {collection.binIdentifier} / {collection.rowIdentifier}
            </option>
          ))}
        </select>
      )}

      {displayError && (
        <p className="text-sm text-red-600">{displayError}</p>
      )}

      {selectedCollectionId && (
        <div className="mt-2 p-2 bg-blue-50 rounded-lg text-sm">
          <div className="text-gray-700">
            <div><strong>Collection ID:</strong> {selectedCollectionId}</div>
            {collections.find((c) => c.collectionId === selectedCollectionId || c.id === selectedCollectionId) && (
              <>
                <div><strong>Bin:</strong> {collections.find((c) => c.collectionId === selectedCollectionId || c.id === selectedCollectionId)?.binIdentifier}</div>
                <div><strong>Row:</strong> {collections.find((c) => c.collectionId === selectedCollectionId || c.id === selectedCollectionId)?.rowIdentifier}</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
