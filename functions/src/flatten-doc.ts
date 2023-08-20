import { Timestamp } from 'firebase-admin/firestore';

export const flattenDoc = (doc: Record<string, unknown>, prefixes: string[] = []): Record<string, unknown> => {
  if (!doc) {
    return doc;
  }

  if (typeof doc === 'string') {
    return { [prefixes.join('.')]: doc };
  }

  return Object.keys(doc).reduce((acc: Record<string, unknown>, key) => {
    const value = doc[key] as unknown;
    const flattenKey = [...prefixes, key].join('.');
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
    } else if (typeof value === 'object') {
      if (isTimestamp(value) || isDocumentReference(value as Record<string, unknown>)) {
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

const isDocumentReference = (object: Record<string, unknown>) => {
  return object['_path'] && object['_firestore'];
};

const isTimestamp = (object: unknown) => {
  return object instanceof Timestamp;
};
