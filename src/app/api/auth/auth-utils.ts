import { cookies } from "next/headers";
import { GetTokenResponse } from "@/app/api/auth/auth-types";

export function isLoggedIn(): boolean {
  const accessToken = cookies().get("access_token");

  if (
    accessToken?.value &&
    accessToken.value !== "" &&
    accessToken.value !== null
  ) {
    return true;
  }

  const refresh_token = cookies().get("refresh_token");
  return !!(
    refresh_token?.value &&
    refresh_token.value !== "" &&
    refresh_token.value !== null
  );
}

export function isAccessTokenPresent(): boolean {
  const accessToken = cookies().get("access_token");
  return !!(
    accessToken?.value &&
    accessToken.value !== "" &&
    accessToken.value !== null
  );
}

export async function getAccessTokenFromOauth(
  code: string
): Promise<GetTokenResponse> {
  const requestData = {
    grant_type: "authorization_code",
    client_id: process.env.AUTH_CLIENT_ID!,
    client_secret: process.env.AUTH_CLIENT_SECRET!,
    redirect_uri: process.env.AUTH_REDIRECT_URI!,
    code: code
  };

  console.log("CODE : ", code, " 🦄");

  return await fetch(`${process.env.GIS_AUTH_ENDPOINT}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestData)
  })
    .then(async (response) => {
      if (response.status != 200) {
        console.error(await response.json());
        throw new Error("Error getting access token");
      }
      return await response.json();
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });
}

export async function refreshAccessToken(): Promise<GetTokenResponse> {
  let refresh_token = cookies().get("refresh_token");
  if (
    !(
      refresh_token?.value &&
      refresh_token.value !== "" &&
      refresh_token.value !== null
    )
  ) {
    throw new Error("No refresh token found");
  }

  const requestData = {
    grant_type: "refresh_token",
    client_id: process.env.AUTH_CLIENT_ID!,
    client_secret: process.env.AUTH_CLIENT_SECRET!,
    refresh_token: refresh_token!.value
  };

  return await fetch(`${process.env.GIS_AUTH_ENDPOINT}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestData)
  })
    .then(async (response) => {
      if (response.status != 200) {
        console.error(await response.json());
        throw new Error("Error getting access token");
      }
      return await response.json();
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });
}

export function getAccessToken(): string {
  const accessToken = cookies().get("access_token");
  if (
    accessToken &&
    accessToken.value &&
    accessToken.value !== "" &&
    accessToken.value !== null
  ) {
    return accessToken.value;
  }
  throw new Error("No access token found");
}
