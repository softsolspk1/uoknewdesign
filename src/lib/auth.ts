import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { hashPassword, isBcryptHash, verifyPassword } from "@/lib/password";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  // No hardcoded fallback: NEXTAUTH_SECRET is set in Vercel (Production +
  // Preview) already. A fallback here would mean anyone reading this
  // public repo could forge a valid admin session if that env var were
  // ever unset — better to fail loudly than to silently accept a known
  // secret.
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password;
        const LOCK_THRESHOLD = 5;
        const LOCK_DURATION_MS = 15 * 60 * 1000;

        try {
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) return null;

          // Locked out from too many recent failed attempts
          if (user.lockedUntil && user.lockedUntil > new Date()) {
            return null;
          }

          if (await verifyPassword(password, user.password)) {
            const data: { failedLoginAttempts?: number; lockedUntil?: null; password?: string } = {};
            if (user.failedLoginAttempts > 0 || user.lockedUntil) {
              data.failedLoginAttempts = 0;
              data.lockedUntil = null;
            }
            // Legacy plaintext row that just matched — upgrade it to a
            // bcrypt hash now so it's never stored in the clear again.
            if (!isBcryptHash(user.password)) {
              data.password = await hashPassword(password);
            }
            if (Object.keys(data).length > 0) {
              await prisma.user.update({ where: { id: user.id }, data });
            }
            return {
              id: user.id,
              email: user.email,
              name: user.name || "User",
              role: user.role,
              assignedDepartments: user.assignedDepartments || "",
            };
          }

          const attempts = user.failedLoginAttempts + 1;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: attempts,
              lockedUntil: attempts >= LOCK_THRESHOLD ? new Date(Date.now() + LOCK_DURATION_MS) : null,
            },
          });
        } catch (err) {
          console.error("Auth database query error:", err);
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "student";
        token.assignedDepartments = (user as any).assignedDepartments || "";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).assignedDepartments = token.assignedDepartments;
      }
      return session;
    },
  },
};

export default authOptions;
