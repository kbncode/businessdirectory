import type { NextAuthConfig } from "next-auth";

// Edge-safe base config for the admin auth instance. See
// lib/auth-viewer.config.ts for why Prisma/providers live elsewhere.
export const adminAuthConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  basePath: "/api/auth/admin",
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/admin/login",
  },
  cookies: {
    sessionToken: {
      name: "kbn-admin-session",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.email = user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  providers: [],
};
