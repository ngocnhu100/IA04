import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import { AuthProvider } from '../contexts/AuthContext';
import { loginUser, getUserProfile } from '../api';
import '@testing-library/jest-dom';

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Mock the API
vi.mock('../api', () => ({
  loginUser: vi.fn(),
  setTokenGetter: vi.fn(),
  setTokenRefreshCallback: vi.fn(),
  setLogoutCallback: vi.fn(),
  getUserProfile: vi.fn(),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('LoginForm - Authentication Flow (Req 1)', () => {
  const mockLoginUser = vi.mocked(loginUser);
  const mockGetUserProfile = vi.mocked(getUserProfile);

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    // Mock getUserProfile to return a user object
    mockGetUserProfile.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      createdAt: '2023-01-01T00:00:00.000Z',
    });
  });

  it('should render login form with required fields', () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
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
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
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
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
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

    // Should show success message (navigation is handled by parent Login component)
    await waitFor(() => {
      expect(screen.getByText(/login successful/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should show error message for invalid credentials', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Invalid credentials';

    mockLoginUser.mockRejectedValue(new Error(errorMessage));

    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
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
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
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
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
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
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    const signupLink = screen.getByText(/sign up here/i);
    await user.click(signupLink);

    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });
});