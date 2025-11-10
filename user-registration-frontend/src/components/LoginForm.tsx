import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, Eye, EyeOff, CheckCircle, XCircle, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

type LoginFormValues = { email: string; password: string };

export default function LoginForm() {
  const { register, handleSubmit, formState: { errors, isValid, touchedFields }, trigger } = useForm<LoginFormValues>({
    mode: 'onChange'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    setLoginError(false);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock login logic - simulate success for demo purposes
    // In a real app, this would validate against registered users
    if (values.email && values.password) {
      setLoginSuccess(true);
      login(values.email); // Mock login to auth context
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } else {
      setLoginError(true);
    }

    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto space-y-6" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email Address <span className="text-red-500" aria-label="required">*</span>
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" aria-hidden="true" />
          <Input
            id="email"
            className={`pl-10 pr-3 h-11 transition-colors ${
              errors.email
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : touchedFields.email && !errors.email
                ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
            type="email"
            placeholder="Enter your email address"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'login-email-error' : touchedFields.email && !errors.email ? 'login-email-success' : undefined}
            {...register('email', {
              required: 'Email address is required to sign in',
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                message: 'Please enter a valid email address (e.g., yourname@example.com)'
              },
              onBlur: () => trigger('email')
            })}
          />
          {touchedFields.email && !errors.email && (
            <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 h-5 w-5" aria-hidden="true" />
          )}
        </div>
        {errors.email && (
          <div id="login-email-error" className="flex items-start gap-2 text-sm text-red-600" aria-live="polite" role="alert">
            <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>{errors.email.message}</span>
          </div>
        )}
        {touchedFields.email && !errors.email && (
          <div id="login-email-success" className="flex items-center gap-2 text-sm text-green-600" aria-live="polite">
            <CheckCircle className="h-4 w-4" aria-hidden="true" />
            <span>Email format looks good!</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
          Password <span className="text-red-500" aria-label="required">*</span>
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" aria-hidden="true" />
          <Input
            id="password"
            className={`pl-10 pr-12 h-11 transition-colors ${
              errors.password
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : touchedFields.password && !errors.password
                ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'login-password-error' : touchedFields.password && !errors.password ? 'login-password-success' : undefined}
            {...register('password', {
              required: 'Password is required to sign in',
              onBlur: () => trigger('password')
            })}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent focus:bg-gray-100"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            title={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
          </Button>
        </div>
        {errors.password && (
          <div id="login-password-error" className="flex items-start gap-2 text-sm text-red-600" aria-live="polite" role="alert">
            <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>{errors.password.message}</span>
          </div>
        )}
        {touchedFields.password && !errors.password && (
          <div id="login-password-success" className="flex items-center gap-2 text-sm text-green-600" aria-live="polite">
            <CheckCircle className="h-4 w-4" aria-hidden="true" />
            <span>Password entered</span>
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading || !isValid}
        className="w-full h-11 text-base font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-describedby={isLoading ? 'login-loading' : undefined}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin h-5 w-5 mr-2" aria-hidden="true" />
            <span id="login-loading">Signing you in...</span>
          </>
        ) : (
          'Sign In'
        )}
      </Button>

      {loginSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-800">Login Successful!</AlertTitle>
          <AlertDescription className="text-green-700 mt-1">
            Welcome back! Redirecting you to your dashboard...
          </AlertDescription>
        </Alert>
      )}

      {loginError && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <XCircle className="h-5 w-5" />
          <AlertTitle>Login Failed</AlertTitle>
          <AlertDescription className="mt-1">
            <span className="text-red-700">
              The email address or password you entered is incorrect. Please check your credentials and try again.
            </span>
          </AlertDescription>
        </Alert>
      )}

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="text-blue-600 hover:text-blue-800 font-medium underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-sm"
          >
            Sign up here
          </button>
        </p>
      </div>
    </form>
  );
}
