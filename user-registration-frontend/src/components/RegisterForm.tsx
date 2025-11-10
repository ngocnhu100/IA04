import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { registerUser, RegisterDto } from '../api';
import { Mail, Lock, Eye, EyeOff, CheckCircle, XCircle, Loader2, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type FormValues = {
  email: string;
  password: string;
  confirm: string;
};

export default function RegisterForm() {
  const { register, handleSubmit, watch, formState: { errors, isValid, touchedFields }, reset, trigger } = useForm<FormValues>({
    mode: 'onChange'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const watchedPassword = watch('password', '');
  const watchedConfirm = watch('confirm', '');

  // Password strength calculation
  useEffect(() => {
    if (!watchedPassword) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (watchedPassword.length >= 8) strength += 1;
    if (/[A-Z]/.test(watchedPassword)) strength += 1;
    if (/[a-z]/.test(watchedPassword)) strength += 1;
    if (/[0-9]/.test(watchedPassword)) strength += 1;
    if (/[^A-Za-z0-9]/.test(watchedPassword)) strength += 1;

    setPasswordStrength(strength);
  }, [watchedPassword]);

  const mutation = useMutation({
    mutationFn: (data: RegisterDto) => registerUser(data),
    onSuccess: () => {
      reset();
      setShowPassword(false);
      setShowConfirm(false);
    },
  });

  async function onSubmit(values: FormValues) {
    if (values.password !== values.confirm) {
      return;
    }
    mutation.mutate({ email: values.email, password: values.password });
  }

  // Normalize API error messages for nicer rendering (supports string or string[])
  const apiErrorRaw = (mutation.error as any)?.response?.data?.message;
  const errorMessages: string[] = Array.isArray(apiErrorRaw)
    ? apiErrorRaw
    : apiErrorRaw
    ? [apiErrorRaw]
    : ['Unknown error'];

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Fair';
    if (passwordStrength <= 4) return 'Good';
    return 'Strong';
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'text-red-600';
    if (passwordStrength <= 3) return 'text-yellow-600';
    if (passwordStrength <= 4) return 'text-blue-600';
    return 'text-green-600';
  };

  const getPasswordStrengthWidth = () => {
    return `${(passwordStrength / 5) * 100}%`;
  };

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
            aria-describedby={errors.email ? 'reg-email-error' : touchedFields.email && !errors.email ? 'reg-email-success' : undefined}
            {...register('email', {
              required: 'Email address is required to create your account',
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
          <div id="reg-email-error" className="flex items-start gap-2 text-sm text-red-600" aria-live="polite" role="alert">
            <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>{errors.email.message}</span>
          </div>
        )}
        {touchedFields.email && !errors.email && (
          <div id="reg-email-success" className="flex items-center gap-2 text-sm text-green-600" aria-live="polite">
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
            placeholder="Create a strong password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'reg-password-error' : touchedFields.password && !errors.password ? 'reg-password-success' : 'password-requirements'}
            {...register('password', {
              required: 'Password is required to secure your account',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters long for better security'
              },
              maxLength: {
                value: 128,
                message: 'Password must not exceed 128 characters'
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
              },
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

        {/* Password strength indicator */}
        {watchedPassword && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Password strength:</span>
              <span className={`font-medium ${getPasswordStrengthColor()}`}>
                {getPasswordStrengthLabel()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  passwordStrength <= 2 ? 'bg-red-500' :
                  passwordStrength <= 3 ? 'bg-yellow-500' :
                  passwordStrength <= 4 ? 'bg-blue-500' : 'bg-green-500'
                }`}
                style={{ width: getPasswordStrengthWidth() }}
              />
            </div>
          </div>
        )}

        {/* Password requirements */}
        <div id="password-requirements" className="text-xs text-gray-600 space-y-1">
          <p className="font-medium">Password requirements:</p>
          <ul className="space-y-0.5 ml-4">
            <li className={`flex items-center gap-1 ${watchedPassword.length >= 8 ? 'text-green-600' : ''}`}>
              {watchedPassword.length >= 8 ? <Check className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border border-gray-300" />}
              At least 8 characters
            </li>
            <li className={`flex items-center gap-1 ${/[A-Z]/.test(watchedPassword) ? 'text-green-600' : ''}`}>
              {/[A-Z]/.test(watchedPassword) ? <Check className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border border-gray-300" />}
              One uppercase letter
            </li>
            <li className={`flex items-center gap-1 ${/[a-z]/.test(watchedPassword) ? 'text-green-600' : ''}`}>
              {/[a-z]/.test(watchedPassword) ? <Check className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border border-gray-300" />}
              One lowercase letter
            </li>
            <li className={`flex items-center gap-1 ${/\d/.test(watchedPassword) ? 'text-green-600' : ''}`}>
              {/\d/.test(watchedPassword) ? <Check className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border border-gray-300" />}
              One number
            </li>
          </ul>
        </div>

        {errors.password && (
          <div id="reg-password-error" className="flex items-start gap-2 text-sm text-red-600" aria-live="polite" role="alert">
            <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>{errors.password.message}</span>
          </div>
        )}
        {touchedFields.password && !errors.password && passwordStrength >= 3 && (
          <div id="reg-password-success" className="flex items-center gap-2 text-sm text-green-600" aria-live="polite">
            <CheckCircle className="h-4 w-4" aria-hidden="true" />
            <span>Password looks secure!</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm" className="text-sm font-medium text-gray-700">
          Confirm Password <span className="text-red-500" aria-label="required">*</span>
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" aria-hidden="true" />
          <Input
            id="confirm"
            className={`pl-10 pr-12 h-11 transition-colors ${
              errors.confirm || (watchedConfirm && watchedPassword !== watchedConfirm)
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : touchedFields.confirm && !errors.confirm && watchedPassword === watchedConfirm && watchedConfirm
                ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
            type={showConfirm ? 'text' : 'password'}
            placeholder="Confirm your password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirm || (watchedConfirm && watchedPassword !== watchedConfirm) ? true : undefined}
            aria-describedby={
              errors.confirm || (watchedConfirm && watchedPassword !== watchedConfirm)
                ? 'reg-confirm-error'
                : touchedFields.confirm && !errors.confirm && watchedPassword === watchedConfirm && watchedConfirm
                ? 'reg-confirm-success'
                : undefined
            }
            {...register('confirm', {
              required: 'Please confirm your password',
              validate: (value) => value === watchedPassword || 'Passwords do not match',
              onBlur: () => trigger('confirm')
            })}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent focus:bg-gray-100"
            aria-label={showConfirm ? 'Hide password confirmation' : 'Show password confirmation'}
            aria-pressed={showConfirm}
            title={showConfirm ? 'Hide password confirmation' : 'Show password confirmation'}
            onClick={() => setShowConfirm(!showConfirm)}
          >
            {showConfirm ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
          </Button>
        </div>
        {errors.confirm && (
          <div id="reg-confirm-error" className="flex items-start gap-2 text-sm text-red-600" aria-live="polite" role="alert">
            <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>{errors.confirm.message}</span>
          </div>
        )}
        {touchedFields.confirm && !errors.confirm && watchedPassword === watchedConfirm && watchedConfirm && (
          <div id="reg-confirm-success" className="flex items-center gap-2 text-sm text-green-600" aria-live="polite">
            <CheckCircle className="h-4 w-4" aria-hidden="true" />
            <span>Passwords match!</span>
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={mutation.isPending || !isValid || watchedPassword !== watchedConfirm}
        className="w-full h-11 text-base font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-describedby={mutation.isPending ? 'registration-loading' : undefined}
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="animate-spin h-5 w-5 mr-2" aria-hidden="true" />
            <span id="registration-loading">Creating your account...</span>
          </>
        ) : (
          'Create Account'
        )}
      </Button>

      {mutation.isSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-800">Account Created Successfully!</AlertTitle>
          <AlertDescription className="text-green-700 mt-1">
            Welcome to UserHub! Your account has been created and you're ready to get started.
          </AlertDescription>
        </Alert>
      )}

      {mutation.isError && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <XCircle className="h-5 w-5" />
          <AlertTitle>Registration Failed</AlertTitle>
          <AlertDescription className="mt-1">
            {errorMessages.length > 1 ? (
              <ul className="list-disc pl-5 space-y-1 mt-2">
                {errorMessages.map((msg, i) => (
                  <li key={i} className="text-red-700">{msg}</li>
                ))}
              </ul>
            ) : (
              <span className="text-red-700">{errorMessages[0]}</span>
            )}
            <div className="mt-3 text-sm text-red-600">
              Please check your information and try again.
            </div>
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}
