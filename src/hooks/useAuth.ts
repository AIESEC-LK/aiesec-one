import { useEffect, useState } from "react";
import { UserType } from "@/types/auth";
import { USER_TYPE } from "@/constants/common.constants";

export function useAuth() {
  const [userType, setUserType] = useState<UserType>(USER_TYPE.MEMBER);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("api/auth/me", {
          method: "GET"
        });
        if (!response.ok) throw new Error("Auth failed");

        const { userType } = await response.json();
        setUserType(userType);
      } catch (error) {
        setUserType(USER_TYPE.MEMBER);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);
  return { userType, isLoading };
}
