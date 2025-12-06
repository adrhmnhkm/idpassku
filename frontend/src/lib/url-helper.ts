/**
 * Helper functions for getting correct URLs based on environment
 * Supports both development (localhost) and production (idpassku.com)
 */

export function getMainDomainUrl(path: string = ""): string {
  if (typeof window === "undefined") {
    // SSR - return production URL
    return `https://idpassku.com${path}`;
  }

  const hostname = window.location.hostname;
  
  // Development (localhost)
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.includes("localhost")
  ) {
    const port = window.location.port || "3000";
    return `http://${hostname.replace("vault.", "")}:${port}${path}`;
  }

  // Production
  return `https://idpassku.com${path}`;
}

export function getVaultDomainUrl(path: string = ""): string {
  if (typeof window === "undefined") {
    // SSR - return production URL
    return `https://vault.idpassku.com${path}`;
  }

  const hostname = window.location.hostname;
  
  // Development (localhost)
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.includes("localhost")
  ) {
    const port = window.location.port || "3000";
    // If already on vault subdomain, use it; otherwise create vault subdomain
    if (hostname.includes("vault")) {
      return `http://${hostname}:${port}${path}`;
    }
    return `http://vault.localhost:${port}${path}`;
  }

  // Production
  return `https://vault.idpassku.com${path}`;
}

export function isMainDomain(): boolean {
  if (typeof window === "undefined") return false;
  
  const hostname = window.location.hostname;
  return (
    hostname === "idpassku.com" ||
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    (hostname.includes("localhost") && !hostname.includes("vault")) ||
    (hostname !== "vault.idpassku.com" && !hostname.includes("vault."))
  );
}

export function isVaultDomain(): boolean {
  if (typeof window === "undefined") return false;
  
  const hostname = window.location.hostname;
  return (
    hostname === "vault.idpassku.com" ||
    hostname.includes("vault.") ||
    (hostname.includes("localhost") && hostname.includes("vault"))
  );
}

