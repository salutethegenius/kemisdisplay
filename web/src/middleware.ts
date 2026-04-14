import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** Serve nested URLs from flat routes (saves app/ tree depth). */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/display/") && pathname.length > "/display/".length) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.rewrite(url);
  }

  if (pathname.startsWith("/dashboard/") && pathname.length > "/dashboard/".length) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/display/:path*", "/dashboard/:path*"],
};
