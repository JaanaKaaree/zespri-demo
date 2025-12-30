'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { CredentialFormData } from '@/types/issuance.types';

interface CredentialFormProps {
  onSubmit: (data: CredentialFormData) => Promise<void>;
  isLoading?: boolean;
}

export const CredentialForm: React.FC<CredentialFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CredentialFormData>({
    templateId: '',
    credentialData: {},
    recipientEmail: '',
  });
  const [credentialDataJson, setCredentialDataJson] = useState('{}');
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const credentialData = JSON.parse(credentialDataJson);
      await onSubmit({
        ...formData,
        credentialData,
      });
      
      // Reset form
      setFormData({
        templateId: '',
        credentialData: {},
        recipientEmail: '',
      });
      setCredentialDataJson('{}');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON format');
    }
  };

  return (
    <Card title="Create Credential">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Template ID"
          type="text"
          value={formData.templateId}
          onChange={(e) =>
            setFormData({ ...formData, templateId: e.target.value })
          }
          required
        />

        <Input
          label="Recipient Email (optional)"
          type="email"
          value={formData.recipientEmail}
          onChange={(e) =>
            setFormData({ ...formData, recipientEmail: e.target.value })
          }
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Credential Data (JSON)
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            rows={6}
            value={credentialDataJson}
            onChange={(e) => setCredentialDataJson(e.target.value)}
            required
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <Button type="submit" isLoading={isLoading}>
          Create Credential
        </Button>
      </form>
    </Card>
  );
};
