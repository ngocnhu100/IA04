import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { loginUser, refreshToken, AuthTokens, setTokenGetter, setTokenRefreshCallback } from '@/api';

interface AuthContextType {
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  refreshAccessToken?: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Set up token getter for API calls
  useEffect(() => {
    setTokenGetter(() => accessToken);
  }, [accessToken]);

  // Set up token refresh callback
  useEffect(() => {
    setTokenRefreshCallback((tokens: AuthTokens) => {
      setAccessToken(tokens.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    });
  }, []);

  // Check if user is logged in on app start
  useEffect(() => {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (storedRefreshToken) {
      // If we have a refresh token, try to refresh to get a new access token
      refreshAccessToken().then((newToken) => {
        if (newToken) {
          setAccessToken(newToken);
          setIsLoggedIn(true);
        } else {
          // If refresh fails, clear everything
          localStorage.removeItem(REFRESH_TOKEN_KEY);
        }
      }).finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const tokens: AuthTokens = await loginUser({ email, password });

      // Store access token in memory
      setAccessToken(tokens.accessToken);
      // Store refresh token in localStorage
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);

      setIsLoggedIn(true);
    } catch (error) {
      throw error; // Re-throw to let the component handle the error
    }
  };

  const logout = () => {
    // Clear access token from memory
    setAccessToken(null);
    // Clear refresh token from localStorage
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setIsLoggedIn(false);
  };

  // Function to refresh access token (can be called when needed)
  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!storedRefreshToken) {
        logout();
        return null;
      }

      const tokens: AuthTokens = await refreshToken(storedRefreshToken);

      // Update access token in memory
      setAccessToken(tokens.accessToken);
      // Update refresh token in localStorage
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);

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