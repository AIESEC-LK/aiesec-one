import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import authService from "@/services/auth.service";

export async function GET(request: NextRequest) {
  try {
    const session = cookies().get("session")?.value;

    if (!session) {
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

    const userType = await authService.verifyAccessToken(session);

    if (!userType) {
      return NextResponse.json(
        { error: "Invalid session, try again" },
        { status: 401 }
      );
    }

    return NextResponse.json({ userType: userType });
  } catch (error) {
    console.error("Session verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}