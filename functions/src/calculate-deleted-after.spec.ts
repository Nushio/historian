import { expect } from "chai";
import { calculateDeleteAfter } from "./calculate-deleted-after";
import { Timestamp } from "firebase-admin/firestore";

describe("calculateDeleteAfter", () => {
  it("should return a Firestore Timestamp", () => {
    process.env.DELETE_AFTER = "1";
    const deleteAfter = calculateDeleteAfter();
    expect(deleteAfter).to.not.be.null;
    expect(deleteAfter).to.be.instanceOf(Timestamp);
  });

  it("should return null if DELETE_AFTER is set to 0", () => {
    process.env.DELETE_AFTER = "0";
    const deleteAfter = calculateDeleteAfter();
    expect(deleteAfter).to.be.null; // null is a valid value for a Firestore Timestamp
  });

  it("should default to null if DELETE_AFTER is not a number", () => {
    process.env.DELETE_AFTER = "not a number";
    const deleteAfter = calculateDeleteAfter();
    expect(deleteAfter).to.be.null;
  });

  it("should default to 30 days if DELETE_AFTER is not set", () => {
    const deleteAfter = calculateDeleteAfter();
    expect(deleteAfter).to.be.null;
  });

  it("should use the value of DELETE_AFTER if set and valid", () => {
    process.env.DELETE_AFTER = "60";
    const deleteAfter = calculateDeleteAfter();
    expect(deleteAfter?.toMillis()).to.be.closeTo(
      Date.now() + 60 * 24 * 60 * 60 * 1000,
      2
    );
  });
});
