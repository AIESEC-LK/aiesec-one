export type UserType = "ADMIN_MC" | "ADMIN_LC" | "MEMBER";

export type VerifyTokenResponse =
  | {
      decodedToken: null;
      error: "expired" | "invalid";
    }
  | UserType;
