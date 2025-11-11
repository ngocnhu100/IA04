import axios from "axios";

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

const baseURL =
  (import.meta.env?.VITE_API_URL as string) || "http://localhost:3000";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
});

// Error types for better error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorType:
      | "auth"
      | "network"
      | "server"
      | "validation"
      | "unknown" = "unknown",
    public field?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class NetworkError extends ApiError {
  constructor(
    message: string = "Network connection failed. Please check your internet connection and try again."
  ) {
    super(message, undefined, "network");
    this.name = "NetworkError";
  }
}

export class TimeoutError extends ApiError {
  constructor(message: string = "Request timed out. Please try again.") {
    super(message, 408, "network");
    this.name = "TimeoutError";
  }
}

export class ServerError extends ApiError {
  constructor(
    message: string = "Server error occurred. Please try again later.",
    statusCode?: number
  ) {
    super(message, statusCode, "server");
    this.name = "ServerError";
  }
}

export class AuthError extends ApiError {
  constructor(message: string, statusCode: number = 401, field?: string) {
    super(message, statusCode, "auth", field);
    this.name = "AuthError";
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, field?: string) {
    super(message, 400, "validation", field);
    this.name = "ValidationError";
  }
}

// Function to get access token (will be set by AuthContext)
let getAccessToken: () => string | null = () =>
  localStorage.getItem("accessToken");
// Function to refresh tokens (will be set by AuthContext)
let refreshTokensCallback: ((tokens: AuthTokens) => void) | null = null;
// Function to logout (will be set by AuthContext)
let logoutCallback: (() => void) | null = null;

// Set the token getter function
export const setTokenGetter = (getter: () => string | null) => {
  getAccessToken = getter;
};

// Set the token refresh callback
export const setTokenRefreshCallback = (
  callback: (tokens: AuthTokens) => void
) => {
  refreshTokensCallback = callback;
};

// Set the logout callback
export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

// Request interceptor to add access token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (authentication/token issues)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const tokens = await refreshTokenAPI(refreshToken);

          // Update tokens using the callback
          if (refreshTokensCallback) {
            refreshTokensCallback(tokens);
          }

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, logout user
        if (logoutCallback) {
          logoutCallback();
        }
        throw new AuthError(
          "Your session has expired. Please log in again.",
          401
        );
      }
    }

    // Handle different types of errors
    if (!error.response) {
      // Network error (no response received)
      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        throw new TimeoutError();
      }
      throw new NetworkError();
    }

    // Server responded with error
    const { status, data } = error.response;
    const errorMessage = data?.message || error.message;
    const errorField = data?.field;

    if (status >= 500) {
      throw new ServerError(errorMessage, status);
    }

    if (status === 400) {
      throw new ValidationError(errorMessage, errorField);
    }

    if (status === 401) {
      throw new AuthError(errorMessage, status, errorField);
    }

    if (status === 403) {
      throw new AuthError(
        "You do not have permission to perform this action.",
        status,
        errorField
      );
    }

    if (status === 404) {
      throw new ApiError(
        "The requested resource was not found.",
        status,
        "unknown",
        errorField
      );
    }

    if (status === 409) {
      throw new ValidationError(errorMessage, errorField);
    }

    if (status === 422) {
      throw new ValidationError(errorMessage, errorField);
    }

    // Default error
    throw new ApiError(
      errorMessage || "An unexpected error occurred. Please try again.",
      status,
      "unknown",
      errorField
    );
  }
);

// Helper function for refresh token API call (to avoid circular dependency)
async function refreshTokenAPI(refreshToken: string): Promise<AuthTokens> {
  const response = await axios.post(`${baseURL}/auth/refresh`, {
    refreshToken,
  });
  return response.data;
}

export type RegisterDto = { email: string; password: string };
export type LoginDto = { email: string; password: string };

export async function registerUser(data: RegisterDto) {
  const response = await api.post("/user/register", data);
  return response.data;
}

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export async function loginUser(data: LoginDto): Promise<AuthTokens> {
  const response = await api.post("/auth/login", data);
  return response.data;
}

export async function refreshToken(refreshToken: string): Promise<AuthTokens> {
  const response = await api.post("/auth/refresh", { refreshToken });
  return response.data;
}

export async function getApiStatus() {
  const response = await api.get("/");
  return response.data as string;
}

export type User = {
  id: string;
  email: string;
  createdAt: string;
};

export async function getUserProfile(): Promise<User> {
  const response = await api.get("/user/profile");
  return response.data;
}

export default api;
