import { describe, expect, it } from "vitest";
import { generateScheduleForDate } from "./generate-schedule";
import type { GenerationDeps, RotationInput } from "./types";

function members(ids: string[]) {
  return ids.map((userId, i) => ({ userId, rotationOrder: i + 1 }));
}

function makeDeps(overrides: Partial<GenerationDeps> = {}): GenerationDeps {
  const khatibInput: RotationInput = {
    members: members(["Ahmad", "Budi", "Dedi", "Fajar"]),
    unavailableUserIds: new Set(),
    lastAssignedUserId: null,
  };
  return {
    fixedRoomBookerId: "Ahmad",
    roomBookerEligible: true,
    roomBookerAvailable: true,
    khatibInput,
    buildImamInput: (khatibPick) => ({
      members: members(["Ahmad", "Candra", "Dedi", "Eko"]),
      unavailableUserIds: new Set(),
      lastAssignedUserId: null,
      excludeUserId: khatibPick,
    }),
    ...overrides,
  };
}

describe("generateScheduleForDate", () => {
  it("assigns room booking, khatib, and imam together, imam avoiding the khatib pick", () => {
    const outcome = generateScheduleForDate(makeDeps());

    expect(outcome.roomBooking).toEqual({
      assignedUserId: "Ahmad",
      originalUserId: "Ahmad",
      assignmentType: "FIXED",
      status: "ASSIGNED",
    });
    expect(outcome.khatib.assignedUserId).toBe("Ahmad");
    // Imam's rotation also starts with Ahmad, but must avoid the Khatib pick (Ahmad).
    expect(outcome.imam.assignedUserId).toBe("Candra");
    expect(outcome.imam.usedFallbackSameAsExcluded).toBe(false);
  });

  it("falls back to the same person for imam when no other candidate is eligible/available", () => {
    const outcome = generateScheduleForDate(
      makeDeps({
        buildImamInput: (khatibPick) => ({
          members: members(["Ahmad"]),
          unavailableUserIds: new Set(),
          lastAssignedUserId: null,
          excludeUserId: khatibPick,
        }),
      })
    );

    expect(outcome.khatib.assignedUserId).toBe("Ahmad");
    expect(outcome.imam.assignedUserId).toBe("Ahmad");
    expect(outcome.imam.usedFallbackSameAsExcluded).toBe(true);
    expect(outcome.imam.status).toBe("ASSIGNED");
  });

  describe("room booking (fixed assignment)", () => {
    it("assigns the fixed booker when active, capable, and available", () => {
      const outcome = generateScheduleForDate(makeDeps());
      expect(outcome.roomBooking.status).toBe("ASSIGNED");
      expect(outcome.roomBooking.assignedUserId).toBe("Ahmad");
    });

    it("marks replacement-needed when the fixed booker is ineligible, keeping them as originalUserId", () => {
      const outcome = generateScheduleForDate(
        makeDeps({ roomBookerEligible: false })
      );
      expect(outcome.roomBooking).toEqual({
        assignedUserId: null,
        originalUserId: "Ahmad",
        assignmentType: "FIXED",
        status: "REPLACEMENT_NEEDED",
      });
    });

    it("marks replacement-needed when the fixed booker is unavailable that week", () => {
      const outcome = generateScheduleForDate(
        makeDeps({ roomBookerAvailable: false })
      );
      expect(outcome.roomBooking.status).toBe("REPLACEMENT_NEEDED");
      expect(outcome.roomBooking.assignedUserId).toBeNull();
    });

    it("marks replacement-needed with no original user when no fixed booker is configured", () => {
      const outcome = generateScheduleForDate(
        makeDeps({ fixedRoomBookerId: null })
      );
      expect(outcome.roomBooking).toEqual({
        assignedUserId: null,
        originalUserId: null,
        assignmentType: "FIXED",
        status: "REPLACEMENT_NEEDED",
      });
    });
  });

  it("advances khatib and imam pointers independently across two consecutive Fridays", () => {
    let khatibPointer: string | null = null;
    let imamPointer: string | null = null;

    function generateOneFriday() {
      const outcome = generateScheduleForDate(
        makeDeps({
          khatibInput: {
            members: members(["Ahmad", "Budi", "Dedi", "Fajar"]),
            unavailableUserIds: new Set(),
            lastAssignedUserId: khatibPointer,
          },
          buildImamInput: (khatibPick) => ({
            members: members(["Ahmad", "Candra", "Dedi", "Eko"]),
            unavailableUserIds: new Set(),
            lastAssignedUserId: imamPointer,
            excludeUserId: khatibPick,
          }),
        })
      );
      khatibPointer = outcome.khatib.newPointerUserId;
      imamPointer = outcome.imam.newPointerUserId;
      return outcome;
    }

    const week1 = generateOneFriday();
    expect(week1.khatib.assignedUserId).toBe("Ahmad");
    expect(week1.imam.assignedUserId).toBe("Candra"); // avoids Ahmad (khatib)

    const week2 = generateOneFriday();
    expect(week2.khatib.assignedUserId).toBe("Budi"); // khatib pointer advanced past Ahmad
    expect(week2.imam.assignedUserId).toBe("Dedi"); // imam pointer advanced past Candra, independently
  });
});
