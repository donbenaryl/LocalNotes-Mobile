import { useEffect, useState } from "react";
import businessService from "@/http/business-api/business.service";

export function useBusinessFollow(
  businessId: string | undefined,
  initialIsFollowed: boolean,
  onFollowChange?: (businessId: string, isFollowed: boolean) => void,
) {
  const [isFollowed, setIsFollowed] = useState(initialIsFollowed);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    setIsFollowed(initialIsFollowed);
  }, [initialIsFollowed]);

  const toggle = async () => {
    if (!businessId || isToggling) return;
    setIsToggling(true);
    try {
      if (isFollowed) {
        await businessService.unfollowBusiness(businessId);
      } else {
        await businessService.followBusiness(businessId);
      }
      const next = !isFollowed;
      setIsFollowed(next);
      onFollowChange?.(businessId, next);
    } catch (error) {
      console.error(`Failed to toggle follow for business ${businessId}:`, error);
    } finally {
      setIsToggling(false);
    }
  };

  return { isFollowed, isToggling, toggle };
}
