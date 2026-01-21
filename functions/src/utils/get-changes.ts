import { DocumentData } from "firebase-admin/firestore";
import { isEqual } from "lodash";
import { flattenDoc } from "./flatten-doc";

/**
 * Returns an object containing the changes made to a Firestore document.
 * @param { Record<string, unknown> } before - The document data before the changes.
 * @param { DocumentData } after - The document data after the changes.
 * @return { DocumentData | null } An object containing the changes made to the document, or null if there were no changes.
 */
export const getChanges = (
  before?: Record<string, unknown>,
  after?: DocumentData
): DocumentData | null => {
  if (!before || !after) {
    return null;
  }

  const flattenedAfter = flattenDoc(after);
  const flattenedBefore = flattenDoc(before);
  const customExcludedKeys =
    process.env.EXCLUDED_DOCUMENT_KEYS?.replace(" ", "")?.split(",") ?? [];
  const excludedKeys = [...defaultExcludedKeys, ...customExcludedKeys];
  const updatedKeys = Object.keys(flattenedAfter)
    .filter((key) => !excludedKeys.includes(key))
    .filter((key) => !isEqual(flattenedBefore[key], flattenedAfter[key]));

  const changes: { [key: string]: unknown } = {};
  const rawData: { [key: string]: unknown } = {};
  for (const key of updatedKeys) {
    changes[key] = {
      before: optional(flattenedBefore[key]),
      after: optional(flattenedAfter[key]),
    };
    let rawBefore = optional(before[key]);
    let rawAfter = optional(after[key]);
    let parentKey = key;
    if (key.indexOf(".") > 0) {
      parentKey = key.split(".")[0];
      rawBefore = optional(before[parentKey]);
      rawAfter = optional(after[parentKey]);
    }

    rawData[parentKey] = {
      before: rawBefore,
      after: rawAfter,
    };
  }
  if (Object.values(changes).length === 0) {
    return null;
  }
  return {
    changes,
    rawData,
  };
};

/**
 * Returns the provided value if it is not undefined, otherwise returns null.
 * @param { unknown } value - The value to check.
 * @return { unknown | null } The provided value if it is not undefined, otherwise null.
 */
const optional = (value: unknown) => {
  if (value === undefined) return null;
  return value;
};

const defaultExcludedKeys = [""];
