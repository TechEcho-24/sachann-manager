import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple JWT-based middleware that doesn't import Mongoose
// Auth.js stores the session token in a cookie
export function proxy(request: NextRequest) {
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/expenses/:path*",
    "/reports/:path*",
    "/budget/:path*",
    "/settings/:path*",
    "/sales/:path*",
    "/balances/:path*",
    "/total/:path*",
    "/assistant/:path*",
    "/tasks/:path*",
    "/team/:path*",
    "/users/:path*",
    "/notifications/:path*",
    "/change-password/:path*",
  ],
};
