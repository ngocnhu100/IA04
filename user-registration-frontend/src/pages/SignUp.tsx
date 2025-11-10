import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import RegisterForm from '../components/RegisterForm';
import { useAuth } from '../contexts/AuthContext';

export default function SignUp() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  // Don't render anything if user is logged in (will redirect)
  if (isLoggedIn) {
    return null;
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg max-w-md w-full fade-in">
        <div className="text-center mb-6">
          <UserPlus className="h-10 w-10 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Create Your Account</h2>
          <p className="text-gray-600 text-sm sm:text-base mt-2">Join us today and get started in minutes</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
