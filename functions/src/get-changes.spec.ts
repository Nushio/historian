import { expect } from "chai";
import { getChanges } from "./get-changes";
import { GeoPoint } from "firebase-admin/firestore";

describe("getChanges", () => {
  it("should return null if before or after is not defined", () => {
    expect(getChanges(undefined, undefined)).to.be.null;
    expect(getChanges({ foo: "bar" }, undefined)).to.be.null;
    expect(getChanges(undefined, { foo: "bar" })).to.be.null;
  });

  it("should return null if there are no changes", () => {
    const before = { foo: "bar", baz: 123 };
    const after = { foo: "bar", baz: 123 };
    expect(getChanges(before, after)).to.be.null;
  });

  it("should return the changes made to the document", () => {
    const before = { foo: "bar", baz: 123 };
    const after = { foo: "bar", baz: 456 };
    expect(getChanges(before, after)).to.deep.equal({
      changes: {
        baz: {
          before: 123,
          after: 456,
        },
      },
      rawData: {
        baz: {
          before: 123,
          after: 456,
        },
      },
    });
  });

  it("should exclude keys specified in the EXCLUDED_DOCUMENT_KEYS environment variable", () => {
    process.env.EXCLUDED_DOCUMENT_KEYS = "foo";
    const before = { foo: "bar", baz: 123 };
    const after = { foo: "baz", baz: 456 };
    expect(getChanges(before, after)).to.deep.equal({
      changes: {
        baz: {
          before: 123,
          after: 456,
        },
      },
      rawData: {
        baz: {
          before: 123,
          after: 456,
        },
      },
    });
    delete process.env.EXCLUDED_DOCUMENT_KEYS;
  });

  it("should handle nested objects", () => {
    const before = { foo: { bar: "baz" } };
    const after = { foo: { bar: "qux" } };
    expect(getChanges(before, after)).to.deep.equal({
      changes: {
        "foo.bar": {
          before: "baz",
          after: "qux",
        },
      },
      rawData: {
        foo: {
          before: { bar: "baz" },
          after: { bar: "qux" },
        },
      },
    });
  });

  it("should handle geopoint objects", () => {
    const before = { foo: new GeoPoint(1, 2) };
    const after = { foo: new GeoPoint(3, 4) };
    expect(getChanges(before, after)).to.deep.equal({
      changes: {
        "foo._latitude": {
          after: 3,
          before: 1,
        },
        "foo._longitude": {
          after: 4,
          before: 2,
        },
      },
      rawData: {
        foo: {
          after: { _latitude: 3, _longitude: 4 },
          before: { _latitude: 1, _longitude: 2 },
        },
      },
    });
  });
});
