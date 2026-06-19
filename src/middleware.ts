import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const onDashboard = pathname.startsWith("/dashboard");
  const onLogin     = pathname === "/login";

  if (onDashboard && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (onLogin && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
