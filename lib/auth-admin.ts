import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { adminAuthConfig } from "@/lib/auth-admin.config";

// No Prisma adapter here — admins are not part of the viewer/owner
// account system, and this instance only ever authenticates against
// the Admin table via Credentials.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...adminAuthConfig,
  providers: [
    Credentials({
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const admin = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } });
        if (!admin) return null;

        const valid = await verifyPassword(password, admin.passwordHash);
        if (!valid) return null;

        return { id: admin.id, email: admin.email, name: admin.name };
      },
    }),
  ],
});
