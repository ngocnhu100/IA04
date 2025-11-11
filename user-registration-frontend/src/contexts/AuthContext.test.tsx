import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { loginUser, refreshToken, setTokenGetter, setTokenRefreshCallback, setLogoutCallback } from '../api';
import '@testing-library/jest-dom';
import Cookies from 'js-cookie';

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

// Mock Cookies
vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

// Mock API functions
vi.mock('../api', () => ({
  loginUser: vi.fn(),
  refreshToken: vi.fn(),
  setTokenGetter: vi.fn(),
  setTokenRefreshCallback: vi.fn(),
  setLogoutCallback: vi.fn(),
}));

describe('AuthContext', () => {
  const mockLoginUser = vi.mocked(loginUser);
  const mockRefreshToken = vi.mocked(refreshToken);
  const mockSetTokenGetter = vi.mocked(setTokenGetter);
  const mockSetTokenRefreshCallback = vi.mocked(setTokenRefreshCallback);
  const mockSetLogoutCallback = vi.mocked(setLogoutCallback);

  beforeEach(() => {
    vi.clearAllMocks();
    (Cookies.get as any).mockClear();
    (Cookies.set as any).mockClear();
    (Cookies.remove as any).mockClear();

    // Setup default mock implementations
    mockSetTokenGetter.mockImplementation(() => {});
    mockSetTokenRefreshCallback.mockImplementation(() => {});
    mockSetLogoutCallback.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial state', () => {
    it('should initialize with logged out state when no tokens exist', async () => {
      (Cookies.get as any).mockReturnValue(undefined);

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
        <TestWrapper>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </TestWrapper>
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

      (Cookies.get as any).mockReturnValue('refresh-token-456');
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
        <TestWrapper>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </TestWrapper>
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
        <TestWrapper>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </TestWrapper>
      );

      const loginButton = screen.getByTestId('login-btn');
      await userEvent.click(loginButton);

      await waitFor(() => {
        expect(mockLoginUser).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
        expect(Cookies.set).toHaveBeenCalledWith('refreshToken', 'refresh-token-456', { expires: 7, secure: true, sameSite: 'strict' });
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
        <TestWrapper>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </TestWrapper>
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
        <TestWrapper>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </TestWrapper>
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
        expect(Cookies.remove).toHaveBeenCalledWith('refreshToken');
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
        <TestWrapper>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </TestWrapper>
      );

      const loginButton = screen.getByTestId('login-btn');
      await userEvent.click(loginButton);

      await waitFor(() => {
        // Access token should NOT be stored in cookies
        expect(Cookies.set).not.toHaveBeenCalledWith('accessToken', expect.any(String));
        // Refresh token SHOULD be stored in cookies
        expect(Cookies.set).toHaveBeenCalledWith('refreshToken', 'refresh-token-456', { expires: 7, secure: true, sameSite: 'strict' });
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
        <TestWrapper>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </TestWrapper>
      );

      // Login
      const loginButton = screen.getByTestId('login-btn');
      await userEvent.click(loginButton);

      await waitFor(() => {
        expect(Cookies.set).toHaveBeenCalledWith('refreshToken', 'refresh-token-456', { expires: 7, secure: true, sameSite: 'strict' });
      });

      // Logout
      const logoutButton = screen.getByTestId('logout-btn');
      await userEvent.click(logoutButton);

      await waitFor(() => {
        expect(Cookies.remove).toHaveBeenCalledWith('refreshToken');
      });
    });

    it('should automatically logout when refresh token expires', async () => {
      // Mock refresh token to fail (simulate expired refresh token)
      mockRefreshToken.mockRejectedValue(new Error('Refresh token expired'));

      // Set up initial state with refresh token
      (Cookies.get as any).mockReturnValue('refresh-token-456');

      const TestComponent = () => {
        const { refreshAccessToken, isLoggedIn } = useAuth();

        const handleRefresh = async () => {
          await refreshAccessToken?.();
        };

        return (
          <div>
            <button onClick={handleRefresh} data-testid="refresh-btn">Refresh Token</button>
            <div data-testid="login-status">{isLoggedIn.toString()}</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </TestWrapper>
      );

      // Wait for initial load to complete
      await waitFor(() => {
        expect(mockRefreshToken).toHaveBeenCalledWith('refresh-token-456');
      });

      // The refresh should have failed and triggered logout
      await waitFor(() => {
        expect(Cookies.remove).toHaveBeenCalledWith('refreshToken');
        expect(screen.getByTestId('login-status')).toHaveTextContent('false');
        expect(mockUseNavigate).toHaveBeenCalledWith('/login');
      });
    });
  });
});