import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "resumai_sid";

export function proxy(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const url = new URL("/", req.url);
    url.searchParams.set("auth", "1");
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/builder/:path*", "/print/:path*"],
};
