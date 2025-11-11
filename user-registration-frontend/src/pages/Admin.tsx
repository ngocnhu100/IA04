import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export function Admin() {
  const { userRole } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Admin Dashboard
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Welcome to the admin area. Your role: {userRole}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Admin Features</h3>
              <p className="mt-1 text-sm text-gray-600">
                This page is only accessible to users with admin role.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-700">
                As an admin, you can manage users, view system statistics, and perform administrative tasks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}