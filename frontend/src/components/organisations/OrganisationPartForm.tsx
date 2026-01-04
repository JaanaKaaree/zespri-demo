'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OrganisationPart, OrganisationPartFunction, OrganisationPartStatus, Privacy } from '@/types/organisation.types';

interface OrganisationPartFormProps {
  nzbn: string;
  initialData?: OrganisationPart;
  onSubmit: (data: OrganisationPart) => Promise<void>;
  onCancel: () => void;
}

export const OrganisationPartForm: React.FC<OrganisationPartFormProps> = ({
  nzbn,
  initialData,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<OrganisationPart>({
    name: '',
    function: 'FUNCTION',
    organisationPartStatus: 'ACTIVE',
    privacy: 'PUBLIC',
    parentNzbn: nzbn,
    ...initialData,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to save organisation part');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card title={initialData ? 'Edit Organisation Part' : 'Create Organisation Part'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Name *"
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Function *
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.function || 'FUNCTION'}
              onChange={(e) =>
                setFormData({ ...formData, function: e.target.value as OrganisationPartFunction })
              }
              required
            >
              <option value="FUNCTION">Function</option>
              <option value="PHYSICAL_LOCATION">Physical Location</option>
              <option value="DIGITAL_LOCATION">Digital Location</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.organisationPartStatus || 'ACTIVE'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  organisationPartStatus: e.target.value as OrganisationPartStatus,
                })
              }
              required
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Privacy
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.privacy || 'PUBLIC'}
              onChange={(e) =>
                setFormData({ ...formData, privacy: e.target.value as Privacy })
              }
            >
              <option value="PUBLIC">Public</option>
              <option value="SHARED">Shared</option>
              <option value="PRIVATE">Private</option>
            </select>
          </div>

          <Input
            label="GST Number"
            type="text"
            value={formData.gstNumber || ''}
            onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
          />

          <Input
            label="Payment Bank Account Number"
            type="text"
            value={formData.paymentBankAccountNumber || ''}
            onChange={(e) =>
              setFormData({ ...formData, paymentBankAccountNumber: e.target.value })
            }
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Additional fields like addresses, phone numbers, email addresses,
            and purposes can be added after creating the organisation part.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <Button type="submit" isLoading={isSubmitting}>
            {initialData ? 'Update' : 'Create'} Organisation Part
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};
