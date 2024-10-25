import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAccessTokenFromOauth } from "./auth-utils";
import { GetTokenResponse } from "./auth-types";

export async function GET(request: NextRequest) {
  const code: string = request.nextUrl.searchParams.get("code") as string;
  const authResponse: GetTokenResponse = await getAccessTokenFromOauth(code);

  const redirect_uri = cookies().get("redirect_uri")?.value
    ? cookies().get("redirect_uri")?.value!
    : `${process.env.NEXTAUTH_URL}/`;
  console.log("Redirect URI:", redirect_uri);

  const response = NextResponse.redirect(redirect_uri, { status: 302 });

  response.cookies.set("access_token", authResponse.access_token, {
    httpOnly: true,
    secure: true,
    maxAge: authResponse.expires_in
  });
  response.cookies.set("refresh_token", authResponse.refresh_token, {
    httpOnly: true,
    secure: true
  });

  return response;
}
