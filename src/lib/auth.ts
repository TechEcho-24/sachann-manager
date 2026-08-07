import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";
import type { UserRole } from "@/lib/roles";

declare module "next-auth" {
  interface User {
    role?: UserRole;
    mustChangePassword?: boolean;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      mustChangePassword: boolean;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    mustChangePassword?: boolean;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("=== [AUTH] Authorize called ===");
        console.log("Credentials received email:", credentials?.email);
        console.log("Credentials password length:", (credentials?.password as string)?.length);

        if (!credentials?.email || !credentials?.password) {
          console.log("[AUTH] Missing email or password");
          throw new CredentialsSignin("Please provide email and password");
        }

        await connectDB();

        const email = (credentials.email as string).trim().toLowerCase();
        const user = await User.findOne({ email });

        console.log("[AUTH] User found in DB?", !!user);
        if (user) {
          console.log("[AUTH] User email:", user.email, "role:", user.role, "isActive:", user.isActive, "hasPassword:", !!user.password);
        }

        if (!user) {
          console.log("[AUTH] No user found with email:", email);
          throw new CredentialsSignin("Invalid email or password");
        }

        // Check if user is deactivated
        if (user.isActive === false) {
          console.log("[AUTH] User is explicitly deactivated");
          throw new CredentialsSignin("Your account has been deactivated. Contact your administrator.");
        }

        const isPasswordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        console.log("[AUTH] Password match result:", isPasswordMatch);

        if (!isPasswordMatch) {
          console.log("[AUTH] Password did not match");
          throw new CredentialsSignin("Invalid email or password");
        }

        // Update lastLogin
        try {
          user.lastLogin = new Date();
          await user.save();
        } catch (e) {
          console.error("[AUTH] Failed to update lastLogin:", e);
        }

        console.log("[AUTH] Login successful for:", user.email);

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: (user.role || "admin") as UserRole,
          mustChangePassword: user.mustChangePassword || false,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.mustChangePassword = user.mustChangePassword;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role || "admin") as UserRole;
        session.user.mustChangePassword = !!(token.mustChangePassword);
      }
      return session;
    },
  },
});
