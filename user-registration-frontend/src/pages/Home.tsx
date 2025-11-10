import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, LogIn, Sparkles, Loader2, LogOut, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getApiStatus } from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['api-status'],
    queryFn: getApiStatus,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
  const { isLoggedIn, logout } = useAuth();

  if (isLoggedIn) {
    return (
      <div className="h-screen bg-gradient-to-br from-green-50 to-teal-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg max-w-lg w-full text-center fade-in">
          <div className="mb-6">
            <User className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Welcome Back!</h2>
            <p className="text-gray-600 text-sm sm:text-base">You are now logged in (simulated). Enjoy exploring the platform.</p>
          </div>
          <div className="mb-6 flex items-center justify-center gap-3 text-sm">
            {isLoading ? (
              <span className="inline-flex items-center text-gray-500"><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Checking API...</span>
            ) : isError ? (
              <span className="inline-flex items-center text-red-600 border border-red-200 bg-red-50 px-2 py-1 rounded-md">API: Offline</span>
            ) : (
              <span className="inline-flex items-center text-green-600 border border-green-200 bg-green-50 px-2 py-1 rounded-md">API: Online</span>
            )}
            <button onClick={() => refetch()} className="text-xs text-gray-500 underline underline-offset-2 hover:text-gray-700 disabled:opacity-50" disabled={isFetching}>Refresh</button>
          </div>
          <div className="space-y-4">
            <button
              onClick={logout}
              className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white py-3 px-4 rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-200 flex items-center justify-center font-medium"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg max-w-lg w-full text-center fade-in">
        <div className="mb-6">
          <Sparkles className="h-12 w-12 text-purple-500 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Welcome to Our Platform</h2>
          <p className="text-gray-600 text-sm sm:text-base">Join thousands of users and start your journey today. Secure, fast, and easy to use.</p>
        </div>
        <div className="mb-6 flex items-center justify-center gap-3 text-sm">
          {isLoading ? (
            <span className="inline-flex items-center text-gray-500"><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Checking API...</span>
          ) : isError ? (
            <span className="inline-flex items-center text-red-600 border border-red-200 bg-red-50 px-2 py-1 rounded-md">API: Offline</span>
          ) : (
            <span className="inline-flex items-center text-green-600 border border-green-200 bg-green-50 px-2 py-1 rounded-md">API: Online</span>
          )}
          <button onClick={() => refetch()} className="text-xs text-gray-500 underline underline-offset-2 hover:text-gray-700 disabled:opacity-50" disabled={isFetching}>Refresh</button>
        </div>
        <div className="space-y-4">
          <Link
            to="/signup"
            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-4 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 flex items-center justify-center font-medium"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Get Started - Sign Up
          </Link>
          <Link
            to="/login"
            className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center justify-center font-medium"
          >
            <LogIn className="h-5 w-5 mr-2" />
            Already have an account? Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
