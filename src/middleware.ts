import { NextRequest, NextResponse } from "next/server";

// Paths that must remain accessible without a session (login page + its API,
// plus Next.js internals and static assets).
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/change-pin",
  "/api/employees", // needed by the login page to render the staff picker grid before auth
  "/favicon.ico",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return true;
  }
  // Next.js internal assets & static files (css, js, images, fonts, etc.)
  if (pathname.startsWith("/_next/")) return true;
  if (/\.(png|jpg|jpeg|svg|ico|css|js|woff2?|ttf|map)$/.test(pathname)) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("wms_session");

  if (!sessionCookie) {
    // API routes get a JSON 401 instead of an HTML redirect
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized. Silakan login." }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Apply to everything except explicitly public assets handled above.
// The matcher is intentionally broad; isPublicPath() does the fine-grained filtering.
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
