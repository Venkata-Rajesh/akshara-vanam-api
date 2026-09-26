import { describe, expect, it } from "bun:test";
import {
  canManageQuote,
  canViewQuote,
  statusAfterQuoteEdit,
  submissionStatus,
} from "../src/modules/quotes/quote.policy";
import { UserContext } from "../src/types";

const owner: UserContext = {
  id: "user-1",
  email: "writer@example.test",
  username: "Writer",
  role: "user",
};

describe("quote authorization policy", () => {
  it("requires review for anonymous and regular-user submissions", () => {
    expect(submissionStatus()).toBe("pending");
    expect(submissionStatus("user")).toBe("pending");
    expect(submissionStatus("admin")).toBe("published");
  });

  it("keeps unpublished quotes visible only to their owner or an admin", () => {
    expect(canViewQuote("pending", undefined)).toBeFalse();
    expect(canViewQuote("pending", "user-1", owner)).toBeTrue();
    expect(
      canViewQuote("pending", "user-1", { ...owner, id: "user-2" }),
    ).toBeFalse();
    expect(
      canViewQuote("rejected", undefined, { ...owner, role: "admin" }),
    ).toBeTrue();
    expect(canViewQuote("published", undefined)).toBeTrue();
  });

  it("limits quote management to owner or admin and requeues owner edits", () => {
    expect(canManageQuote("user-1", owner)).toBeTrue();
    expect(canManageQuote("user-2", owner)).toBeFalse();
    expect(canManageQuote(undefined, owner)).toBeFalse();
    expect(canManageQuote(undefined, { ...owner, role: "admin" })).toBeTrue();
    expect(statusAfterQuoteEdit("published", "user")).toBe("pending");
    expect(statusAfterQuoteEdit("published", "admin")).toBe("published");
  });
});
