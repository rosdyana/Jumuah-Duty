import { selectNextCandidate } from "./rotation";
import type { GenerationDeps, GenerationOutcome } from "./types";

/**
 * Pure composition of the 3-step schedule generation algorithm (PRD section 6).
 * No I/O — the caller (src/lib/scheduling/persist.ts) is responsible for loading
 * `GenerationDeps` from the database and persisting the returned outcome.
 */
export function generateScheduleForDate(deps: GenerationDeps): GenerationOutcome {
  // Step 1: Room Booking (fixed assignment).
  const roomBooking = (() => {
    if (!deps.fixedRoomBookerId) {
      return {
        assignedUserId: null,
        originalUserId: null,
        assignmentType: "FIXED" as const,
        status: "REPLACEMENT_NEEDED" as const,
      };
    }
    const available = deps.roomBookerEligible && deps.roomBookerAvailable;
    return {
      assignedUserId: available ? deps.fixedRoomBookerId : null,
      originalUserId: deps.fixedRoomBookerId,
      assignmentType: "FIXED" as const,
      status: (available ? "ASSIGNED" : "REPLACEMENT_NEEDED") as
        | "ASSIGNED"
        | "REPLACEMENT_NEEDED",
    };
  })();

  // Step 2: Khatib (own rotation pointer, no exclusion).
  const khatibResult = selectNextCandidate(deps.khatibInput);
  const khatib = {
    assignedUserId: khatibResult.selectedUserId,
    originalUserId: khatibResult.selectedUserId,
    assignmentType: "ROTATION" as const,
    status: (khatibResult.selectedUserId ? "ASSIGNED" : "REPLACEMENT_NEEDED") as
      | "ASSIGNED"
      | "REPLACEMENT_NEEDED",
    newPointerUserId: khatibResult.newPointerUserId,
    usedFallbackSameAsExcluded: khatibResult.usedFallbackSameAsExcluded,
  };

  // Step 3: Imam (own rotation pointer, soft-excludes the Khatib pick).
  const imamInput = deps.buildImamInput(khatibResult.selectedUserId);
  const imamResult = selectNextCandidate(imamInput);
  const imam = {
    assignedUserId: imamResult.selectedUserId,
    originalUserId: imamResult.selectedUserId,
    assignmentType: "ROTATION" as const,
    status: (imamResult.selectedUserId ? "ASSIGNED" : "REPLACEMENT_NEEDED") as
      | "ASSIGNED"
      | "REPLACEMENT_NEEDED",
    newPointerUserId: imamResult.newPointerUserId,
    usedFallbackSameAsExcluded: imamResult.usedFallbackSameAsExcluded,
  };

  return { roomBooking, khatib, imam };
}
