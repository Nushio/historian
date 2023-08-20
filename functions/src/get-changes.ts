import { FieldValue, DocumentData } from "firebase-admin/firestore";
import { isEqual } from "lodash";
import { flattenDoc } from "./flatten-doc";

export const getChanges = (
  before?: Record<string, unknown>,
  after?: DocumentData
) => {
  if (!before || !after) {
    return null;
  }

  const flattenedAfter = flattenDoc(after);
  const flattenedBefore = flattenDoc(before);
  const updatedKeys = Object.keys(flattenedAfter)
    .filter((key) => !excludedKeys.includes(key))
    .filter((key) => !isEqual(flattenedBefore[key], flattenedAfter[key]));

  const changes = updatedKeys.map((key) => ({
    key,
    before: optional(flattenedBefore[key]),
    after: optional(flattenedAfter[key]),
  }));

  if (changes.length === 0) {
    return null;
  }

  return {
    changes,
    updatedAt: FieldValue.serverTimestamp(),
  };
};

const optional = (value: unknown) => {
  if (value === undefined) return null;
  return value;
};

const excludedKeys = ["updatedAt"];
