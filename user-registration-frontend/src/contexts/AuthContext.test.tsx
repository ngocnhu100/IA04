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

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock window event listeners
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
  writable: true,
});
Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
  writable: true,
});

// Mock API functions

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
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    mockAddEventListener.mockClear();
    mockRemoveEventListener.mockClear();

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

  describe('Multi-tab synchronization', () => {
    it('should logout when logout event is detected from another tab', async () => {
      // First login to set up authenticated state
      const mockTokens = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
      };

      mockLoginUser.mockResolvedValue(mockTokens);

      const TestComponent = () => {
        const { login, isLoggedIn } = useAuth();

        const handleLogin = async () => {
          await login('test@example.com', 'password123');
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

      // Login first
      const loginButton = screen.getByTestId('login-btn');
      await userEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('logged-in')).toHaveTextContent('true');
      });

      // Get the storage event listener that was added
      const storageListener = mockAddEventListener.mock.calls.find(call => call[0] === 'storage')?.[1];

      // Simulate logout event from another tab
      const storageEvent = new StorageEvent('storage', {
        key: 'auth_logout_event',
        newValue: Date.now().toString(),
        oldValue: null,
      });

      // Call the event listener directly
      storageListener(storageEvent);

      // Should logout automatically
      await waitFor(() => {
        expect(Cookies.remove).toHaveBeenCalledWith('refreshToken');
        expect(screen.getByTestId('logged-in')).toHaveTextContent('false');
        expect(mockUseNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should set logout event in localStorage when logout is called', async () => {
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

      // Logout
      const logoutButton = screen.getByTestId('logout-btn');
      await userEvent.click(logoutButton);

      // Should set logout event in localStorage
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_logout_event', expect.any(String));
        expect(Cookies.remove).toHaveBeenCalledWith('refreshToken');
        expect(screen.getByTestId('logged-in')).toHaveTextContent('false');
      });

      // Should clean up the logout event after a delay
      await waitFor(() => {
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_logout_event');
      }, { timeout: 200 });
    });

    it('should not react to unrelated localStorage changes', async () => {
      // First login to set up authenticated state
      const mockTokens = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
      };

      mockLoginUser.mockResolvedValue(mockTokens);

      const TestComponent = () => {
        const { login, isLoggedIn } = useAuth();

        const handleLogin = async () => {
          await login('test@example.com', 'password123');
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

      // Login first
      const loginButton = screen.getByTestId('login-btn');
      await userEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('logged-in')).toHaveTextContent('true');
      });

      // Record the call count before the storage event
      const removeCallCountBefore = (Cookies.remove as any).mock.calls.filter((call: string[]) => call[0] === 'refreshToken').length;

      // Get the storage event listener that was added
      const storageCall = mockAddEventListener.mock.calls.find(call => call[0] === 'storage');
      expect(storageCall).toBeDefined();
      const storageListener = storageCall![1];

      // Simulate unrelated localStorage change
      const storageEvent = new StorageEvent('storage', {
        key: 'some_other_key',
        newValue: 'some_value',
        oldValue: null,
      });

      // Record navigation calls before
      const navigateCallCountBefore = mockUseNavigate.mock.calls.length;

      // Call the event listener directly
      storageListener(storageEvent);

      // Wait a bit to ensure any async operations complete
      await new Promise(resolve => setTimeout(resolve, 50));

      // Check that navigation was not called
      const navigateCallCountAfter = mockUseNavigate.mock.calls.length;
      expect(navigateCallCountAfter).toBe(navigateCallCountBefore);
    });
  });
});