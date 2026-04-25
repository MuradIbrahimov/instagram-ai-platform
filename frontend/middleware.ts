import { type NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/register"];
const AUTH_PATHS_PREFIX = ["/dashboard", "/conversations", "/knowledge", "/settings", "/workspaces"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isProtectedPath(pathname: string): boolean {
  // Root "/" and all dashboard children are protected
  if (pathname === "/") return false; // let the page handle root redirect
  return AUTH_PATHS_PREFIX.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Read token from cookie (auth store also writes here on login)
  const token = request.cookies.get("replyr-token")?.value;

  const isAuthenticated = Boolean(token);

  // Redirect authenticated users away from login/register
  if (isAuthenticated && isPublicPath(pathname)) {
    return NextResponse.redirect(new URL("/conversations", request.url));
  }

  // Redirect unauthenticated users away from protected routes
  if (!isAuthenticated && isProtectedPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files with extensions
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf)$).*)",
  ],
};
