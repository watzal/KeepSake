import { useUser } from "@clerk/nextjs";

export function useDisplayName(): string {
  const { user } = useUser();
  return user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "Traveler";
}
