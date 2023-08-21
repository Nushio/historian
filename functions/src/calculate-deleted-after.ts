import { Timestamp } from "firebase-admin/firestore";
import { error } from "firebase-functions/logger";

export function calculateDeleteAfter() {
  let deleteAfterDays = 30;
  try {
    deleteAfterDays = parseInt(process.env.DELETE_AFTER ?? "") ?? 30;
  } catch (_) {
    error("DELETE_AFTER is not a number, defaulting to 30 days");
  }
  if (deleteAfterDays === 0) {
    return null;
  }
  // Convert today, plus deleteAfterDays, to a Firestore Timestamp
  const deleteAfter = Timestamp.fromDate(
    new Date(Date.now() + deleteAfterDays * 24 * 60 * 60 * 1000)
  );
  return deleteAfter;
}
