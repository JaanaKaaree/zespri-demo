'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OrganisationPartSelector } from '../collection/OrganisationPartSelector';
import { CollectionCredentialSelector } from './CollectionCredentialSelector';
import { DeliveryCredentialFormData } from '@/types/delivery-credential.types';
import { CollectionCredential } from '@/types/collection-credential.types';

interface DeliveryCredentialFormProps {
  initialData?: DeliveryCredentialFormData;
  onSubmit: (data: DeliveryCredentialFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const DeliveryCredentialForm: React.FC<DeliveryCredentialFormProps> = ({
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

  // Calculate default end datetime based on start datetime
  const defaultStartDate = initialData?.deliveryStartDatetime || getDefaultDate(8, 0);
  const defaultEndDate = initialData?.deliveryEndDatetime || getDefaultEndDate(defaultStartDate);

  const [formData, setFormData] = useState<DeliveryCredentialFormData>({
    originAddress: initialData?.originAddress || '123 Orchard Road, Te Puke, Bay of Plenty 3119',
    destinationAddress: initialData?.destinationAddress || '456 Warehouse Street, Mount Maunganui, Tauranga 3116',
    deliveryStartDatetime: defaultStartDate,
    deliveryEndDatetime: defaultEndDate,
    driverId: initialData?.driverId || 'DRV-12345',
    driverName: initialData?.driverName || 'Jane Smith',
    vehicleId: initialData?.vehicleId || 'ABC-1234',
    collectionId: initialData?.collectionId || '',
    nzbn: initialData?.nzbn || '9429050913510',
    recipientDid: initialData?.recipientDid || '',
    recipientEmail: initialData?.recipientEmail || '',
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deliveryId, setDeliveryId] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Reset to defaults when creating new credential
      const startDate = getDefaultDate(8, 0);
      setFormData({
        originAddress: '123 Orchard Road, Te Puke, Bay of Plenty 3119',
        destinationAddress: '456 Warehouse Street, Mount Maunganui, Tauranga 3116',
        deliveryStartDatetime: startDate,
        deliveryEndDatetime: getDefaultEndDate(startDate),
        driverId: 'DRV-12345',
        driverName: 'Jane Smith',
        vehicleId: 'ABC-1234',
        collectionId: '',
        nzbn: '9429050913510',
        recipientDid: '',
        recipientEmail: '',
      });
    }
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.originAddress.trim()) {
      newErrors.originAddress = 'Origin Address is required';
    }

    if (!formData.destinationAddress.trim()) {
      newErrors.destinationAddress = 'Destination Address is required';
    }

    if (!formData.deliveryStartDatetime) {
      newErrors.deliveryStartDatetime = 'Delivery Start Datetime is required';
    }

    if (formData.deliveryEndDatetime) {
      const startDate = new Date(formData.deliveryStartDatetime);
      const endDate = new Date(formData.deliveryEndDatetime);
      if (endDate <= startDate) {
        newErrors.deliveryEndDatetime = 'Delivery End Datetime must be after Start Datetime';
      }
    }

    if (!formData.driverId.trim()) {
      newErrors.driverId = 'Driver ID is required';
    }

    if (!formData.driverName.trim()) {
      newErrors.driverName = 'Driver Name is required';
    }

    if (!formData.vehicleId.trim()) {
      newErrors.vehicleId = 'Vehicle ID is required';
    }

    if (!formData.nzbn.trim()) {
      newErrors.nzbn = 'NZBN is required';
    } else if (!/^\d{13}$/.test(formData.nzbn)) {
      newErrors.nzbn = 'NZBN must be exactly 13 digits';
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
      selectedOrganisationPart: data.organisationPart
        ? {
            opn: data.organisationPart.opn || '',
            name: data.organisationPart.name,
            nzbn: data.nzbn,
            orchardId: data.orchardId,
          }
        : undefined,
    });
    setErrors({ ...errors, nzbn: '' });
  };

