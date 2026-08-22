import { describe, it, expect } from "vitest";
import {
  blurCoordinates,
  calculateHaversineDistance,
} from "../src/lib/security/blurCoordinates";

describe("blurCoordinates Security Utility", () => {
  // Reference coordinates (Forbidden City, Beijing)
  const exactLat = 39.916345;
  const exactLng = 116.397155;

  it("should NOT blur coordinates if artifact is officially protected", () => {
    const result = blurCoordinates(exactLat, exactLng, { isProtected: true });

    expect(result.latitude).toBe(exactLat);
    expect(result.longitude).toBe(exactLng);
  });

  it("should blur coordinates within specified radius bounds (500m to 1000m) for wild heritage sites", () => {
    const result = blurCoordinates(exactLat, exactLng, {
      isProtected: false,
      minRadiusMeters: 500,
      maxRadiusMeters: 1000,
    });

    // Verify coordinates actually shifted
    expect(result.latitude).not.toBe(exactLat);
    expect(result.longitude).not.toBe(exactLng);

    // Compute distance difference using Haversine formula
    const distanceMeters = calculateHaversineDistance(
      { latitude: exactLat, longitude: exactLng },
      result
    );

    // Assert blurred location falls strictly within 500m - 1000m buffer
    expect(distanceMeters).toBeGreaterThanOrEqual(490); // Account for minor rounding floating point tolerances
    expect(distanceMeters).toBeLessThanOrEqual(1010);
  });

  it("should produce non-deterministic randomized offsets across multiple calls", () => {
    const run1 = blurCoordinates(exactLat, exactLng, { isProtected: false });
    const run2 = blurCoordinates(exactLat, exactLng, { isProtected: false });

    expect(run1.latitude).not.toBe(run2.latitude);
    expect(run1.longitude).not.toBe(run2.longitude);
  });
});