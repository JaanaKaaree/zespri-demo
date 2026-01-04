'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
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
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Welcome
          </h2>
          <p className="text-gray-600">
            This is your dashboard. Navigate to the Issuance page to create
            credentials.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Quick Actions
          </h2>
          <ul className="space-y-2 text-gray-600">
            <li>
              <a
                href="/issuance"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Create Credential
              </a>
            </li>
            <li>
              <a
                href="/nzbn/organisations"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Manage Organisation Parts
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
