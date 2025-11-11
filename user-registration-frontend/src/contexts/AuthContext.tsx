import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, refreshToken, AuthTokens, setTokenGetter, setTokenRefreshCallback, setLogoutCallback } from '@/api';
import { getTimeUntilExpiration, isTokenExpired } from '@/lib/utils';
import Cookies from 'js-cookie';

interface AuthContextType {
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  refreshAccessToken?: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = import.meta.env.VITE_ACCESS_TOKEN_KEY || 'accessToken';
const REFRESH_TOKEN_KEY = import.meta.env.VITE_REFRESH_TOKEN_KEY || 'refreshToken';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to clear the refresh timer
  const clearRefreshTimer = () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };

  // Function to schedule token refresh before expiration
  const scheduleTokenRefresh = (token: string) => {
    if (!token) return;

    clearRefreshTimer(); // Clear any existing timer

    const timeUntilExpiration = getTimeUntilExpiration(token);
    if (timeUntilExpiration <= 0) return;

    // Refresh 5 minutes before expiration, or immediately if less than 5 minutes remain
    const refreshTime = Math.max(0, timeUntilExpiration - 5 * 60 * 1000); // 5 minutes in milliseconds

    console.log(`Token refresh scheduled in ${Math.round(refreshTime / 1000 / 60)} minutes`);

    refreshTimerRef.current = setTimeout(async () => {
      try {
        await refreshAccessToken();
      } catch (error) {
        console.error('Failed to refresh token automatically:', error);
      }
    }, refreshTime);
  };

  // Set up token getter for API calls
  useEffect(() => {
    setTokenGetter(() => accessToken);
  }, [accessToken]);

  // Set up token refresh callback
  useEffect(() => {
    setTokenRefreshCallback((tokens: AuthTokens) => {
      setAccessToken(tokens.accessToken);
      Cookies.set(REFRESH_TOKEN_KEY, tokens.refreshToken, { expires: 7, secure: true, sameSite: 'strict' });
      // Schedule next refresh for the new token
      scheduleTokenRefresh(tokens.accessToken);
    });
  }, []);

  // Set up logout callback
  useEffect(() => {
    setLogoutCallback(() => {
      // Clear refresh timer
      clearRefreshTimer();
      // Clear access token from memory
      setAccessToken(null);
      // Clear refresh token from cookies
      Cookies.remove(REFRESH_TOKEN_KEY);
      setIsLoggedIn(false);
      // Redirect to login page
      navigate('/login');
    });
  }, [navigate]);

  // Check if user is logged in on app start
  useEffect(() => {
    const storedRefreshToken = Cookies.get(REFRESH_TOKEN_KEY);

    if (storedRefreshToken) {
      // If we have a refresh token, try to refresh to get a new access token
      refreshAccessToken().then((newToken) => {
        if (newToken) {
          setAccessToken(newToken);
          setIsLoggedIn(true);
          // Schedule refresh for the new token
          scheduleTokenRefresh(newToken);
        } else {
          // If refresh fails, clear everything
          Cookies.remove(REFRESH_TOKEN_KEY);
        }
      }).finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      clearRefreshTimer();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const tokens: AuthTokens = await loginUser({ email, password });

      // Store access token in memory
      setAccessToken(tokens.accessToken);
      // Store refresh token in cookies
      Cookies.set(REFRESH_TOKEN_KEY, tokens.refreshToken, { expires: 7, secure: true, sameSite: 'strict' });

      setIsLoggedIn(true);
      // Schedule token refresh for the new access token
      scheduleTokenRefresh(tokens.accessToken);
    } catch (error) {
      throw error; // Re-throw to let the component handle the error
    }
  };

  const logout = () => {
    // Clear access token from memory
    setAccessToken(null);
    // Clear refresh token from cookies
    Cookies.remove(REFRESH_TOKEN_KEY);
    setIsLoggedIn(false);
    // Redirect to login page
    navigate('/login');
  };

  // Function to refresh access token (can be called when needed)
  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const storedRefreshToken = Cookies.get(REFRESH_TOKEN_KEY);
      if (!storedRefreshToken) {
        logout();
        return null;
      }

      const tokens: AuthTokens = await refreshToken(storedRefreshToken);

      // Update access token in memory
      setAccessToken(tokens.accessToken);
      // Update refresh token in cookies
      Cookies.set(REFRESH_TOKEN_KEY, tokens.refreshToken, { expires: 7, secure: true, sameSite: 'strict' });

      // Schedule next refresh for the new token
      scheduleTokenRefresh(tokens.accessToken);

      return tokens.accessToken;
    } catch (error) {
      logout(); // If refresh fails, logout user
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{
      isLoggedIn,
      login,
      logout,
      isLoading,
      refreshAccessToken: refreshAccessToken as any // Add this to context if needed
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}