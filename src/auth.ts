import NextAuth from "next-auth";
import Apple from "next-auth/providers/apple";
import Google from "next-auth/providers/google";

import { getRoleForEmail } from "@/lib/auth/admin";
import { signInUrl } from "@/lib/auth/routes";

export const { auth, handlers, signIn, signOut } = NextAuth({
  callbacks: {
    jwt({ token }) {
      token.role = getRoleForEmail(token.email);

      return token;
    },
    session({ session, token }) {
      session.user.role = getRoleForEmail(token.email);

      return session;
    },
  },
  pages: {
    signIn: signInUrl,
  },
  providers: [Google, Apple],
  session: {
    strategy: "jwt",
  },
});
