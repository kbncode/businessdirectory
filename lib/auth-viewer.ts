import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { viewerAuthConfig } from "@/lib/auth-viewer.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...viewerAuthConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "Viewer",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    ...viewerAuthConfig.callbacks,
    // Re-checked on every request (JWT strategy re-runs this callback each
    // time a session is read, not just at sign-in). An admin-deleted user's
    // token would otherwise keep authenticating for the rest of its ~30-day
    // lifetime, since nothing else invalidates it — returning null here
    // signs them out immediately instead.
    async jwt(params) {
      const token = await viewerAuthConfig.callbacks!.jwt!(params);
      if (token && "userId" in token && token.userId) {
        const stillExists = await prisma.user.findUnique({
          where: { id: token.userId as string },
          select: { id: true },
        });
        if (!stillExists) return null;
      }
      return token;
    },
  },
});
