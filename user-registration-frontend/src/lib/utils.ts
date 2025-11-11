import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// JWT utility functions for token management
export function decodeJWT(token: string): any {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
}

export function getTokenExpirationTime(token: string): number | null {
  const decoded = decodeJWT(token);
  return decoded?.exp ? decoded.exp * 1000 : null; // Convert to milliseconds
}

export function isTokenExpired(token: string): boolean {
  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) return true;
  return Date.now() >= expirationTime;
}

export function getTimeUntilExpiration(token: string): number {
  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) return 0;
  return Math.max(0, expirationTime - Date.now());
}
