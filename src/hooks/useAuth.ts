import { useEffect, useState } from "react";
import { UserType } from "@/types/auth";
import { USER_TYPE } from "@/constants/common.constants";

export function useAuth() {
  const [userType, setUserType] = useState<UserType>(USER_TYPE.MEMBER);
  const [officeId, setOfficeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("api/auth/me", {
          method: "GET"
        });
        if (!response.ok) throw new Error("Auth failed");

        const { userType, officeId } = await response.json();
        setUserType(userType);
        setOfficeId(officeId);
        setIsAuthenticated(true);
      } catch (error) {
        setUserType(USER_TYPE.MEMBER);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);
  return { userType, officeId, isLoading, isAuthenticated };
}
