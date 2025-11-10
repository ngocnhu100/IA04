import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { loginUser, refreshToken, setTokenGetter, setTokenRefreshCallback } from '../api';
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock API functions
vi.mock('../api', () => ({
  loginUser: vi.fn(),
  refreshToken: vi.fn(),
  setTokenGetter: vi.fn(),
  setTokenRefreshCallback: vi.fn(),
}));

describe('AuthContext', () => {
  const mockLoginUser = vi.mocked(loginUser);
  const mockRefreshToken = vi.mocked(refreshToken);
  const mockSetTokenGetter = vi.mocked(setTokenGetter);
  const mockSetTokenRefreshCallback = vi.mocked(setTokenRefreshCallback);

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();

    // Setup default mock implementations
    mockSetTokenGetter.mockImplementation(() => {});
    mockSetTokenRefreshCallback.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial state', () => {
    it('should initialize with logged out state when no tokens exist', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const TestComponent = () => {
        const { isLoggedIn, isLoading } = useAuth();
        return (
          <div>
            <div data-testid="logged-in">{isLoggedIn.toString()}</div>
            <div data-testid="loading">{isLoading.toString()}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
        expect(screen.getByTestId('logged-in')).toHaveTextContent('false');
      });
    });

    it('should attempt to refresh tokens on initialization when refresh token exists', async () => {
      const mockTokens = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
      };

      localStorageMock.getItem.mockReturnValue('refresh-token-456');
      mockRefreshToken.mockResolvedValue(mockTokens);

      const TestComponent = () => {
        const { isLoggedIn, isLoading } = useAuth();
        return (
          <div>
            <div data-testid="logged-in">{isLoggedIn.toString()}</div>
            <div data-testid="loading">{isLoading.toString()}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockRefreshToken).toHaveBeenCalledWith('refresh-token-456');
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
        expect(screen.getByTestId('logged-in')).toHaveTextContent('true');
      });
    });
  });

  describe('login function', () => {
    it('should successfully login and store tokens', async () => {
      const mockTokens = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
      };

      mockLoginUser.mockResolvedValue(mockTokens);

      const TestComponent = () => {
        const { login, isLoggedIn } = useAuth();

        const handleLogin = async () => {
          try {
            await login('test@example.com', 'password123');
          } catch (error) {
            // Handle error
          }
        };

        return (
          <div>
            <button onClick={handleLogin} data-testid="login-btn">Login</button>
            <div data-testid="logged-in">{isLoggedIn.toString()}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = screen.getByTestId('login-btn');
      await userEvent.click(loginButton);

      await waitFor(() => {
        expect(mockLoginUser).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
        expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', 'refresh-token-456');
        expect(screen.getByTestId('logged-in')).toHaveTextContent('true');
      });
    });

    it('should handle login errors', async () => {
      const errorMessage = 'Invalid credentials';
      mockLoginUser.mockRejectedValue(new Error(errorMessage));

      const TestComponent = () => {
        const { login } = useAuth();
        const [error, setError] = React.useState<string | null>(null);

        const handleLogin = async () => {
          try {
            await login('test@example.com', 'wrongpassword');
            setError(null);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
          }
        };

        return (
          <div>
            <button onClick={handleLogin} data-testid="login-btn">Login</button>
            <div data-testid="error">{error}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = screen.getByTestId('login-btn');
      await userEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
      });
    });
  });

  describe('logout function', () => {
    it('should clear all tokens and set logged out state', async () => {
      // First login
      const mockTokens = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
      };

      mockLoginUser.mockResolvedValue(mockTokens);

      const TestComponent = () => {
        const { login, logout, isLoggedIn } = useAuth();

        const handleLogin = async () => {
          await login('test@example.com', 'password123');
        };

        const handleLogout = () => {
          logout();
        };

        return (
          <div>
            <button onClick={handleLogin} data-testid="login-btn">Login</button>
            <button onClick={handleLogout} data-testid="logout-btn">Logout</button>
            <div data-testid="logged-in">{isLoggedIn.toString()}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Login first
      const loginButton = screen.getByTestId('login-btn');
      await userEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('logged-in')).toHaveTextContent('true');
      });

      // Then logout
      const logoutButton = screen.getByTestId('logout-btn');
      await userEvent.click(logoutButton);

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
        expect(screen.getByTestId('logged-in')).toHaveTextContent('false');
      });
    });
  });

  describe('Token management (Req 2)', () => {
    it('should store access token in memory only', async () => {
      const mockTokens = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
      };

      mockLoginUser.mockResolvedValue(mockTokens);

      const TestComponent = () => {
        const { login } = useAuth();

        const handleLogin = async () => {
          await login('test@example.com', 'password123');
        };

        return (
          <button onClick={handleLogin} data-testid="login-btn">Login</button>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = screen.getByTestId('login-btn');
      await userEvent.click(loginButton);

      await waitFor(() => {
        // Access token should NOT be stored in localStorage
        expect(localStorageMock.setItem).not.toHaveBeenCalledWith('accessToken', expect.any(String));
        // Refresh token SHOULD be stored in localStorage
        expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', 'refresh-token-456');
      });
    });

    it('should clear both access token (memory) and refresh token (localStorage) on logout', async () => {
      const mockTokens = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
      };

      mockLoginUser.mockResolvedValue(mockTokens);

      const TestComponent = () => {
        const { login, logout } = useAuth();

        const handleLogin = async () => {
          await login('test@example.com', 'password123');
        };

        const handleLogout = () => {
          logout();
        };

        return (
          <div>
            <button onClick={handleLogin} data-testid="login-btn">Login</button>
            <button onClick={handleLogout} data-testid="logout-btn">Logout</button>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Login
      const loginButton = screen.getByTestId('login-btn');
      await userEvent.click(loginButton);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', 'refresh-token-456');
      });

      // Logout
      const logoutButton = screen.getByTestId('logout-btn');
      await userEvent.click(logoutButton);

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
      });
    });
  });
});