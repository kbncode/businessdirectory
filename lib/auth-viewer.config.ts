import type { NextAuthConfig } from "next-auth";

// Edge-safe base config (no Prisma, no providers) shared by the full
// Node config (lib/auth-viewer.ts) and the middleware's lightweight
// session check. Keeping Prisma out of this file is what lets it run
// in the Edge middleware runtime.
export const viewerAuthConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  basePath: "/api/auth/viewer",
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  cookies: {
    sessionToken: {
      name: "kbn-viewer-session",
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
