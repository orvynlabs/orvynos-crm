import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;

      // When called from Server Components/Actions (auth() calls), request is undefined
      if (!request) {
        return isLoggedIn;
      }

      const { nextUrl } = request;
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  providers: [], // Configured with Credentials in auth.ts
} satisfies NextAuthConfig;
