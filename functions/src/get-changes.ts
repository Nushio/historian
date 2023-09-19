import { DocumentData } from "firebase-admin/firestore";
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
  const customExcludedKeys =
    process.env.EXCLUDED_DOCUMENT_KEYS?.replace(" ", "")?.split(",") ?? [];
  const excludedKeys = [...defaultExcludedKeys, ...customExcludedKeys];
  const updatedKeys = Object.keys(flattenedAfter)
    .filter((key) => !excludedKeys.includes(key))
    .filter((key) => !isEqual(flattenedBefore[key], flattenedAfter[key]));

  let changes: { [key: string]: any } = {};
  let rawData: { [key: string]: any } = {};
  for (const key of updatedKeys) {
    changes[key] = {
      before: optional(flattenedBefore[key]),
      after: optional(flattenedAfter[key]),
    };
    let rawBefore = optional(before[key]);
    let rawAfter = optional(after[key]);
    let parentKey = key;
    if (key.indexOf("._") > 0) {
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

const optional = (value: unknown) => {
  if (value === undefined) return null;
  return value;
};

const defaultExcludedKeys = [""];
