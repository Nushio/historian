import { Timestamp } from "firebase-admin/firestore";

/**
 * Flattens a nested object into a single-level object with dot-separated keys.
 * @param { Record<string, unknown> } doc - The object to flatten.
 * @param { string[] } prefixes - An optional array of prefixes to add to the keys of the flattened object.
 * @return { Record<string, unknown> } A new object with dot-separated keys.
 */
export const flattenDoc = (
  doc: Record<string, unknown>,
  prefixes: string[] = []
): Record<string, unknown> => {
  if (!doc) {
    return doc;
  }

  if (typeof doc === "string") {
    return { [prefixes.join(".")]: doc };
  }

  return Object.keys(doc).reduce((acc: Record<string, unknown>, key) => {
    const value = doc[key] as unknown;
    const flattenKey = [...prefixes, key].join(".");
    if (value == null) {
      acc[flattenKey] = value;
    } else if (Array.isArray(value)) {
      return {
        ...acc,
        ...value
          .map((nested, index) => {
            if (isTimestamp(nested) || isDocumentReference(nested)) {
              return {
                [`${key}.[${index}]`]: nested,
              };
            }
            return flattenDoc(nested, [...prefixes, `${key}.[${index}]`]);
          })
          .reduce((accDoc, curr) => ({ ...curr, ...accDoc }), {}),
      };
    } else if (typeof value === "object") {
      if (
        isTimestamp(value) ||
        isDocumentReference(value as Record<string, unknown>)
      ) {
        return {
          ...acc,
          [flattenKey]: value,
        };
      }
      return {
        ...acc,
        ...flattenDoc(value as Record<string, unknown>, [...prefixes, key]),
      };
    } else {
      acc[flattenKey] = doc[key];
    }

    return acc;
  }, {});
};

/**
 * Determines whether an object is a Firestore DocumentReference.
 * @param { Record<string, unknown> } object - The object to check.
 * @return { boolean } True if the object is a DocumentReference, false otherwise.
 */
const isDocumentReference = (object: Record<string, unknown>) => {
  return object["_path"] && object["_firestore"];
};

/**
 * Checks if the given object is an instance of a Firestore Timestamp.
 * @param { unknown } object - The object to check.
 * @return { boolean } Whether the object is an instance of a Firestore Timestamp.
 */
const isTimestamp = (object: unknown) => {
  return object instanceof Timestamp;
};
