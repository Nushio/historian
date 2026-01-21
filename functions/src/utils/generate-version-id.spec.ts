import { expect } from "chai";
import { generateVersionId } from "./generate-version-id";

describe("generateVersionId", () => {
  it("should return a string of only numbers", () => {
    const versionId = generateVersionId();
    expect(versionId).to.match(/^\d+$/);
  });

  it("should return a unique version id for each call", async () => {
    const versionId1 = generateVersionId();
    // wait 10 ms
    const wait = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));
    await wait(10);
    const versionId2 = generateVersionId();
    expect(versionId1).not.equal(versionId2);
  });
});
