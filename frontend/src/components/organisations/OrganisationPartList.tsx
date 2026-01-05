'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { OrganisationPart } from '@/types/organisation.types';

type StatusFilter = 'ACTIVE' | 'INACTIVE' | 'ALL';

interface OrganisationPartListProps {
  nzbn: string;
  parts: OrganisationPart[];
  onEdit?: (part: OrganisationPart) => void;
  onToggleStatus?: (part: OrganisationPart) => void;
  onCreate?: () => void;
  statusFilter?: StatusFilter;
  onStatusFilterChange?: (filter: StatusFilter) => void;
}

export const OrganisationPartList: React.FC<OrganisationPartListProps> = ({
  nzbn,
  parts,
  onEdit,
  onToggleStatus,
  onCreate,
  statusFilter = 'ACTIVE',
  onStatusFilterChange,
}) => {
  // Filter parts based on status
  const filteredParts = statusFilter === 'ALL' 
    ? parts 
    : parts.filter(part => part.organisationPartStatus === statusFilter);
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFunctionLabel = (func?: string) => {
    switch (func) {
      case 'FUNCTION':
        return 'Function';
      case 'PHYSICAL_LOCATION':
        return 'Physical Location';
      case 'DIGITAL_LOCATION':
        return 'Digital Location';
      default:
        return func || 'N/A';
    }
  };

  return (
    <Card>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Organisation Parts</h2>
          <p className="text-sm text-gray-600 mt-1">NZBN: {nzbn}</p>
        </div>
        <div className="flex items-center gap-4">
          {onStatusFilterChange && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700 font-medium">Filter:</label>
              <select
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ALL">All</option>
              </select>
            </div>
          )}
          {onCreate && (
            <Button onClick={onCreate}>Create Organisation Part</Button>
          )}
        </div>
      </div>

      {filteredParts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No organisation parts found.</p>
          {onCreate && (
            <Button onClick={onCreate}>Create Your First Organisation Part</Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredParts.map((part) => (
            <div
              key={part.opn || part.name}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {part.name || 'Unnamed Organisation Part'}
                    </h3>
                    {part.organisationPartStatus && (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          part.organisationPartStatus,
                        )}`}
                      >
                        {part.organisationPartStatus}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    {part.opn && (
                      <div>
                        <span className="font-medium">OPN:</span> {part.opn}
                      </div>
                    )}
                    {part.function && (
                      <div>
                        <span className="font-medium">Type:</span> {getFunctionLabel(part.function)}
                      </div>
                    )}
                    {part.addresses && part.addresses.length > 0 && (
                      <div>
                        <span className="font-medium">Addresses:</span> {part.addresses.length}
                      </div>
                    )}
                    {part.phoneNumbers && part.phoneNumbers.length > 0 && (
                      <div>
                        <span className="font-medium">Phones:</span> {part.phoneNumbers.length}
                      </div>
                    )}
                  </div>

                  {part.purposes && part.purposes.length > 0 && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-gray-700">Purposes: </span>
                      <span className="text-sm text-gray-600">
                        {part.purposes.map((p) => p.purpose).join(', ')}
                      </span>
                    </div>
                  )}

                  {part.phoneNumbers && part.phoneNumbers.length > 0 && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-gray-700">Phone Numbers: </span>
                      <div className="text-sm text-gray-600 mt-1">
                        {part.phoneNumbers.map((phone, idx) => {
                          const phoneParts = [
                            phone.phoneCountryCode,
                            phone.phoneAreaCode ? `(${phone.phoneAreaCode})` : null,
                            phone.phoneNumber,
                          ].filter(Boolean);
                          const phoneDisplay = phoneParts.length > 0 ? phoneParts.join(' ') : 'N/A';
                          return (
                            <div key={idx} className="mt-1">
                              {phoneDisplay}
                              {phone.phonePurpose && (
                                <span className="text-gray-500 ml-2">({phone.phonePurpose})</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {part.emailAddresses && part.emailAddresses.length > 0 && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-gray-700">Email Addresses: </span>
                      <div className="text-sm text-gray-600 mt-1">
                        {part.emailAddresses.map((email, idx) => (
                          <div key={idx} className="mt-1">
                            {email.emailAddress || 'N/A'}
                            {email.emailPurpose && (
                              <span className="text-gray-500 ml-2">({email.emailPurpose})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {part.addresses && part.addresses.length > 0 && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-gray-700">Addresses: </span>
                      <div className="text-sm text-gray-600 mt-1">
                        {part.addresses.map((address, idx) => (
                          <div key={idx} className="mt-1">
                            {[
                              address.address1,
                              address.address2,
                              address.address3,
                              address.address4,
                            ]
                              .filter(Boolean)
                              .join(', ')}
                            {address.postCode && `, ${address.postCode}`}
                            {address.countryCode && `, ${address.countryCode}`}
                            {address.addressType && (
                              <span className="text-gray-500 ml-2">({address.addressType})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  {onEdit && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onEdit(part)}
                    >
                      Edit
                    </Button>
                  )}
                  {onToggleStatus && part.opn && (
                    <Button
                      variant={part.organisationPartStatus === 'ACTIVE' ? 'danger' : 'primary'}
                      size="sm"
                      onClick={() => onToggleStatus(part)}
                    >
                      {part.organisationPartStatus === 'ACTIVE' ? 'Deactivate' : 'Activate'}
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
