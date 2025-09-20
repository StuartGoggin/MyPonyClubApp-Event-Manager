'use client';

import { PCADataImporter } from '@/components/admin/PCADataImporter';
import { RouteGuard } from '@/components/auth/route-guard';

export default function ImportPCADataPage() {
  return (
    <RouteGuard requireAuth={true} requiredRoles={['super_user']}>
      <div className="container mx-auto py-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Import PCA Club Data
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Import club information from Pony Club Australia JSON data to update your local database with addresses, contact details, and club logos.
            </p>
          </div>
          
          <PCADataImporter />
        </div>
      </div>
    </RouteGuard>
  );
}