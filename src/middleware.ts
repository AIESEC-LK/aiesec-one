import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getAccessToken,
  isAccessTokenPresent,
  isLoggedIn,
  refreshAccessToken
} from "./app/api/auth/auth-utils";
import { GetTokenResponse } from "./app/api/auth/auth-types";
import {
  getCurrentPersonDetails,
  isPersonIdPresent
} from "./util/person-utils";
import authService from "./services/auth.service";

export async function middleware(request: NextRequest) {
  const lastUrl = `${process.env.BASE_URL}${request.nextUrl.pathname}`;
  //unnecessary code
  //   if (lastUrl == `${process.env.BASE_URL}/`) {
  //     const url = new URL(`${process.env.BASE_URL}`);
  //     return NextResponse.redirect(url.toString());
  //   }

  if (!isLoggedIn()) {
    const url = new URL(`${process.env.GIS_AUTH_ENDPOINT}/oauth/authorize`);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", process.env.AUTH_CLIENT_ID!);
    url.searchParams.set("redirect_uri", process.env.AUTH_REDIRECT_URI!);
    url.searchParams.set("state", "");
    const response = NextResponse.redirect(url.toString());

    response.cookies.set("redirect_uri", lastUrl, {
      httpOnly: true,
      secure: true
    });

    return response;
  }

  const response = NextResponse.next();
  if (!isAccessTokenPresent()) {
    console.log("No access token found: 🚀" + request.url);
    let refreshTokenResponse: GetTokenResponse;

    try {
      refreshTokenResponse = await refreshAccessToken();
    } catch (e) {
      const url = new URL(`${process.env.GIS_AUTH_ENDPOINT}/oauth/authorize`);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("client_id", process.env.AUTH_CLIENT_ID!);
      url.searchParams.set("redirect_uri", process.env.AUTH_REDIRECT_URI!);
      url.searchParams.set("state", "");
      const response = NextResponse.redirect(url.toString());

      response.cookies.set("redirect_uri", lastUrl, {
        httpOnly: true,
        secure: true,
        sameSite: "strict"
      });

      return response;
    }
    response.cookies.set("access_token", refreshTokenResponse.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: refreshTokenResponse.expires_in
    });

    response.cookies.set("refresh_token", refreshTokenResponse.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict"
    });
  }

  const session = request.cookies.get("session")?.value;
  if (!session) {
    if (!isPersonIdPresent()) {
      // const personId = await getPersonId(getAccessToken());
      const { role, personId, officeId } = await getCurrentPersonDetails();
      const sessionToken = await authService.generateAccessToken(
        personId.toString(),
        role,
        officeId
      );

      response.cookies.set("session", sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict"
      });
    }
  } else {
    const result = await authService.verifyAccessToken(session);

    if (!result) {
      response.cookies.delete("session");
      const { role, personId, officeId } = await getCurrentPersonDetails();
      const sessionToken = await authService.generateAccessToken(
        personId.toString(),
        role,
        officeId
      );

      response.cookies.set("session", sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict"
      });
    }

    response.headers.set("x-user-type", result.userType as string);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - auth (authentication routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|auth|_next/static|_next/image|favicon.ico|opp/).*)"
  ]
};
