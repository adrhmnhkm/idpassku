import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MAIN_DOMAIN = "idpassku.com";
const VAULT_DOMAIN = "vault.idpassku.com";

// Public routes that should be accessible on main domain
const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

// Protected routes that should only be accessible on vault domain
const PROTECTED_ROUTES = ["/dashboard"];

export function middleware(req: NextRequest) {
  const hostname = req.headers.get("host") || "";
  const pathname = req.nextUrl.pathname;
  const searchParams = req.nextUrl.searchParams;
  const method = req.method;
  const userAgent = req.headers.get("user-agent") || "";
  const isRSC = searchParams.has("_rsc") || req.headers.get("accept")?.includes("text/x-component");
  
  console.log(`[MIDDLEWARE] ${method} ${pathname}`, {
    hostname,
    isRSC,
    userAgent: userAgent.substring(0, 50),
  });
  
  // CRITICAL: Never process static assets, chunks, or Next.js internal routes
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|webp|css|js|woff|woff2|ttf|eot)$/i)
  ) {
    console.log(`[MIDDLEWARE] Skipping static asset: ${pathname}`);
    return NextResponse.next();
  }
  
  // Normalize hostname (remove port if present)
  const normalizedHost = hostname.split(":")[0];
  
  // Check if we're on main domain (idpassku.com)
  const isMainDomain = normalizedHost === MAIN_DOMAIN;
  
  // Check if we're on vault domain (vault.idpassku.com)
  const isVaultDomain = normalizedHost === VAULT_DOMAIN;

  console.log(`[MIDDLEWARE] Domain check:`, {
    normalizedHost,
    isMainDomain,
    isVaultDomain,
    pathname,
  });

  // CRITICAL: If accessing protected routes on main domain, redirect to LANDING (not /login)
  // Tujuan: hentikan loop domain; user masuk dari landing lalu login normal
  if (isMainDomain && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    const url = new URL(`https://${MAIN_DOMAIN}/`);
    console.warn(`[MIDDLEWARE] 🔴 REDIRECT to landing (main domain protected route)`, {
      from: `${normalizedHost}${pathname}`,
      to: url.toString(),
      isRSC,
      method,
    });
    return NextResponse.redirect(url, 307); // 307 Temporary Redirect (preserves method)
  }

  // CRITICAL: All public routes (login, register, etc) must be on MAIN domain
  // Redirect from vault domain to main domain
  if (isVaultDomain && PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + "/"))) {
    const url = new URL(`https://${MAIN_DOMAIN}${pathname}${req.nextUrl.search}`);
    console.log(`[MIDDLEWARE] 🔵 REDIRECT: Public route on vault domain -> main domain`, {
      from: `${normalizedHost}${pathname}`,
      to: url.toString(),
      route: pathname,
    });
    return NextResponse.redirect(url, 307);
  }

  console.log(`[MIDDLEWARE] ✅ Allowing request through: ${normalizedHost}${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - RSC requests (handled by client-side)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};