import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { loginUser, refreshToken, AuthTokens } from '@/api';

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

  // Check if user is logged in on app start
  useEffect(() => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (accessToken && refreshToken) {
      // Try to validate the access token or refresh if needed
      setIsLoggedIn(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const tokens: AuthTokens = await loginUser({ email, password });

      // Store tokens in localStorage
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);

      setIsLoggedIn(true);
    } catch (error) {
      throw error; // Re-throw to let the component handle the error
    }
  };

  const logout = () => {
    // Clear tokens from localStorage
    localStorage.removeItem(ACCESS_TOKEN_KEY);
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

      // Update stored tokens
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
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