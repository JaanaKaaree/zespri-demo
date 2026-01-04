'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function OrganisationsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [nzbn, setNzbn] = useState('9429050913510');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic NZBN validation (13 digits)
    const nzbnRegex = /^\d{13}$/;
    if (!nzbnRegex.test(nzbn)) {
      setError('NZBN must be 13 digits');
      return;
    }

    // Navigate to the organisation parts list for this NZBN
    router.push(`/nzbn/organisations/${nzbn}/parts`);
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Organisation Parts</h1>

      <Card title="Select NZBN">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="NZBN Number"
            type="text"
            placeholder="Enter 13-digit NZBN number"
            value={nzbn}
            onChange={(e) => {
              setNzbn(e.target.value);
              setError('');
            }}
            error={error}
            required
            maxLength={13}
          />

          <p className="text-sm text-gray-600">
            Enter the New Zealand Business Number (NZBN) to manage organisation parts for that business.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit">Continue</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/dashboard')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
