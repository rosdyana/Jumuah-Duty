import { describe, expect, it } from "vitest";
import { dateKey, excludeHolidays, getFridaysInRange } from "./fridays";

function d(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

describe("dateKey", () => {
  it("formats a UTC-midnight date as YYYY-MM-DD", () => {
    expect(dateKey(d("2026-01-02"))).toBe("2026-01-02");
  });
});

describe("excludeHolidays", () => {
  it("filters out dates present in holidayDates", () => {
    const fridays = getFridaysInRange(d("2026-01-02"), d("2026-01-23"));
    const result = excludeHolidays(fridays, [d("2026-01-09")]);
    expect(result.map(dateKey)).toEqual(["2026-01-02", "2026-01-16", "2026-01-23"]);
  });

  it("matches by calendar day value, not object identity", () => {
    const result = excludeHolidays([d("2026-01-02")], [new Date(d("2026-01-02").getTime())]);
    expect(result).toEqual([]);
  });

  it("is a no-op when there are no holidays", () => {
    const fridays = getFridaysInRange(d("2026-01-02"), d("2026-01-09"));
    expect(excludeHolidays(fridays, [])).toEqual(fridays);
  });

  it("keeps dates that don't match any holiday", () => {
    const fridays = getFridaysInRange(d("2026-01-02"), d("2026-01-09"));
    expect(excludeHolidays(fridays, [d("2026-02-01")])).toEqual(fridays);
  });
});
