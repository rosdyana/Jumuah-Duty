import { describe, expect, it } from "vitest";
import { selectNextCandidate } from "./rotation";
import type { RotationInput } from "./types";

function membersFrom(ids: string[]) {
  return ids.map((userId, i) => ({ userId, rotationOrder: i + 1 }));
}

function baseInput(overrides: Partial<RotationInput> = {}): RotationInput {
  return {
    members: membersFrom(["A", "B", "C", "D"]),
    unavailableUserIds: new Set(),
    lastAssignedUserId: null,
    ...overrides,
  };
}

describe("selectNextCandidate", () => {
  it("starts at the first member when there is no prior pointer", () => {
    const result = selectNextCandidate(baseInput());
    expect(result).toEqual({
      selectedUserId: "A",
      newPointerUserId: "A",
      usedFallbackSameAsExcluded: false,
    });
  });

  it("continues from the position after the last-assigned member", () => {
    const result = selectNextCandidate(baseInput({ lastAssignedUserId: "B" }));
    expect(result.selectedUserId).toBe("C");
    expect(result.newPointerUserId).toBe("C");
  });

  it("wraps around from the last member back to the first", () => {
    const result = selectNextCandidate(baseInput({ lastAssignedUserId: "D" }));
    expect(result.selectedUserId).toBe("A");
  });

  it("skips a member with an active unavailability entry", () => {
    const result = selectNextCandidate(
      baseInput({ lastAssignedUserId: "B", unavailableUserIds: new Set(["C"]) })
    );
    expect(result.selectedUserId).toBe("D");
  });

  it("returns null and leaves the pointer unchanged when everyone is unavailable", () => {
    const result = selectNextCandidate(
      baseInput({
        lastAssignedUserId: "B",
        unavailableUserIds: new Set(["A", "B", "C", "D"]),
      })
    );
    expect(result).toEqual({
      selectedUserId: null,
      newPointerUserId: "B",
      usedFallbackSameAsExcluded: false,
    });
  });

  it("repeatedly reselects the only eligible member and still advances the pointer to them", () => {
    const input = baseInput({
      members: membersFrom(["A"]),
      lastAssignedUserId: "A",
    });
    const result = selectNextCandidate(input);
    expect(result.selectedUserId).toBe("A");
    expect(result.newPointerUserId).toBe("A");
  });

  it("restarts at index 0 when the pointer's user is no longer in the rotation", () => {
    const result = selectNextCandidate(
      baseInput({ members: membersFrom(["B", "C", "D"]), lastAssignedUserId: "A" })
    );
    expect(result.selectedUserId).toBe("B");
  });

  it("returns null without crashing on an empty rotation list", () => {
    const result = selectNextCandidate(baseInput({ members: [], lastAssignedUserId: "A" }));
    expect(result).toEqual({
      selectedUserId: null,
      newPointerUserId: "A",
      usedFallbackSameAsExcluded: false,
    });
  });

  describe("avoid-double-duty exclusion (soft preference)", () => {
    it("prefers a non-excluded candidate even when it is not immediately next in line", () => {
      // Next in line after B is C, but C is unavailable, so the walk continues to D
      // while skipping A (excluded) — it must not fall back to A just because A comes
      // first in the ring.
      const result = selectNextCandidate(
        baseInput({
          lastAssignedUserId: "B",
          unavailableUserIds: new Set(["C"]),
          excludeUserId: "A",
        })
      );
      expect(result.selectedUserId).toBe("D");
      expect(result.usedFallbackSameAsExcluded).toBe(false);
    });

    it("falls back to the excluded candidate when no one else is eligible/available", () => {
      const result = selectNextCandidate(
        baseInput({
          lastAssignedUserId: "D",
          unavailableUserIds: new Set(["B", "C", "D"]),
          excludeUserId: "A",
        })
      );
      expect(result.selectedUserId).toBe("A");
      expect(result.usedFallbackSameAsExcluded).toBe(true);
    });
  });
});
