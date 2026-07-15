import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith("/login");
      const isOnPublicApi = nextUrl.pathname.startsWith("/api/auth");
      const isPublicAsset = nextUrl.pathname.includes(".") || nextUrl.pathname.startsWith("/_next");

      // Always allow auth APIs and next assets/favicon
      if (isOnPublicApi || isPublicAsset) {
        return true;
      }

      if (isOnLogin) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) {
        // Redirect unauthenticated users to login page
        return false;
      }

      return true;
    },
    // We add user role to session token
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  providers: [], // Configured with Credentials in auth.ts
} satisfies NextAuthConfig;
