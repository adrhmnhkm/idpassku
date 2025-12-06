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
  
  // Normalize hostname (remove port if present)
  const normalizedHost = hostname.split(":")[0];
  
  // Check if we're on main domain (idpassku.com)
  const isMainDomain = normalizedHost === MAIN_DOMAIN;
  
  // Check if we're on vault domain (vault.idpassku.com)
  const isVaultDomain = normalizedHost === VAULT_DOMAIN;

  // Detect RSC (React Server Components) requests
  // RSC requests have _rsc parameter or specific headers
  const isRSCRequest = searchParams.has("_rsc") || 
    req.headers.get("rsc") === "1" ||
    req.headers.get("next-router-prefetch") === "1" ||
    req.headers.get("accept")?.includes("text/x-component");

  // For RSC requests to protected routes on main domain, allow through
  // Client-side will handle the redirect/logout
  if (isRSCRequest && isMainDomain && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // CRITICAL: If accessing protected routes on main domain, redirect to vault domain
  // This ensures dashboard is never accessible on main domain
  // Skip redirect for RSC requests (handled by client-side)
  if (!isRSCRequest && isMainDomain && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    const url = new URL(`https://${VAULT_DOMAIN}${pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(url, 307); // 307 Temporary Redirect (preserves method)
  }

  // If accessing public routes on vault domain, redirect to main domain
  // Note: We can't check auth state in middleware, so we'll let the page handle this
  // But we should redirect public routes like landing page to main domain
  if (isVaultDomain && pathname === "/") {
    const url = new URL(`https://${MAIN_DOMAIN}/`);
    return NextResponse.redirect(url, 307);
  }

  // If accessing login/register on vault domain, redirect to main domain
  if (isVaultDomain && (pathname === "/login" || pathname === "/register")) {
    const url = new URL(`https://${MAIN_DOMAIN}${pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(url, 307);
  }

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