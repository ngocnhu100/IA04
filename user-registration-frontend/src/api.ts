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
});

// Request interceptor to add access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const tokens = await refreshTokenAPI(refreshToken);

          // Update stored tokens
          localStorage.setItem("accessToken", tokens.accessToken);
          localStorage.setItem("refreshToken", tokens.refreshToken);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login or logout
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
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

export default api;
