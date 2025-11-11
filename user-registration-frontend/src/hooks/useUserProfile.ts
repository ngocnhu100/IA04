import { useQuery } from "@tanstack/react-query";
import { getUserProfile, User } from "@/api";

export function useUserProfile() {
  const accessToken = localStorage.getItem("accessToken");

  return useQuery<User>({
    queryKey: ["user-profile"],
    queryFn: getUserProfile,
    enabled: !!accessToken, // Only fetch when we have an access token
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized)
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
}
