import { describe, it, expect } from "vitest";
import {
  decodeJWT,
  getTokenExpirationTime,
  isTokenExpired,
  getTimeUntilExpiration,
} from "./utils";

// Mock JWT token for testing (expires in 15 minutes from epoch)
const mockToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzk5MjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

describe("JWT Utilities", () => {
  describe("decodeJWT", () => {
    it("should decode a valid JWT token", () => {
      const decoded = decodeJWT(mockToken);
      expect(decoded).toBeTruthy();
      expect(decoded.sub).toBe("1234567890");
      expect(decoded.name).toBe("John Doe");
      expect(decoded.exp).toBe(1516239922); // 15 minutes from epoch
    });

    it("should return null for invalid token", () => {
      const decoded = decodeJWT("invalid.token.here");
      expect(decoded).toBeNull();
    });
  });

  describe("getTokenExpirationTime", () => {
    it("should return expiration time in milliseconds", () => {
      const expirationTime = getTokenExpirationTime(mockToken);
      expect(expirationTime).toBe(1516239922000); // 1516239922 * 1000
    });

    it("should return null for invalid token", () => {
      const expirationTime = getTokenExpirationTime("invalid.token");
      expect(expirationTime).toBeNull();
    });
  });

  describe("isTokenExpired", () => {
    it("should return true for expired token", () => {
      // The mock token expired in 1970, so it should be expired
      const expired = isTokenExpired(mockToken);
      expect(expired).toBe(true);
    });

    it("should return true for invalid token", () => {
      const expired = isTokenExpired("invalid.token");
      expect(expired).toBe(true);
    });
  });

  describe("getTimeUntilExpiration", () => {
    it("should return 0 for expired token", () => {
      const timeUntil = getTimeUntilExpiration(mockToken);
      expect(timeUntil).toBe(0);
    });

    it("should return 0 for invalid token", () => {
      const timeUntil = getTimeUntilExpiration("invalid.token");
      expect(timeUntil).toBe(0);
    });
  });
});
