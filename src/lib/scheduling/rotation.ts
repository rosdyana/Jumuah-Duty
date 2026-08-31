import type { RotationInput, RotationResult } from "./types";

/**
 * Skip-unavailable rotation walk (PRD sections 4, 6, 7).
 *
 * Starts the walk immediately after `lastAssignedUserId` in rotation order (wrapping
 * around), picking the first candidate not in `unavailableUserIds`. When `excludeUserId`
 * is set (avoid-double-duty soft preference), a candidate matching it is skipped in favor
 * of any other available candidate, but is still used as a last-resort fallback so
 * assignment never fails just to preserve fairness.
 *
 * The pointer always advances to whoever was actually selected — including the fallback
 * case — and is left unchanged only when nobody is selectable at all. This is what makes
 * replacement (src/server/actions/replacement.ts) a pure downstream patch: it never needs
 * to touch rotation_state.
 */
export function selectNextCandidate(input: RotationInput): RotationResult {
  const ordered = [...input.members].sort((a, b) => a.rotationOrder - b.rotationOrder);

  if (ordered.length === 0) {
    return {
      selectedUserId: null,
      newPointerUserId: input.lastAssignedUserId,
      usedFallbackSameAsExcluded: false,
    };
  }

  const lastIndex = input.lastAssignedUserId
    ? ordered.findIndex((m) => m.userId === input.lastAssignedUserId)
    : -1;
  const startIndex = lastIndex === -1 ? 0 : (lastIndex + 1) % ordered.length;

  let firstAvailable: string | null = null;
  let firstAvailableNotExcluded: string | null = null;

  for (let step = 0; step < ordered.length; step++) {
    const candidate = ordered[(startIndex + step) % ordered.length];
    if (input.unavailableUserIds.has(candidate.userId)) continue;

    if (firstAvailable === null) firstAvailable = candidate.userId;
    if (
      firstAvailableNotExcluded === null &&
      candidate.userId !== input.excludeUserId
    ) {
      firstAvailableNotExcluded = candidate.userId;
      break;
    }
  }

  const chosen = firstAvailableNotExcluded ?? firstAvailable;

  if (chosen === null) {
    return {
      selectedUserId: null,
      newPointerUserId: input.lastAssignedUserId,
      usedFallbackSameAsExcluded: false,
    };
  }

  return {
    selectedUserId: chosen,
    newPointerUserId: chosen,
    usedFallbackSameAsExcluded: chosen === input.excludeUserId,
  };
}
