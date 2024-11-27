import { SignJWT, jwtVerify, errors } from "jose";
import { USER_TYPE } from "@/constants/common.constants";
import { environment } from "../config/env.config";

const generateAccessToken = async (
  userId: string,
  userType: string,
  officeId: string
): Promise<string> => {
  const secret = new TextEncoder().encode(environment.accessTokenSecret);
  const token = await new SignJWT({ userId, userType, officeId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(environment.accessTokenExpiration)
    .sign(secret);

  return token;
};

const verifyAccessToken = async (token: string) => {
  try {
    const secret = new TextEncoder().encode(environment.accessTokenSecret);
    const {
      payload: { userType, officeId }
    } = await jwtVerify(token, secret);
    return { userType, officeId };
  } catch (error) {
    if (error instanceof errors.JWTExpired) {
      return { decodedToken: null, error: "expired" };
    }
    return { decodedToken: null, error: "invalid" };
  }
};

export default {
  generateAccessToken,
  verifyAccessToken
};
