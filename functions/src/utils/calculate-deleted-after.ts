import { Timestamp } from "firebase-admin/firestore";
import { logWarn } from "./logger";

/**
 * Calculates the date after which a document should be deleted from Firestore.
 * The number of days after which a document should be deleted is determined by the DELETE_AFTER environment variable.
 * If DELETE_AFTER is not set or is not a number, the default value of 0 days is used.
 * If DELETE_AFTER is set to 0, null is returned to indicate that the document should not be deleted.
 * @return {Timestamp | null} A Firestore Timestamp representing the date after which the document should be deleted, or null if the document should not be deleted.
 */
export function calculateDeleteAfter(): Timestamp | null {
  let deleteAfterDays = 0;
  try {
    if (!process.env?.DELETE_AFTER) return null;

    deleteAfterDays = parseInt(process.env.DELETE_AFTER ?? "") ?? 0;

    if (isNaN(deleteAfterDays)) {
      logWarn("DELETE_AFTER is not a number, defaulting to null");
      return null;
    }
  } catch (_) {
    logWarn("DELETE_AFTER is not a number, defaulting to null");
    return null;
  }
  if (deleteAfterDays === 0) {
    return null;
  }
  // Convert today, plus deleteAfterDays, to a Firestore Timestamp
  const deleteAfter = Timestamp.fromDate(
    new Date(Date.now() + deleteAfterDays * 24 * 60 * 60 * 1000),
  );
  return deleteAfter;
}
