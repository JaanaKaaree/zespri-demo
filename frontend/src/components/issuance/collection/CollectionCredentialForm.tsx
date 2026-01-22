'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OrganisationPartSelector } from './OrganisationPartSelector';
import { CollectionCredentialFormData } from '@/types/collection-credential.types';
import { sessionStorage } from '@/lib/auth/session';

interface CollectionCredentialFormProps {
  initialData?: CollectionCredentialFormData;
  onSubmit: (data: CollectionCredentialFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const CollectionCredentialForm: React.FC<CollectionCredentialFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  // Get current date for default values
  const getDefaultDate = (hours: number, minutes: number = 0): string => {
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
  };

  // Get default end datetime (2 hours after start)
  const getDefaultEndDate = (startDate: string): string => {
    const date = new Date(startDate);
    date.setHours(date.getHours() + 2);
    return date.toISOString();
  };

  // Generate default bin identifier (BIN-YYYYMMDD-XXX)
  const getDefaultBinIdentifier = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `BIN-${year}${month}${day}-001`;
  };

  // Generate default row identifier (uses default NZBN)
  const getDefaultRowIdentifier = (): string => {
    return `9429050913510-ROW-AA`;
  };

  // Calculate default end datetime based on start datetime
  const defaultStartDate = initialData?.harvestStartDatetime || getDefaultDate(7, 35);
  const defaultEndDate = initialData?.harvestEndDatetime || getDefaultEndDate(defaultStartDate);

  const [formData, setFormData] = useState<CollectionCredentialFormData>({
    binIdentifier: initialData?.binIdentifier || getDefaultBinIdentifier(),
    rowIdentifier: initialData?.rowIdentifier || getDefaultRowIdentifier(),
    harvestStartDatetime: defaultStartDate,
    harvestEndDatetime: defaultEndDate,
    pickerId: initialData?.pickerId || '483472834',
    pickerName: initialData?.pickerName || 'John Doe',
    nzbn: initialData?.nzbn || '9429050913510',
    orchardId: initialData?.orchardId || '7000002073418',
    recipientDid: initialData?.recipientDid || '',
    recipientEmail: initialData?.recipientEmail || '',
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [collectionId, setCollectionId] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      if (initialData.nzbn) {
        // Collection ID will be auto-generated on submit
        setCollectionId('');
      }
    } else {
      // Reset to defaults when creating new credential
      const startDate = getDefaultDate(7, 35);
      setFormData({
        binIdentifier: getDefaultBinIdentifier(),
        rowIdentifier: getDefaultRowIdentifier(),
        harvestStartDatetime: startDate,
        harvestEndDatetime: getDefaultEndDate(startDate),
        pickerId: '483472834',
        pickerName: 'John Doe',
        nzbn: '9429050913510',
        orchardId: '7000002073418',
        recipientDid: '',
        recipientEmail: '',
      });
    }
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.binIdentifier.trim()) {
      newErrors.binIdentifier = 'Bin Identifier is required';
    }

    if (!formData.rowIdentifier.trim()) {
      newErrors.rowIdentifier = 'Row Identifier is required';
    }

    if (!formData.harvestStartDatetime) {
      newErrors.harvestStartDatetime = 'Harvest Start Datetime is required';
    }

    if (formData.harvestEndDatetime) {
      const startDate = new Date(formData.harvestStartDatetime);
      const endDate = new Date(formData.harvestEndDatetime);
      if (endDate <= startDate) {
        newErrors.harvestEndDatetime = 'Harvest End Datetime must be after Start Datetime';
      }
    }

    if (!formData.pickerId.trim()) {
      newErrors.pickerId = 'Picker ID is required';
    }

    if (!formData.pickerName.trim()) {
      newErrors.pickerName = 'Picker Name is required';
    }

    if (!formData.nzbn.trim()) {
      newErrors.nzbn = 'NZBN is required';
    } else if (!/^\d{13}$/.test(formData.nzbn)) {
      newErrors.nzbn = 'NZBN must be exactly 13 digits';
    }

