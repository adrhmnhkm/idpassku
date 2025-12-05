import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect("https://vault.idpassku.com/dashboard");
  }
  return NextResponse.next();
}


export const config = {
    matcher: ["/dashboard/:path*"],
  };