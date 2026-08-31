export type RotationDuty = "KHATIB" | "IMAM";

export interface RotationCandidate {
  userId: string;
  rotationOrder: number;
}

export interface RotationInput {
  /** Members already filtered to isActive && has the required capability, sorted by rotationOrder. */
  members: RotationCandidate[];
  /** Users with an ACTIVE unavailability request for this schedule + duty type. */
  unavailableUserIds: Set<string>;
  /** rotation_state.lastAssignedUserId for this duty type. */
  lastAssignedUserId: string | null;
  /** Soft preference only (avoid-double-duty rule): Imam's pick excludes the already-assigned Khatib. */
  excludeUserId?: string | null;
}

export interface RotationResult {
  /** null when nobody eligible/active/available exists at all. */
  selectedUserId: string | null;
  /** Value to persist to rotation_state.lastAssignedUserId. Unchanged (== lastAssignedUserId) when selectedUserId is null. */
  newPointerUserId: string | null;
  /** True when the only available candidate was the excluded user (fairness rule yields to availability). */
  usedFallbackSameAsExcluded: boolean;
}

export type DutyType = "ROOM_BOOKING" | "KHATIB" | "IMAM";

export interface RoomBookingOutcome {
  assignedUserId: string | null;
  originalUserId: string | null;
  assignmentType: "FIXED";
  status: "ASSIGNED" | "REPLACEMENT_NEEDED";
}

export interface RotationDutyOutcome {
  assignedUserId: string | null;
  originalUserId: string | null;
  assignmentType: "ROTATION";
  status: "ASSIGNED" | "REPLACEMENT_NEEDED";
  newPointerUserId: string | null;
  usedFallbackSameAsExcluded: boolean;
}

export interface GenerationOutcome {
  roomBooking: RoomBookingOutcome;
  khatib: RotationDutyOutcome;
  imam: RotationDutyOutcome;
}

export interface GenerationDeps {
  fixedRoomBookerId: string | null;
  /** isActive && canBookRoom, evaluated by the caller. */
  roomBookerEligible: boolean;
  /** not in ACTIVE unavailability for this schedule + ROOM_BOOKING. */
  roomBookerAvailable: boolean;
  khatibInput: RotationInput;
  /** Called with the Khatib pick so Imam's input can set excludeUserId. */
  buildImamInput: (khatibSelectedUserId: string | null) => RotationInput;
}