  const handleCollectionSelect = (collection: CollectionCredential | null) => {
    setFormData({
      ...formData,
      collectionId: collection?.collectionId || collection?.id || '',
      selectedCollectionCredential: collection
        ? {
            id: collection.id,
            collectionId: collection.collectionId,
            binIdentifier: collection.binIdentifier,
            rowIdentifier: collection.rowIdentifier,
          }
        : undefined,
    });
    setErrors({ ...errors, collectionId: '' });
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
    <Card title="Create Delivery Credential">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Organisation Part Selector */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-medium text-gray-800 mb-3">
            Organisation
          </h3>
          <OrganisationPartSelector
            onSelect={handleOrganisationPartSelect}
            initialNzbn={formData.nzbn}
            error={errors.nzbn}
          />
          {/* Display default values */}
          <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
            <div className="text-gray-700">
              <div><strong>Default NZBN:</strong> {formData.nzbn}</div>
              <div className="text-xs text-gray-600 mt-1">
                You can change this value or select from organisation parts above
              </div>
            </div>
          </div>
        </div>

        {/* Collection Credential Selector (Optional) */}
        <div className="border-b pb-4">
          <CollectionCredentialSelector
            onSelect={handleCollectionSelect}
            initialCollectionId={formData.collectionId}
            error={errors.collectionId}
          />
        </div>

        {/* Origin and Destination Addresses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Origin Address *"
            type="text"
            value={formData.originAddress}
            onChange={(e) => {
              setFormData({ ...formData, originAddress: e.target.value });
              setErrors({ ...errors, originAddress: '' });
            }}
            placeholder="e.g., 123 Orchard Road, Auckland"
            error={errors.originAddress}
            required
          />

          <Input
            label="Destination Address *"
            type="text"
            value={formData.destinationAddress}
            onChange={(e) => {
              setFormData({ ...formData, destinationAddress: e.target.value });
              setErrors({ ...errors, destinationAddress: '' });
            }}
            placeholder="e.g., 456 Warehouse Street, Wellington"
            error={errors.destinationAddress}
            required
          />
        </div>

        {/* Delivery Datetimes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Delivery Start Datetime *"
            type="datetime-local"
            value={formatDateTimeLocal(formData.deliveryStartDatetime)}
            onChange={(e) => {
              setFormData({
                ...formData,
                deliveryStartDatetime: parseDateTimeLocal(e.target.value),
              });
              setErrors({ ...errors, deliveryStartDatetime: '' });
            }}
            error={errors.deliveryStartDatetime}
            required
          />

          <Input
            label="Delivery End Datetime"
            type="datetime-local"
            value={formatDateTimeLocal(formData.deliveryEndDatetime || '')}
            onChange={(e) => {
              setFormData({
                ...formData,
                deliveryEndDatetime: e.target.value
                  ? parseDateTimeLocal(e.target.value)
                  : '',
              });
              setErrors({ ...errors, deliveryEndDatetime: '' });
            }}
            error={errors.deliveryEndDatetime}
          />
        </div>

        {/* Driver Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Driver ID *"
            type="text"
            value={formData.driverId}
            onChange={(e) => {
              setFormData({ ...formData, driverId: e.target.value });
              setErrors({ ...errors, driverId: '' });
            }}
            placeholder="e.g., DRV-12345"
            error={errors.driverId}
            required
          />

          <Input
            label="Driver Name *"
            type="text"
            value={formData.driverName}
            onChange={(e) => {
              setFormData({ ...formData, driverName: e.target.value });
              setErrors({ ...errors, driverName: '' });
            }}
            placeholder="Driver full name"
            error={errors.driverName}
            required
          />
        </div>

        {/* Vehicle Information */}
        <div>
          <Input
            label="Vehicle ID *"
            type="text"
            value={formData.vehicleId}
            onChange={(e) => {
              setFormData({ ...formData, vehicleId: e.target.value });
              setErrors({ ...errors, vehicleId: '' });
            }}
            placeholder="e.g., ABC-1234 or Vehicle registration number"
            error={errors.vehicleId}
            required
          />
        </div>

        {/* Delivery ID (read-only, auto-generated) */}
        {deliveryId && (
          <Input
            label="Delivery ID"
            type="text"
            value={deliveryId}
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
