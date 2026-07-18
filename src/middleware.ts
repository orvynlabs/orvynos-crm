import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Protect all routes except assets, favicon, public receipts, and APIs
  matcher: ["/((?!api|receipts|_next/static|_next/image|favicon.ico).*)"],
};
