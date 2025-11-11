import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  loginUser,
  registerUser,
  getUserProfile,
  refreshToken,
  AuthTokens,
  RegisterDto,
  LoginDto,
} from "@/api";
import { useNavigate } from "react-router-dom";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (credentials: LoginDto) => {
      const tokens: AuthTokens = await loginUser(credentials);
      return tokens;
    },
    onSuccess: (tokens: AuthTokens) => {
      // Store tokens
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);

      // Fetch user profile and cache it
      queryClient.fetchQuery({
        queryKey: ["user-profile"],
        queryFn: getUserProfile,
        staleTime: 5 * 60 * 1000,
      });

      // Navigate to home
      navigate("/");
    },
    onError: (error) => {
      console.error("Login failed:", error);
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      // Clear tokens
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    },
    onSuccess: () => {
      // Clear user profile from cache
      queryClient.removeQueries({ queryKey: ["user-profile"] });
      // Navigate to login
      navigate("/login");
    },
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      // Could navigate to login or show success message
    },
    onError: (error) => {
      console.error("Registration failed:", error);
    },
  });
}
