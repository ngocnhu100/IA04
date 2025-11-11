import { useQuery } from "@tanstack/react-query";
import { getUserProfile, User } from "@/api";

export function useUserProfile() {
  return useQuery<User>({
    queryKey: ["user-profile"],
    queryFn: getUserProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
