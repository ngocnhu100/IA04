import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import LoginForm from '../components/LoginForm';
import { loginUser } from '../api';
import '@testing-library/jest-dom';

// Mock the API
vi.mock('../api', () => ({
  loginUser: vi.fn(),
  setTokenGetter: vi.fn(),
  setTokenRefreshCallback: vi.fn(),
  setLogoutCallback: vi.fn(),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('LoginForm - Authentication Flow (Req 1)', () => {
  const mockLoginUser = vi.mocked(loginUser);

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('should render login form with required fields', () => {
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    // Trigger validation by focusing and blurring the fields
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^Password/);
    
    await user.click(emailInput);
    await user.click(passwordInput);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email address is required to sign in/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required to sign in/i)).toBeInTheDocument();
    });
  });

  it('should show validation errors for invalid email format', async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^Password/);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'invalid-email');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('should successfully login with valid credentials and navigate', async () => {
    const user = userEvent.setup();
    const mockTokens = {
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-456',
    };

    // Mock a slow API call to show loading state
    mockLoginUser.mockImplementation(() => new Promise(resolve => 
      setTimeout(() => resolve(mockTokens), 100)
    ));

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^Password/);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Should show loading state
    expect(screen.getByText(/signing you in\.\.\./i)).toBeInTheDocument();

    // Should call the API with correct credentials
    await waitFor(() => {
      expect(mockLoginUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    // Should show success message and navigate
    await waitFor(() => {
      expect(screen.getByText(/login successful/i)).toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    }, { timeout: 3000 });
  });

  it('should show error message for invalid credentials', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Invalid credentials';

    mockLoginUser.mockRejectedValue(new Error(errorMessage));

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^Password/);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
      expect(screen.getByText(/the email address or password you entered is incorrect/i)).toBeInTheDocument();
    });
  });

  it('should disable submit button during loading', async () => {
    const user = userEvent.setup();

    // Mock a slow API call that resolves with tokens
    mockLoginUser.mockImplementation(() => new Promise(resolve => 
      setTimeout(() => resolve({
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
      }), 100)
    ));

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^Password/);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Button should be disabled during loading
    expect(submitButton).toBeDisabled();

    // Wait for completion
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    const passwordInput = screen.getByLabelText(/^Password/);
    const toggleButton = screen.getByLabelText(/show password/i);

    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Click to show password
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(toggleButton).toHaveAttribute('aria-pressed', 'true');

    // Click to hide password again
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(toggleButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('should navigate to signup page when signup link is clicked', async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    const signupLink = screen.getByText(/sign up here/i);
    await user.click(signupLink);

    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });
});