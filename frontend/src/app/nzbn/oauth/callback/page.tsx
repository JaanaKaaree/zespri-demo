'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const success = searchParams.get('success');

    if (success === 'true') {
      setStatus('success');
      // Check if we have a stored NZBN to redirect back to parts page
      const storedNzbn = typeof window !== 'undefined' ? sessionStorage.getItem('nzbn_oauth_redirect') : null;
      if (storedNzbn) {
        // Clear the stored NZBN and redirect to parts page
        sessionStorage.removeItem('nzbn_oauth_redirect');
        setTimeout(() => {
          router.push(`/nzbn/organisations/${storedNzbn}/parts`);
        }, 2000);
      } else {
        // No stored NZBN, redirect to organisations page
        setTimeout(() => {
          router.push('/nzbn/organisations');
        }, 2000);
      }
    } else if (errorParam) {
      setStatus('error');
      setError(
        errorDescription ||
          errorParam.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      );
    }
  }, [searchParams, router]);

  const handleContinue = () => {
    // Check if we have a stored NZBN to redirect back to parts page
    const storedNzbn = typeof window !== 'undefined' ? sessionStorage.getItem('nzbn_oauth_redirect') : null;
    if (storedNzbn) {
      sessionStorage.removeItem('nzbn_oauth_redirect');
      router.push(`/nzbn/organisations/${storedNzbn}/parts`);
    } else {
      router.push('/nzbn/organisations');
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-16">
      <Card>
        {status === 'loading' && (
          <div className="text-center py-8">
            <p className="text-gray-600">Processing OAuth callback...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center py-8">
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Successfully Connected
            </h2>
            <p className="text-gray-600 mb-6">
              Your NZBN account has been successfully connected. Redirecting...
            </p>
            <Button onClick={handleContinue}>Continue to Organisation Parts</Button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-8">
            <div className="text-red-600 text-5xl mb-4">✗</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Connection Failed
            </h2>
            <p className="text-red-600 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.push('/nzbn/organisations')}>
                Try Again
              </Button>
              <Button variant="secondary" onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto mt-16">
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600">Loading...</p>
          </div>
        </Card>
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}
