import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RegisterForm from '../components/RegisterForm';
import { registerUser, NetworkError, TimeoutError, ServerError } from '../api';
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
      {children}
    </QueryClientProvider>
  );
}

// Mock react-router-dom
const mockUseNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockUseNavigate,
}));

// Mock API functions
vi.mock('../api', () => ({
  registerUser: vi.fn(),
  NetworkError: class NetworkError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'NetworkError';
    }
  },
  TimeoutError: class TimeoutError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'TimeoutError';
    }
  },
  ServerError: class ServerError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ServerError';
    }
  },
}));

describe('RegisterForm', () => {
  const mockRegisterUser = vi.mocked(registerUser);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Retry functionality', () => {
    it('should show retry button for network errors and retry on click', async () => {
      const user = userEvent.setup();

      // Mock network error
      mockRegisterUser.mockRejectedValueOnce(new NetworkError('Network connection failed'));
      // Mock success on retry
      mockRegisterUser.mockResolvedValueOnce({ message: 'User registered successfully' });

      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      // Fill form
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const passwordInput = screen.getByLabelText(/^password/i);
      await user.type(passwordInput, 'ValidPass123');

      const confirmInput = screen.getByLabelText(/confirm password/i);
      await user.type(confirmInput, 'ValidPass123');

      // Submit form - should fail with network error
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('Connection Problem')).toBeInTheDocument();
      });

      // Check that retry button is present
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();

      // Click retry button
      await user.click(retryButton);

      // Wait for success
      await waitFor(() => {
        expect(screen.getByText('Account Created Successfully!')).toBeInTheDocument();
        expect(mockRegisterUser).toHaveBeenCalledTimes(2);
      });
    });

    it('should show retry button for timeout errors and retry on click', async () => {
      const user = userEvent.setup();

      // Mock timeout error
      mockRegisterUser.mockRejectedValueOnce(new TimeoutError('Request timed out'));
      // Mock success on retry
      mockRegisterUser.mockResolvedValueOnce({ message: 'User registered successfully' });

      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      // Fill form
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const passwordInput = screen.getByLabelText(/^password/i);
      await user.type(passwordInput, 'ValidPass123');

      const confirmInput = screen.getByLabelText(/confirm password/i);
      await user.type(confirmInput, 'ValidPass123');

      // Submit form - should fail with timeout error
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('Connection Problem')).toBeInTheDocument();
      });

      // Check that retry button is present
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();

      // Click retry button
      await user.click(retryButton);

      // Wait for success
      await waitFor(() => {
        expect(screen.getByText('Account Created Successfully!')).toBeInTheDocument();
        expect(mockRegisterUser).toHaveBeenCalledTimes(2);
      });
    });

    it('should show retry button for server errors and retry on click', async () => {
      const user = userEvent.setup();

      // Mock server error
      mockRegisterUser.mockRejectedValueOnce(new ServerError('Internal server error'));
      // Mock success on retry
      mockRegisterUser.mockResolvedValueOnce({ message: 'User registered successfully' });

      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      // Fill form
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const passwordInput = screen.getByLabelText(/^password/i);
      await user.type(passwordInput, 'ValidPass123');

      const confirmInput = screen.getByLabelText(/confirm password/i);
      await user.type(confirmInput, 'ValidPass123');

      // Submit form - should fail with server error
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('Server Error')).toBeInTheDocument();
      });

      // Check that retry button is present
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();

      // Click retry button
      await user.click(retryButton);

      // Wait for success
      await waitFor(() => {
        expect(screen.getByText('Account Created Successfully!')).toBeInTheDocument();
        expect(mockRegisterUser).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Form Rendering', () => {
    it('should render registration form with required fields', () => {
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });
  });
});