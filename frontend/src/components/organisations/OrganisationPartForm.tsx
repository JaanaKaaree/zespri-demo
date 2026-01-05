'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  OrganisationPart,
  OrganisationPartFunction,
  OrganisationPartStatus,
  Privacy,
  OrganisationPartPurpose,
  OrganisationPartPurposeType,
  OrganisationPartAddress,
  OrganisationPartAddressType,
  OrganisationPartPhoneNumber,
  OrganisationPartEmail,
  OrganisationPartEmailPurposeType,
  OrganisationPartMetadata,
  OrganisationPartNzbnListItem,
} from '@/types/organisation.types';

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
    // Ensure purposes is always set (override spread if initialData doesn't have it)
    purposes: (initialData?.purposes && initialData.purposes.length > 0)
      ? initialData.purposes
      : [{ purpose: 'E_INVOICING' as OrganisationPartPurposeType }],
  });

  // Update form data when initialData changes (e.g., when editing different parts)
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        function: initialData.function || 'FUNCTION',
        organisationPartStatus: initialData.organisationPartStatus || 'ACTIVE',
        privacy: initialData.privacy || 'PUBLIC',
        parentNzbn: initialData.parentNzbn || nzbn,
        ...initialData,
        // Ensure purposes is always set
        purposes: (initialData.purposes && initialData.purposes.length > 0)
          ? initialData.purposes
          : [{ purpose: 'E_INVOICING' as OrganisationPartPurposeType }],
      });
    } else {
      // Reset to defaults when creating new
      setFormData({
        name: '',
        function: 'FUNCTION',
        organisationPartStatus: 'ACTIVE',
        privacy: 'PUBLIC',
        parentNzbn: nzbn,
        purposes: [{ purpose: 'E_INVOICING' as OrganisationPartPurposeType }],
        addresses: [],
        phoneNumbers: [],
        emailAddresses: [],
        'custom-data': [],
        'nzbn-list': [],
      });
    }
  }, [initialData, nzbn]);

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

        {/* Purposes Section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Purposes *
            </label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setFormData({
                  ...formData,
                  purposes: [
                    ...(formData.purposes || []),
                    { purpose: 'E_INVOICING' as OrganisationPartPurposeType },
                  ],
                });
              }}
            >
              + Add Purpose
            </Button>
          </div>
          {(formData.purposes || []).map((purpose, index) => (
            <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purpose Type *
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={purpose.purpose}
                    onChange={(e) => {
                      const newPurposes = [...(formData.purposes || [])];
                      newPurposes[index] = {
                        ...newPurposes[index],
                        purpose: e.target.value as OrganisationPartPurposeType,
                      };
                      setFormData({ ...formData, purposes: newPurposes });
                    }}
                    required
                  >
                    <option value="E_INVOICING">E-Invoicing</option>
                    <option value="OTHER">Other</option>
                    <option value="LOCATIONARRIVAL">Location Arrival</option>
                  </select>
                </div>
                <div>
                  <Input
                    label="Purpose Description"
                    type="text"
                    value={purpose.purposeDescription || ''}
                    onChange={(e) => {
                      const newPurposes = [...(formData.purposes || [])];
                      newPurposes[index] = {
                        ...newPurposes[index],
                        purposeDescription: e.target.value,
                      };
                      setFormData({ ...formData, purposes: newPurposes });
                    }}
                    placeholder="Optional description"
                  />
                </div>
              </div>
              {(formData.purposes || []).length > 1 && (
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const newPurposes = (formData.purposes || []).filter((_, i) => i !== index);
                      setFormData({ ...formData, purposes: newPurposes });
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Addresses Section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Addresses
            </label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setFormData({
                  ...formData,
                  addresses: [
                    ...(formData.addresses || []),
                    { addressType: 'POSTAL' as OrganisationPartAddressType },
                  ],
                });
              }}
            >
              + Add Address
            </Button>
          </div>
          {(formData.addresses || []).map((address, index) => (
            <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Address 1"
                  type="text"
                  value={address.address1 || ''}
                  onChange={(e) => {
                    const newAddresses = [...(formData.addresses || [])];
                    newAddresses[index] = { ...newAddresses[index], address1: e.target.value };
                    setFormData({ ...formData, addresses: newAddresses });
                  }}
                />
                <Input
                  label="Address 2"
                  type="text"
                  value={address.address2 || ''}
                  onChange={(e) => {
                    const newAddresses = [...(formData.addresses || [])];
                    newAddresses[index] = { ...newAddresses[index], address2: e.target.value };
                    setFormData({ ...formData, addresses: newAddresses });
                  }}
                />
                <Input
                  label="Address 3"
                  type="text"
                  value={address.address3 || ''}
                  onChange={(e) => {
                    const newAddresses = [...(formData.addresses || [])];
                    newAddresses[index] = { ...newAddresses[index], address3: e.target.value };
                    setFormData({ ...formData, addresses: newAddresses });
                  }}
                />
                <Input
                  label="Address 4"
                  type="text"
                  value={address.address4 || ''}
                  onChange={(e) => {
                    const newAddresses = [...(formData.addresses || [])];
                    newAddresses[index] = { ...newAddresses[index], address4: e.target.value };
                    setFormData({ ...formData, addresses: newAddresses });
                  }}
                />
                <Input
                  label="Care Of"
                  type="text"
                  value={address.careOf || ''}
                  onChange={(e) => {
                    const newAddresses = [...(formData.addresses || [])];
                    newAddresses[index] = { ...newAddresses[index], careOf: e.target.value };
                    setFormData({ ...formData, addresses: newAddresses });
                  }}
                />
                <Input
                  label="Post Code"
                  type="text"
                  value={address.postCode || ''}
                  onChange={(e) => {
                    const newAddresses = [...(formData.addresses || [])];
                    newAddresses[index] = { ...newAddresses[index], postCode: e.target.value };
                    setFormData({ ...formData, addresses: newAddresses });
                  }}
                />
                <Input
                  label="Country Code"
                  type="text"
                  value={address.countryCode || ''}
                  onChange={(e) => {
                    const newAddresses = [...(formData.addresses || [])];
                    newAddresses[index] = { ...newAddresses[index], countryCode: e.target.value };
                    setFormData({ ...formData, addresses: newAddresses });
                  }}
                  placeholder="e.g., NZ, GB, AU"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={address.addressType || 'POSTAL'}
                    onChange={(e) => {
                      const newAddresses = [...(formData.addresses || [])];
                      newAddresses[index] = {
                        ...newAddresses[index],
                        addressType: e.target.value as OrganisationPartAddressType,
                      };
                      setFormData({ ...formData, addresses: newAddresses });
                    }}
                  >
                    <option value="POSTAL">Postal</option>
                    <option value="PHYSICAL">Physical</option>
                    <option value="DELIVERY">Delivery</option>
                    <option value="INVOICE">Invoice</option>
                  </select>
                </div>
              </div>
              <div className="mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const newAddresses = (formData.addresses || []).filter((_, i) => i !== index);
                    setFormData({ ...formData, addresses: newAddresses });
                  }}
                >
                  Remove Address
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Phone Numbers Section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Phone Numbers
            </label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setFormData({
                  ...formData,
                  phoneNumbers: [
                    ...(formData.phoneNumbers || []),
                    { phonePurpose: 'Phone' },
                  ],
                });
              }}
            >
              + Add Phone Number
            </Button>
          </div>
          {(formData.phoneNumbers || []).map((phone, index) => (
            <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Phone Purpose"
                  type="text"
                  value={phone.phonePurpose || ''}
                  onChange={(e) => {
                    const newPhones = [...(formData.phoneNumbers || [])];
                    newPhones[index] = { ...newPhones[index], phonePurpose: e.target.value };
                    setFormData({ ...formData, phoneNumbers: newPhones });
                  }}
                  placeholder="e.g., Phone, Mobile, Other"
                />
                <Input
                  label="Phone Purpose Description"
                  type="text"
                  value={phone.phonePurposeDescription || ''}
                  onChange={(e) => {
                    const newPhones = [...(formData.phoneNumbers || [])];
                    newPhones[index] = { ...newPhones[index], phonePurposeDescription: e.target.value };
                    setFormData({ ...formData, phoneNumbers: newPhones });
                  }}
                />
                <Input
                  label="Country Code"
                  type="text"
                  value={phone.phoneCountryCode || ''}
                  onChange={(e) => {
                    const newPhones = [...(formData.phoneNumbers || [])];
                    newPhones[index] = { ...newPhones[index], phoneCountryCode: e.target.value };
                    setFormData({ ...formData, phoneNumbers: newPhones });
                  }}
                />
                <Input
                  label="Area Code"
                  type="text"
                  value={phone.phoneAreaCode || ''}
                  onChange={(e) => {
                    const newPhones = [...(formData.phoneNumbers || [])];
                    newPhones[index] = { ...newPhones[index], phoneAreaCode: e.target.value };
                    setFormData({ ...formData, phoneNumbers: newPhones });
                  }}
                />
                <Input
                  label="Phone Number"
                  type="text"
                  value={phone.phoneNumber || ''}
                  onChange={(e) => {
                    const newPhones = [...(formData.phoneNumbers || [])];
                    newPhones[index] = { ...newPhones[index], phoneNumber: e.target.value };
                    setFormData({ ...formData, phoneNumbers: newPhones });
                  }}
                />
              </div>
              <div className="mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const newPhones = (formData.phoneNumbers || []).filter((_, i) => i !== index);
                    setFormData({ ...formData, phoneNumbers: newPhones });
                  }}
                >
                  Remove Phone Number
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Email Addresses Section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Email Addresses
            </label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setFormData({
                  ...formData,
                  emailAddresses: [
                    ...(formData.emailAddresses || []),
                    { emailPurpose: 'INVOICE_ADDRESS' as OrganisationPartEmailPurposeType },
                  ],
                });
              }}
            >
              + Add Email Address
            </Button>
          </div>
          {(formData.emailAddresses || []).map((email, index) => (
            <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Email Address"
                  type="email"
                  value={email.emailAddress || ''}
                  onChange={(e) => {
                    const newEmails = [...(formData.emailAddresses || [])];
                    newEmails[index] = { ...newEmails[index], emailAddress: e.target.value };
                    setFormData({ ...formData, emailAddresses: newEmails });
                  }}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Purpose
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={email.emailPurpose || 'INVOICE_ADDRESS'}
                    onChange={(e) => {
                      const newEmails = [...(formData.emailAddresses || [])];
                      newEmails[index] = {
                        ...newEmails[index],
                        emailPurpose: e.target.value as OrganisationPartEmailPurposeType,
                      };
                      setFormData({ ...formData, emailAddresses: newEmails });
                    }}
                  >
                    <option value="INVOICE_ADDRESS">Invoice Address</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <Input
                  label="Email Purpose Description"
                  type="text"
                  value={email.emailPurposeDescription || ''}
                  onChange={(e) => {
                    const newEmails = [...(formData.emailAddresses || [])];
                    newEmails[index] = { ...newEmails[index], emailPurposeDescription: e.target.value };
                    setFormData({ ...formData, emailAddresses: newEmails });
                  }}
                />
              </div>
              <div className="mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const newEmails = (formData.emailAddresses || []).filter((_, i) => i !== index);
                    setFormData({ ...formData, emailAddresses: newEmails });
                  }}
                >
                  Remove Email Address
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Data Section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Custom Data
            </label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setFormData({
                  ...formData,
                  'custom-data': [
                    ...(formData['custom-data'] || []),
                    { key: '', value: '' },
                  ],
                });
              }}
            >
              + Add Custom Data
            </Button>
          </div>
          {(formData['custom-data'] || []).map((metadata, index) => (
            <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Key"
                  type="text"
                  value={metadata.key || ''}
                  onChange={(e) => {
                    const newMetadata = [...(formData['custom-data'] || [])];
                    newMetadata[index] = { ...newMetadata[index], key: e.target.value };
                    setFormData({ ...formData, 'custom-data': newMetadata });
                  }}
                />
                <Input
                  label="Value"
                  type="text"
                  value={metadata.value || ''}
                  onChange={(e) => {
                    const newMetadata = [...(formData['custom-data'] || [])];
                    newMetadata[index] = { ...newMetadata[index], value: e.target.value };
                    setFormData({ ...formData, 'custom-data': newMetadata });
                  }}
                />
              </div>
              <div className="mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const newMetadata = (formData['custom-data'] || []).filter((_, i) => i !== index);
                    setFormData({ ...formData, 'custom-data': newMetadata });
                  }}
                >
                  Remove Custom Data
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* NZBN List Section */}
        {formData.privacy === 'SHARED' && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Share-with NZBNs
              </label>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setFormData({
                    ...formData,
                    'nzbn-list': [
                      ...(formData['nzbn-list'] || []),
                      { nzbn: '' },
                    ],
                  });
                }}
              >
                + Add NZBN
              </Button>
            </div>
            {(formData['nzbn-list'] || []).map((item, index) => (
              <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="NZBN"
                    type="text"
                    value={item.nzbn || ''}
                    onChange={(e) => {
                      const newNzbnList = [...(formData['nzbn-list'] || [])];
                      newNzbnList[index] = { ...newNzbnList[index], nzbn: e.target.value };
                      setFormData({ ...formData, 'nzbn-list': newNzbnList });
                    }}
                    placeholder="13-digit NZBN number"
                  />
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const newNzbnList = (formData['nzbn-list'] || []).filter((_, i) => i !== index);
                        setFormData({ ...formData, 'nzbn-list': newNzbnList });
                      }}
                    >
                      Remove NZBN
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-500 mt-2">
              Only visible when Privacy is set to "Shared". These NZBNs will be able to view this organisation part.
            </p>
          </div>
        )}

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
