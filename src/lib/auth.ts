import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import clientPromise from "@/lib/mongodb";
import { COLLECTIONS } from "@/lib/constants";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
    error: "/login"
  },
  secret: process.env.NEXTAUTH_SECRET as string,
  callbacks: {
    async signIn({ user, account }) {
      if (account && user) {
        const db = (await clientPromise).db();
        const userFromDB = await db
          .collection(COLLECTIONS.USERS)
          .findOne({ email: user.email });

        if (userFromDB) {
          return true;
        } else {
          throw new Error(
            "User not allowed to sign in, please contact the admin"
          );
        }
      } else {
        throw new Error("Something went wrong, please try again");
      }
    },
    async session({ session }) {
      if (session?.user) {
        const db = (await clientPromise).db();
        const userFromDB = await db
          .collection(COLLECTIONS.USERS)
          .findOne({ email: session?.user?.email });

        if (userFromDB) {
          session.user.name = userFromDB.name;
          session.user.role = userFromDB.role;
          session.user.entity = userFromDB.entity;
        }
        return session;
      } else {
        throw new Error("Session creation failed, please try again");
      }
    }
  }
};
