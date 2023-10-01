import {
  DocumentData,
  DocumentSnapshot,
  FieldValue,
} from "firebase-admin/firestore";
import { generateVersionId } from "./generate-version-id";
import { getChanges } from "./get-changes";
import { calculateDeleteAfter } from "./calculate-deleted-after";
import { db } from ".";
import { undoChange } from "./undo-change";

export async function writeChange(
  before: DocumentSnapshot,
  after: DocumentSnapshot
) {
  const docRef = db
    .collection(
      `${after.ref.path}/${
        process.env.CHANGED_SUBCOLLECTION_NAME ?? "historian"
      }`
    )
    .doc(`v${generateVersionId()}`);
  const changes = getChanges(before.data(), after.data());

  if (changes) {
    const { changes: changeList } = changes;
    if (Object.keys(changeList).length === 1) {
      const key = Object.keys(changeList)[0];
      if (
        key === process.env.HISTORIAN_UNDO_FIELD ||
        key === process.env.HISTORIAN_REDO_FIELD
      ) {
        let action: "before" | "after" = "before";
        if (key === process.env.HISTORIAN_REDO_FIELD) {
          action = "after";
        }
        await undoChange(after.ref.path, changeList[key].after, action);
        return;
      }
    }
    const changesSnapshot = {
      ...changes,
      createdAt: FieldValue.serverTimestamp(),
    } as DocumentData;
    const deleteAfter = calculateDeleteAfter();
    if (deleteAfter) {
      changesSnapshot["deleteAfter"] = deleteAfter;
    }
    await docRef.set(changesSnapshot, { merge: true });
  }
  return;
}
