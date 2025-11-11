import { useMutation, useQueryClient } from "@tanstack/react-query";
import { registerUser, RegisterDto, LoginDto } from "@/api";
import { useAuth } from "@/contexts/AuthContext";

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const { login } = useAuth();

  return useMutation({
    mutationFn: async (credentials: LoginDto) => {
      // Use AuthContext login function instead of direct API call
      await login(credentials.email, credentials.password);
    },
    onSuccess: () => {
      // Navigation will be handled by Login component's useEffect
      // Profile will be fetched when Home component renders
    },
    onError: (error) => {
      console.error("Login failed:", error);
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const { logout } = useAuth();

  return useMutation({
    mutationFn: async () => {
      // Use AuthContext logout function
      logout();
    },
    onSuccess: () => {
      // Clear user profile from cache
      queryClient.removeQueries({ queryKey: ["user-profile"] });
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
