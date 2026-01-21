import {
  DocumentData,
  DocumentSnapshot,
  FieldValue,
} from "firebase-admin/firestore";
import { calculateDeleteAfter } from "./utils/calculate-deleted-after";
import { db } from "./init";
import { logInfo } from "./utils/logger";

/**
 * Writes a snapshot of a deleted document to a subcollection in Firestore.
 * @param { DocumentSnapshot } snapshot The snapshot of the deleted document.
 * @return { Promise<void> } A Promise that resolves when the snapshot has been written to Firestore.
 */
export async function writeDeleted(snapshot: DocumentSnapshot) {
  logInfo(`Saving snapshot of deleted document ${snapshot.ref.path}`);
  const data = snapshot.data();
  if (!data) {
    logInfo(`No data found for deleted document ${snapshot.ref.path}`);
    return;
  }
  const deletedSnapshot = {
    ...data,
    deletedAt: FieldValue.serverTimestamp(),
  } as DocumentData;

  const deleteAfter = calculateDeleteAfter();
  if (deleteAfter) {
    deletedSnapshot["deleteAfter"] = deleteAfter;
  }
  let subcollectionName = "historian";
  if (
    process.env.CHANGED_SUBCOLLECTION_NAME !== undefined &&
    process.env.CHANGED_SUBCOLLECTION_NAME !== "undefined"
  ) {
    subcollectionName = process.env.CHANGED_SUBCOLLECTION_NAME ?? "historian";
  }
  const docRef = db
    .collection(`${snapshot.ref.path}/${subcollectionName}`)
    .doc("deleted-snapshot");
  await docRef.set(deletedSnapshot);
}