    if (!formData.orchardId.trim()) {
      newErrors.orchardId = 'Orchard ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      // Error handling is done by parent component
      console.error('Form submission error:', error);
    }
  };

  const handleOrganisationPartSelect = (data: {
    nzbn: string;
    orchardId: string;
    organisationPart?: {
      opn?: string;
      name?: string;
      parentNzbn?: string;
      'custom-data'?: Array<{ key?: string; value?: string }>;
    };
  }) => {
    setFormData({
      ...formData,
      nzbn: data.nzbn,
      orchardId: data.orchardId,
      selectedOrganisationPart: data.organisationPart
        ? {
            opn: data.organisationPart.opn || '',
            name: data.organisationPart.name,
            nzbn: data.nzbn,
            orchardId: data.orchardId,
          }
        : undefined,
    });
    setErrors({ ...errors, nzbn: '', orchardId: '' });
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
    // Convert local datetime to ISO string with timezone
    const date = new Date(localString);
    return date.toISOString();
  };

  return (
    <Card title="Create Collection Credential">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Organisation Part Selector */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-medium text-gray-800 mb-3">
            Organisation & Orchard
          </h3>
          <OrganisationPartSelector
            onSelect={handleOrganisationPartSelect}
            initialNzbn={formData.nzbn}
            initialOrchardId={formData.orchardId}
            error={errors.nzbn || errors.orchardId}
          />
          {/* Display default values */}
          <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
            <div className="text-gray-700">
              <div><strong>Default NZBN:</strong> {formData.nzbn}</div>
              <div><strong>Default Orchard ID:</strong> {formData.orchardId}</div>
              <div className="text-xs text-gray-600 mt-1">
                You can change these values or select from organisation parts above
              </div>
            </div>
          </div>
        </div>

        {/* Bin and Row Identifiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Bin Identifier *"
            type="text"
            value={formData.binIdentifier}
            onChange={(e) => {
              setFormData({ ...formData, binIdentifier: e.target.value });
              setErrors({ ...errors, binIdentifier: '' });
            }}
            placeholder="e.g., BIN-20250110-001"
            error={errors.binIdentifier}
            required
          />

          <Input
            label="Row Identifier *"
            type="text"
            value={formData.rowIdentifier}
            onChange={(e) => {
              setFormData({ ...formData, rowIdentifier: e.target.value });
              setErrors({ ...errors, rowIdentifier: '' });
            }}
            placeholder="e.g., 9429000001001-ROW-AA"
            error={errors.rowIdentifier}
            required
          />
        </div>

        {/* Harvest Datetimes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Harvest Start Datetime *"
            type="datetime-local"
            value={formatDateTimeLocal(formData.harvestStartDatetime)}
            onChange={(e) => {
              setFormData({
                ...formData,
                harvestStartDatetime: parseDateTimeLocal(e.target.value),
              });
              setErrors({ ...errors, harvestStartDatetime: '' });
            }}
            error={errors.harvestStartDatetime}
            required
          />

          <Input
            label="Harvest End Datetime"
            type="datetime-local"
            value={formatDateTimeLocal(formData.harvestEndDatetime || '')}
            onChange={(e) => {
              setFormData({
                ...formData,
                harvestEndDatetime: e.target.value
                  ? parseDateTimeLocal(e.target.value)
                  : '',
              });
              setErrors({ ...errors, harvestEndDatetime: '' });
            }}
            error={errors.harvestEndDatetime}
          />
        </div>

        {/* Picker Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Picker ID *"
            type="text"
            value={formData.pickerId}
            onChange={(e) => {
              setFormData({ ...formData, pickerId: e.target.value });
              setErrors({ ...errors, pickerId: '' });
            }}
            placeholder="e.g., 483472834"
            error={errors.pickerId}
            required
          />

          <Input
            label="Picker Name *"
            type="text"
            value={formData.pickerName}
            onChange={(e) => {
              setFormData({ ...formData, pickerName: e.target.value });
              setErrors({ ...errors, pickerName: '' });
            }}
            placeholder="Picker name from scan"
            error={errors.pickerName}
            required
          />
        </div>

        {/* Collection ID (read-only, auto-generated) */}
        {collectionId && (
          <Input
            label="Collection ID"
            type="text"
            value={collectionId}
            readOnly
            className="bg-gray-50"
          />
        )}

        {/* Recipient Information (Optional) */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-800 mb-3">
            Recipient (Optional)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Recipient DID"
              type="text"
              value={formData.recipientDid || ''}
              onChange={(e) =>
                setFormData({ ...formData, recipientDid: e.target.value })
              }
              placeholder="Decentralized Identifier"
            />

            <Input
              label="Recipient Email"
              type="email"
              value={formData.recipientEmail || ''}
              onChange={(e) =>
                setFormData({ ...formData, recipientEmail: e.target.value })
              }
              placeholder="email@example.com"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create Credential
          </Button>
        </div>
      </form>
    </Card>
  );
};
